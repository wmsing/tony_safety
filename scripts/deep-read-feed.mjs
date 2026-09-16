import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readability } from '@mozilla/readability';
import { parseHTML } from 'linkedom';
import TurndownService from 'turndown';
import { Agent, fetch as undiciFetch } from 'undici';

const ollamaFetch = undiciFetch;
const ollamaAgent = new Agent({
  headersTimeout: 600_000,
  bodyTimeout: 600_000,
  connectTimeout: 30_000,
});

const fetchAgent = new Agent({
  headersTimeout: 60_000,
  bodyTimeout: 120_000,
  connectTimeout: 30_000,
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const feedPath = path.join(root, 'data', 'feed-external.json');
const deepPath = path.join(root, 'data', 'feed-deep.json');
const wireMdDir = path.join(root, 'data', 'wire-deep');
const envPath = path.join(root, '.env');

const MAX_HTML_BYTES = 2 * 1024 * 1024;
const MIN_BODY_CHARS = 200;
const MODEL_BODY_CHARS = 8_000;

/** Tail sections dropped after Readability (site-agnostic). */
const PRUNE_TAIL_HEADING_KEYWORDS = [
  'footnotes',
  'references',
  'bibliography',
  'contact',
  'purpose',
  'disclaimer',
  'endorsement',
];

const turndown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });

function formatDuration(ms) {
  const sec = Math.max(0, Math.round(ms / 1000));
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s ? `${m}m ${s}s` : `${m}m`;
}

function contentHash(body) {
  return createHash('sha256').update(body).digest('hex').slice(0, 16);
}

function yamlQuote(value) {
  const s = String(value);
  if (/[\n:"'\\]/.test(s)) {
    return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }
  return s;
}

function buildWireMdFile(meta, body) {
  const fm = [
    '---',
    `id: ${yamlQuote(meta.id)}`,
    `title: ${yamlQuote(meta.title)}`,
    `url: ${yamlQuote(meta.url)}`,
    `sourceId: ${yamlQuote(meta.sourceId)}`,
    `sourceLabel: ${yamlQuote(meta.sourceLabel)}`,
    `publishedAt: ${yamlQuote(meta.publishedAt)}`,
    `fetchedAt: ${yamlQuote(meta.fetchedAt)}`,
    '---',
    '',
  ].join('\n');
  return `${fm}${body.trim()}\n`;
}

function parseFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) return { body: raw.trim(), fetchedAt: null };
  const fetchedAt = m[1].match(/^fetchedAt:\s*(.+)$/m)?.[1]?.trim() ?? null;
  return { body: m[2].trim(), fetchedAt };
}

function normalizeHeadingTitle(title) {
  return title.replace(/[*_]/g, '').trim().toLowerCase();
}

function headingIsTailSection(title) {
  const norm = normalizeHeadingTitle(title);
  return PRUNE_TAIL_HEADING_KEYWORDS.some((kw) => norm.includes(kw));
}

