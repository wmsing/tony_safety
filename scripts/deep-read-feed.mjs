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
const wireMdZhDir = path.join(root, 'data', 'wire-deep-zh');
const wireHtmlDir = path.join(root, 'data', 'wire-html');
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

function feedHostname(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

function isFetchBlockedError(message) {
  return /HTTP (403|404)\b/.test(message);
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
  const refetch = argv.includes('--refetch');
  const zhOnly = argv.includes('--zh-only') || argv.includes('--no-en');
  const enOnly = argv.includes('--en-only');
  const translateEn = !zhOnly || enOnly;
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
  return {
    latest,
    id,
    continueOnError,
    summarizeOnly,
    forceSummary,
    refetch,
    translateEn,
    enOnly,
  };
}

function wireHtmlPaths(id) {
  return {
    html: path.join(wireHtmlDir, `${id}.html`),
    meta: path.join(wireHtmlDir, `${id}.json`),
  };
}

async function readCachedHtml(id, url) {
  const { html: htmlPath, meta: metaPath } = wireHtmlPaths(id);
  try {
    const meta = JSON.parse(await readFile(metaPath, 'utf8'));
    if (meta.url !== url) return null;
    const html = await readFile(htmlPath, 'utf8');
    if (!html.trim()) return null;
    return { html, fetchedAt: meta.fetchedAt ?? null };
  } catch {
    return null;
  }
}

async function writeCachedHtml(id, url, html) {
  await mkdir(wireHtmlDir, { recursive: true });
  const { html: htmlPath, meta: metaPath } = wireHtmlPaths(id);
  const fetchedAt = new Date().toISOString();
  await writeFile(htmlPath, html, 'utf8');
  await writeFile(
    metaPath,
    `${JSON.stringify({ url, fetchedAt }, null, 2)}\n`,
    'utf8',
  );
  return fetchedAt;
}

/** Network once per id+url; later runs read data/wire-html/ unless --refetch. */
async function loadHtmlForItem(item, refetch) {
  if (!refetch) {
    const cached = await readCachedHtml(item.id, item.url);
    if (cached) {
      return { html: cached.html, fromCache: true, htmlFetchedAt: cached.fetchedAt };
    }
  }
  const html = await fetchHtml(item.url);
  const htmlFetchedAt = await writeCachedHtml(item.id, item.url, html);
  return { html, fromCache: false, htmlFetchedAt };
}

const BROWSER_FETCH_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8',
  'Cache-Control': 'no-cache',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
};

async function fetchHtml(url) {
  let referer = '';
  try {
    referer = new URL(url).origin + '/';
  } catch {
    /* ignore */
  }
  const res = await undiciFetch(url, {
    redirect: 'follow',
    dispatcher: fetchAgent,
    headers: {
      ...BROWSER_FETCH_HEADERS,
      ...(referer ? { Referer: referer } : {}),
    },
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

async function translateBodyChunkToZh(host, model, chunk) {
  const res = await ollamaFetch(`${host.replace(/\/$/, '')}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    dispatcher: ollamaAgent,
    body: JSON.stringify({
      model,
      stream: false,
      think: false,
      options: {
        temperature: 0.2,
        num_predict: Math.min(8192, Math.max(1024, Math.ceil(chunk.length * 0.9))),
      },
      messages: [
        {
          role: 'system',
          content:
            'Translate the following English markdown into Simplified Chinese.\n' +
            'Preserve markdown structure: headings, lists, links, code fences.\n' +
            'Keep URLs unchanged; company/product/CVE names may stay in English when natural.\n' +
            'Output markdown only, no preamble.',
        },
        { role: 'user', content: chunk },
      ],
    }),
  });
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Ollama HTTP ${res.status}: ${errBody.slice(0, 200)}`);
  }
  const payload = await res.json();
  const content = (payload.message?.content ?? payload.response ?? '').trim();
  if (!content) {
    throw new Error('empty Ollama body-zh response');
  }
  return stripModelNoise(content);
}

async function translateBodyToZh(host, model, bodyMd) {
  const CHUNK = 6000;
  const parts = [];
  let rest = bodyMd.trim();
  while (rest.length > CHUNK) {
    let cut = rest.lastIndexOf('\n\n', CHUNK);
    if (cut < CHUNK / 2) cut = CHUNK;
    parts.push(rest.slice(0, cut));
    rest = rest.slice(cut).trimStart();
  }
  if (rest) parts.push(rest);
  const out = [];
  for (const part of parts) {
    out.push(await translateBodyChunkToZh(host, model, part));
  }
  return out.join('\n\n').trim();
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
      // qwen3.5 等 thinking 模型默认只写 message.thinking，content 为空
      think: false,
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
  if (!content) {
    const hadThinking = Boolean(payload.message?.thinking?.trim());
    throw new Error(
      hadThinking
        ? 'empty Ollama message.content (thinking model? use think:false or OLLAMA_DEEP_READ_MODEL=qwen3:4b-instruct)'
        : 'empty Ollama response',
    );
  }
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

function summarySourceHash(summaryMd) {
  return contentHash(summaryMd.trim());
}

function isDoneEn(cache, id, summaryMdZh) {
  const prev = cache.byId[id];
  if (!prev?.summaryMdEn?.trim()) return false;
  return prev.summarySourceHash === summarySourceHash(summaryMdZh);
}

function isDoneBodyZh(cache, id, hash) {
  const prev = cache.byId[id];
  return prev?.bodyZhContentHash === hash;
}

async function translateSummaryToEn(host, model, summaryMdZh) {
  const res = await ollamaFetch(`${host.replace(/\/$/, '')}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    dispatcher: ollamaAgent,
    body: JSON.stringify({
      model,
      stream: false,
      think: false,
      options: {
        temperature: 0.3,
        num_predict: 512,
      },
      messages: [
        {
          role: 'system',
          content:
            'Translate the following Simplified Chinese wire deep-read markdown into English.\n' +
            'Keep markdown structure: intro paragraphs (no extra title), then ## Key points, then ## What to do next.\n' +
            'Keep company names, CVE IDs, and URLs unchanged. Output markdown only.',
        },
        { role: 'user', content: summaryMdZh },
      ],
    }),
  });
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Ollama HTTP ${res.status}: ${errBody.slice(0, 200)}`);
  }
  const payload = await res.json();
  const content = (payload.message?.content ?? payload.response ?? '').trim();
  if (!content) {
    throw new Error('empty Ollama EN response');
  }
  return stripModelNoise(content);
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
  const {
    latest,
    id: onlyId,
    continueOnError,
    summarizeOnly,
    forceSummary,
    refetch,
    translateEn,
    enOnly,
  } = parseArgs(argv);

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
    );
  }

  let skipped = 0;
  for (const item of candidates) {
    const onDiskHash = await bodyHashFromDisk(item.id);
    if (!forceSummary && onDiskHash && isDone(cache, item.id, onDiskHash)) {
      skipped += 1;
    }
  }

  const modeLabel = enOnly
    ? 'en-only'
    : summarizeOnly
      ? 'summarize-only'
      : 'fetch';
  const targetLabel = onlyId ? '1 id' : `ok ${latest}`;
  const enNote = translateEn ? ' · +en' : '';
  console.log(
    `[deep-read-feed] model=${model} @ ${host} · ${modeLabel}${enNote} · target ${targetLabel} · pool ${candidates.length} (already done ${skipped})`,
  );

  let ok = 0;
  let failed = 0;
  const blockedHosts = new Set();
  const runStarted = Date.now();

  for (const item of candidates) {
    if (!onlyId && ok >= latest) break;

    const itemHost = feedHostname(item.url);
    if (!onlyId && itemHost && blockedHosts.has(itemHost)) {
      console.log(`[deep-read-feed] skip ${item.id} (host ${itemHost} blocked this run)`);
      continue;
    }

    const onDiskHash = await bodyHashFromDisk(item.id);
    if (summarizeOnly && !onDiskHash) {
      console.error(
        `[deep-read-feed] ${item.id}: no data/wire-deep/${item.id}.md (--summarize-only)`,
      );
      if (!continueOnError) process.exit(1);
      continue;
    }
    const summaryZh = cache.byId[item.id]?.summaryMd?.trim() ?? '';
    const zhBodyDone = Boolean(onDiskHash && isDone(cache, item.id, onDiskHash));
    const bodyZhDone = Boolean(onDiskHash && isDoneBodyZh(cache, item.id, onDiskHash));
    const enDone =
      translateEn && summaryZh && isDoneEn(cache, item.id, summaryZh);

    if (!translateEn && !forceSummary && zhBodyDone && bodyZhDone) {
      continue;
    }
    if (translateEn && !forceSummary && zhBodyDone && enDone && bodyZhDone) {
      continue;
    }

    const itemStarted = Date.now();
    try {
      // 1) 中文精读已齐、仅缺英文：先译 EN（不抓站、不重算中文）
      const enBackfillOnly =
        translateEn &&
        summaryZh &&
        zhBodyDone &&
        !isDoneEn(cache, item.id, summaryZh);

      if (enBackfillOnly && (enOnly || !forceSummary)) {
        const summaryMdEn = await translateSummaryToEn(host, model, summaryZh);
        cache.byId[item.id] = {
          ...cache.byId[item.id],
          summaryMdEn,
          summarySourceHash: summarySourceHash(summaryZh),
          translatedAtEn: new Date().toISOString(),
          url: item.url,
        };
        await enqueuePersist(cache);
        console.log(
          `[deep-read-feed] ok en (backfill) ${item.id} (${formatDuration(Date.now() - itemStarted)})`,
        );
        if (enOnly) {
          ok += 1;
          continue;
        }
      }

      // 2) 中英已一致或正文要更新：先中文精读，再译 EN
      if (!enOnly) {
        const mdPath = path.join(wireMdDir, `${item.id}.md`);
        let md;
        let fetchedAt = new Date().toISOString();

        if (summarizeOnly) {
          const raw = await readFile(mdPath, 'utf8');
          const parsed = parseFrontmatter(raw);
          md = pruneWireMarkdown(parsed.body);
          if (parsed.fetchedAt) fetchedAt = parsed.fetchedAt.replace(/^["']|["']$/g, '');
        } else if (!zhBodyDone || forceSummary) {
          const { html, fromCache, htmlFetchedAt } = await loadHtmlForItem(item, refetch);
          if (fromCache) {
            console.log(`[deep-read-feed] ${item.id} html cache`);
          }
          const { md: rawMd } = htmlToMarkdown(html, item.url);
          md = pruneWireMarkdown(rawMd);
          if (htmlFetchedAt) fetchedAt = htmlFetchedAt;
        } else {
          md = null;
        }

        if (md !== null) {
          if (md.length < MIN_BODY_CHARS) {
            throw new Error(`body too short (${md.length} chars)`);
          }
          const hash = contentHash(md);
          if (!forceSummary && isDone(cache, item.id, hash)) {
            console.log(`[deep-read-feed] skip ${item.id} zh (unchanged)`);
          } else {
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
              ...cache.byId[item.id],
              contentHash: hash,
              summaryMd,
              summarizedAt: new Date().toISOString(),
              url: item.url,
            };
            await enqueuePersist(cache);
            console.log(
              `[deep-read-feed] ok zh ${item.id} (${formatDuration(Date.now() - itemStarted)})`,
            );
          }
        }
      }

      if (translateEn) {
        const summaryZhAfter = cache.byId[item.id]?.summaryMd?.trim();
        if (!summaryZhAfter) {
          throw new Error('no Chinese summary — run zh deep-read first');
        }
        if (!forceSummary && isDoneEn(cache, item.id, summaryZhAfter)) {
          console.log(`[deep-read-feed] skip ${item.id} en (unchanged)`);
        } else {
          const summaryMdEn = await translateSummaryToEn(host, model, summaryZhAfter);
          cache.byId[item.id] = {
            ...cache.byId[item.id],
            summaryMdEn,
            summarySourceHash: summarySourceHash(summaryZhAfter),
            translatedAtEn: new Date().toISOString(),
            url: item.url,
          };
          await enqueuePersist(cache);
          console.log(
            `[deep-read-feed] ok en ${item.id} (${formatDuration(Date.now() - itemStarted)})`,
          );
        }
      }

      if (!enOnly) {
        const hash =
          cache.byId[item.id]?.contentHash ?? (await bodyHashFromDisk(item.id));
        if (!hash) {
          throw new Error('no contentHash — run zh deep-read first');
        }
        if (!forceSummary && isDoneBodyZh(cache, item.id, hash)) {
          console.log(`[deep-read-feed] skip ${item.id} body zh (unchanged)`);
        } else {
          const mdPath = path.join(wireMdDir, `${item.id}.md`);
          const raw = await readFile(mdPath, 'utf8');
          const { body, fetchedAt } = parseFrontmatter(raw);
          if (!body.trim()) {
            throw new Error('empty wire-deep body');
          }
          const bodyZh = await translateBodyToZh(host, model, body);
          await mkdir(wireMdZhDir, { recursive: true });
          const mdFile = buildWireMdFile(
            {
              id: item.id,
              title: item.title,
              url: item.url,
              sourceId: item.sourceId,
              sourceLabel: item.sourceLabel,
              publishedAt: item.publishedAt,
              fetchedAt: fetchedAt?.replace(/^["']|["']$/g, '') ?? new Date().toISOString(),
            },
            bodyZh,
          );
          await writeFile(path.join(wireMdZhDir, `${item.id}.md`), mdFile, 'utf8');
          cache.byId[item.id] = {
            ...cache.byId[item.id],
            bodyZhContentHash: hash,
            translatedBodyAt: new Date().toISOString(),
            url: item.url,
          };
          await enqueuePersist(cache);
          console.log(
            `[deep-read-feed] ok body zh ${item.id} (${formatDuration(Date.now() - itemStarted)})`,
          );
        }
      }

      ok += 1;
    } catch (err) {
      failed += 1;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(
        `[deep-read-feed] ${item.id} failed (${formatDuration(Date.now() - itemStarted)}): ${msg}`,
      );
      if (isFetchBlockedError(msg) && itemHost) {
        blockedHosts.add(itemHost);
      }
      const recoverable = isFetchBlockedError(msg) || continueOnError;
      if (!recoverable) {
        await writeChain;
        process.exit(1);
      }
    }
  }

  await writeChain;
  console.log(
    `[deep-read-feed] done in ${formatDuration(Date.now() - runStarted)} · ok ${ok}, already done ${skipped}, failed ${failed} → data/feed-deep.json`,
  );
  if (!onlyId && ok < latest) {
    console.error(
      `[deep-read-feed] only ${ok}/${latest} succeeded (403/404 hosts skipped: ${[...blockedHosts].join(', ') || 'none'})`,
    );
  }
  if (failed > 0 && continueOnError) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