function pruneWireMarkdown(md) {
  const lines = md.split('\n');
  const kept = [];
  for (const line of lines) {
    const m = line.match(/^#{1,4}\s+(.+)$/);
    if (m && headingIsTailSection(m[1])) {
      break;
    }
    kept.push(line);
  }
  return kept.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

async function loadDotEnv() {
  try {
    const raw = await readFile(envPath, 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
  } catch {
    /* no .env */
  }
}

function parseArgs(argv) {
  const continueOnError = argv.includes('--continue-on-error');
  const summarizeOnly = argv.includes('--summarize-only');
  const forceSummary = argv.includes('--force-summary');
  let latest = 5;
  let id = null;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--latest' && argv[i + 1]) {
      latest = Math.max(1, Number.parseInt(argv[++i], 10) || 5);
    } else if (a.startsWith('--latest=')) {
      latest = Math.max(1, Number.parseInt(a.slice('--latest='.length), 10) || 5);
    } else if (a === '--id' && argv[i + 1]) {
      id = argv[++i];
    } else if (a.startsWith('--id=')) {
      id = a.slice('--id='.length);
    }
  }
  return { latest, id, continueOnError, summarizeOnly, forceSummary };
}

async function fetchHtml(url) {
  const res = await undiciFetch(url, {
    redirect: 'follow',
    dispatcher: fetchAgent,
    headers: { 'User-Agent': 'tony_safty-deep-read/1.0' },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const reader = res.body.getReader();
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > MAX_HTML_BYTES) {
      throw new Error(`response exceeds ${MAX_HTML_BYTES} bytes`);
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString('utf8');
}

function htmlToMarkdown(html, pageUrl) {
  const { document } = parseHTML(html);
  const reader = new Readability(document, { url: pageUrl });
  const article = reader.parse();
  if (!article?.content) {
    throw new Error('readability: no article content');
  }
  const title = article.title?.trim() || '';
  const md = turndown.turndown(article.content).trim();
  return { title, md };
}

function stripModelNoise(text) {
  return text
    .replace(/[\s\S]*?<\/think>/gi, '')
    .replace(/^```(?:markdown|md)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

async function summarizeOne(host, model, title, url, bodyMd) {
  const excerpt = bodyMd.length > MODEL_BODY_CHARS
    ? `${bodyMd.slice(0, MODEL_BODY_CHARS)}\n\n[正文已截断，仅前 ${MODEL_BODY_CHARS} 字送入模型]`
    : bodyMd;

  const res = await ollamaFetch(`${host.replace(/\/$/, '')}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    dispatcher: ollamaAgent,
    body: JSON.stringify({
      model,
      stream: false,
      options: {
        temperature: 0.3,
        num_predict: 512,
      },
      messages: [
        {
          role: 'system',
          content:
            '你是 LLM/网络安全资讯编辑，读者有 ADHD，需要极简、可扫读的简体中文精读。\n\n' +
            '硬性规则：\n' +
            '- 只根据用户提供的正文写，禁止编造事实、数字、引语\n' +
            '- 全文简体中文；公司名、CVE、产品名可保留英文\n' +
            '- 不要输出推理过程或 think 标签，不要 JSON，不要用代码围栏包裹全文\n' +
            '- 单条要点 ≤30 字；禁止「综上所述」「值得关注」等空话\n\n' +
            '输出结构：\n' +
            '开头 1–2 句导语（纯段落，不要任何 ## 标题，不要用「先看这句」字样）。\n\n' +
            '## 要点\n' +
            '- 3 条要点，动词开头，信息密度高\n\n' +
            '## 行动提示\n' +
            '- 1～2 条：读者若要跟进可以做什么（读原文、内部分享、监测指标等）',
        },
        {
          role: 'user',
          content: `标题：${title}\n链接：${url}\n\n正文（Markdown）：\n${excerpt}`,
        },
      ],
    }),
  });
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Ollama HTTP ${res.status}: ${errBody.slice(0, 200)}`);
  }
  const payload = await res.json();
  const content = (payload.message?.content ?? payload.response ?? '').trim();
  if (!content) throw new Error('empty Ollama response');
  return stripModelNoise(content);
}

async function loadJson(pathname, fallback) {
  try {
    const raw = await readFile(pathname, 'utf8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

let writeChain = Promise.resolve();

async function persistCache(cache) {
  await mkdir(path.dirname(deepPath), { recursive: true });
  cache.version = 1;
  await writeFile(deepPath, `${JSON.stringify(cache, null, 2)}\n`, 'utf8');
}

function enqueuePersist(cache) {
  writeChain = writeChain.then(() => persistCache(cache));
  return writeChain;
}

function installSignalFlush(getCache) {
  let flushing = false;
  const onSignal = (signal) => {
    if (flushing) return;
    flushing = true;
    console.error(`[deep-read-feed] ${signal}, saving cache…`);
    void writeChain
      .then(() => persistCache(getCache()))
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        process.exit(signal === 'SIGINT' ? 130 : 143);
      });
  };
  process.once('SIGINT', () => onSignal('SIGINT'));
  process.once('SIGTERM', () => onSignal('SIGTERM'));
}

function isDone(cache, id, hash) {
  const prev = cache.byId[id];
  return Boolean(prev?.summaryMd && prev.contentHash === hash);
}

async function bodyHashFromDisk(id) {
  const filePath = path.join(wireMdDir, `${id}.md`);
  try {
    const raw = await readFile(filePath, 'utf8');
    const { body } = parseFrontmatter(raw);
    return contentHash(pruneWireMarkdown(body));
  } catch {
    return null;
  }
}

async function runSelfCheck() {
  const samplePath = path.join(wireMdDir, 'cffee32c5fe965c9.md');
  const raw = await readFile(samplePath, 'utf8');
  const { body } = parseFrontmatter(raw);
  const pruned = pruneWireMarkdown(body);
  if (pruned.length >= body.length) {
    throw new Error('self-check: expected prune to shorten CISA sample');
  }
  if (/^##\s+.*references/im.test(pruned)) {
    throw new Error('self-check: references section still present');
  }
  if (/CybersecurityReports@nsa\.gov/i.test(pruned)) {
    throw new Error('self-check: contact block still present');
  }
  console.log(
    `[deep-read-feed] self-check ok · ${body.length} → ${pruned.length} chars`,
  );
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.includes('--self-check')) {
    await runSelfCheck();
    return;
  }

  await loadDotEnv();
  const { latest, id: onlyId, continueOnError, summarizeOnly, forceSummary } =
    parseArgs(argv);

  const host = process.env.OLLAMA_HOST ?? 'http://127.0.0.1:11434';
  const model =
    process.env.OLLAMA_DEEP_READ_MODEL?.trim() ||
    process.env.OLLAMA_MODEL?.trim() ||
    '';
  if (!model) {
    console.error(
      '[deep-read-feed] set OLLAMA_DEEP_READ_MODEL or OLLAMA_MODEL in .env (see .env.example)',
    );
    process.exit(1);
  }

  const feed = await loadJson(feedPath, null);
  if (!feed?.items?.length) {
    console.error('[deep-read-feed] no items in data/feed-external.json — run fetch-feeds first');
    process.exit(1);
  }

  const cache = await loadJson(deepPath, { version: 1, byId: {} });
  if (!cache.byId || typeof cache.byId !== 'object') cache.byId = {};

  installSignalFlush(() => cache);

  const byId = new Map(feed.items.map((item) => [item.id, item]));
  let candidates;
  if (onlyId) {
    const one = byId.get(onlyId);
    if (!one) {
      console.error(`[deep-read-feed] unknown id ${onlyId}`);
      process.exit(1);
    }
    candidates = [one];
  } else {
    candidates = [...feed.items].sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    ).slice(0, latest);
  }

  const todo = [];
  let skipped = 0;
  for (const item of candidates) {
    const onDiskHash = await bodyHashFromDisk(item.id);
    if (summarizeOnly && !onDiskHash) {
      console.error(
        `[deep-read-feed] ${item.id}: no data/wire-deep/${item.id}.md (--summarize-only)`,
      );
      if (!continueOnError) process.exit(1);
      continue;
    }
    if (!forceSummary && onDiskHash && isDone(cache, item.id, onDiskHash)) {
      skipped += 1;
      continue;
    }
    todo.push(item);
  }

  const modeLabel = summarizeOnly ? 'summarize-only' : 'fetch';
  console.log(
    `[deep-read-feed] model=${model} @ ${host} · ${modeLabel} · window ${candidates.length} · process ${todo.length} (skip ${skipped})`,
  );

  let ok = 0;
  let failed = 0;
  const runStarted = Date.now();

  for (const item of todo) {
    const itemStarted = Date.now();
    try {
      const mdPath = path.join(wireMdDir, `${item.id}.md`);
      let md;
      let fetchedAt = new Date().toISOString();

      if (summarizeOnly) {
        const raw = await readFile(mdPath, 'utf8');
        const parsed = parseFrontmatter(raw);
        md = pruneWireMarkdown(parsed.body);
        if (parsed.fetchedAt) fetchedAt = parsed.fetchedAt.replace(/^["']|["']$/g, '');
      } else {
        const html = await fetchHtml(item.url);
        const { md: rawMd } = htmlToMarkdown(html, item.url);
        md = pruneWireMarkdown(rawMd);
      }

      if (md.length < MIN_BODY_CHARS) {
        throw new Error(`body too short (${md.length} chars)`);
      }
      const hash = contentHash(md);
      if (!forceSummary && isDone(cache, item.id, hash)) {
        skipped += 1;
        console.log(`[deep-read-feed] skip ${item.id} (unchanged)`);
        continue;
      }

      await mkdir(wireMdDir, { recursive: true });
      const mdFile = buildWireMdFile(
        {
          id: item.id,
          title: item.title,
          url: item.url,
          sourceId: item.sourceId,
          sourceLabel: item.sourceLabel,
          publishedAt: item.publishedAt,
          fetchedAt: summarizeOnly ? fetchedAt : new Date().toISOString(),
        },
        md,
      );
      await writeFile(mdPath, mdFile, 'utf8');

      const summaryMd = await summarizeOne(host, model, item.title, item.url, md);
      cache.byId[item.id] = {
        contentHash: hash,
        summaryMd,
        summarizedAt: new Date().toISOString(),
        url: item.url,
      };
      await enqueuePersist(cache);
      ok += 1;
      console.log(
        `[deep-read-feed] ok ${item.id} (${formatDuration(Date.now() - itemStarted)})`,
      );
    } catch (err) {
      failed += 1;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(
        `[deep-read-feed] ${item.id} failed (${formatDuration(Date.now() - itemStarted)}): ${msg}`,
      );
      if (!continueOnError) {
        await writeChain;
        process.exit(1);
      }
    }
  }

  await writeChain;
  console.log(
    `[deep-read-feed] done in ${formatDuration(Date.now() - runStarted)} · ok ${ok}, skipped ${skipped}, failed ${failed} → data/feed-deep.json`,
  );
  if (failed > 0 && continueOnError) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
