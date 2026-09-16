import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Agent, fetch as undiciFetch } from 'undici';
import { wireIdsOnHomepage } from './feed-display-wire-ids.mjs';

/** Local qwen3.5:9b can exceed Node fetch default 300s headers timeout. */
const ollamaFetch = undiciFetch;
const ollamaAgent = new Agent({
  headersTimeout: 600_000,
  bodyTimeout: 600_000,
  connectTimeout: 30_000,
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const feedPath = path.join(root, 'data', 'feed-external.json');
const i18nPath = path.join(root, 'data', 'feed-i18n.json');
const envPath = path.join(root, '.env');

function formatDuration(ms) {
  const sec = Math.max(0, Math.round(ms / 1000));
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s ? `${m}m ${s}s` : `${m}m`;
}

function sourceHash(title, summary) {
  return createHash('sha256')
    .update(`${title}\n${summary}`)
    .digest('hex')
    .slice(0, 16);
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

function parseTranslationJson(text) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonText = fenced ? fenced[1].trim() : trimmed;
  const data = JSON.parse(jsonText);
  if (typeof data.titleZh !== 'string' || typeof data.summaryZh !== 'string') {
    throw new Error('missing titleZh or summaryZh');
  }
  return { titleZh: data.titleZh.trim(), summaryZh: data.summaryZh.trim() };
}

async function translateOne(host, model, title, summary) {
  const res = await ollamaFetch(`${host.replace(/\/$/, '')}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    dispatcher: ollamaAgent,
    body: JSON.stringify({
      model,
      stream: false,
      messages: [
        {
          role: 'system',
          content:
            'Translate English to Simplified Chinese (zh-Hans). Keep proper nouns, product names, CVE IDs, and URLs unchanged. Reply with JSON only, no markdown: {"titleZh":"...","summaryZh":"..."}',
        },
        {
          role: 'user',
          content: `Title:\n${title}\n\nSummary:\n${summary}`,
        },
      ],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Ollama HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
  const payload = await res.json();
  const content = payload.message?.content ?? payload.response ?? '';
  if (!content) throw new Error('empty Ollama response');
  return parseTranslationJson(content);
}

async function loadJson(pathname, fallback) {
  try {
    const raw = await readFile(pathname, 'utf8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/** Serializes full-cache writes (per-item persist + SIGINT flush). */
let writeChain = Promise.resolve();

async function persistCache(cache) {
  await mkdir(path.dirname(i18nPath), { recursive: true });
  cache.version = 1;
  await writeFile(i18nPath, `${JSON.stringify(cache, null, 2)}\n`, 'utf8');
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
    console.error(`[translate-feed] ${signal}, saving cache…`);
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

async function runPool(items, concurrency, worker) {
  let index = 0;
  const runners = Array.from({ length: concurrency }, async () => {
    while (index < items.length) {
      const i = index++;
      await worker(items[i], i);
    }
  });
  await Promise.all(runners);
}

async function main() {
  await loadDotEnv();

  const host = process.env.OLLAMA_HOST ?? 'http://127.0.0.1:11434';
  const model = process.env.OLLAMA_MODEL;
  if (!model) {
    console.error('[translate-feed] set OLLAMA_MODEL in .env (see .env.example)');
    process.exit(1);
  }
  const concurrency = Math.max(
    1,
    Number.parseInt(process.env.TRANSLATE_CONCURRENCY ?? '1', 10) || 1,
  );
  const continueOnError = process.argv.includes('--continue-on-error');

  const feed = await loadJson(feedPath, null);
  if (!feed?.items?.length) {
    console.error('[translate-feed] no items in data/feed-external.json — run fetch-feeds first');
    process.exit(1);
  }

  const cache = await loadJson(i18nPath, { version: 1, byId: {} });
  if (!cache.byId || typeof cache.byId !== 'object') cache.byId = {};

  installSignalFlush(() => cache);

  const visibleWireIds = await wireIdsOnHomepage(feed.items);

  const todo = [];
  let skipped = 0;
  let ignoredOffHomepage = 0;
  for (const item of feed.items) {
    if (!visibleWireIds.has(item.id)) {
      ignoredOffHomepage += 1;
      continue;
    }
    const hash = sourceHash(item.title, item.summary);
    const prev = cache.byId[item.id];
    if (prev?.titleZh && prev?.summaryZh && prev.sourceHash === hash) {
      skipped += 1;
      continue;
    }
    todo.push({ item, hash });
  }

  console.log(
    `[translate-feed] model=${model} @ ${host} · wire on homepage ${visibleWireIds.size}/${feed.items.length} · translate ${todo.length} (skip ${skipped}, off-homepage ${ignoredOffHomepage})`,
  );

  let translated = 0;
  let failed = 0;
  const runStarted = Date.now();

  await runPool(todo, concurrency, async ({ item, hash }) => {
    const itemStarted = Date.now();
    try {
      const { titleZh, summaryZh } = await translateOne(
        host,
        model,
        item.title,
        item.summary,
      );
      cache.byId[item.id] = {
        titleZh,
        summaryZh,
        sourceHash: hash,
        translatedAt: new Date().toISOString(),
      };
      await enqueuePersist(cache);
      translated += 1;
      console.log(
        `[translate-feed] ok ${item.id} (${formatDuration(Date.now() - itemStarted)})`,
      );
    } catch (err) {
      failed += 1;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(
        `[translate-feed] ${item.id} failed (${formatDuration(Date.now() - itemStarted)}): ${msg}`,
      );
      if (!continueOnError) {
        throw err;
      }
    }
  });

  await writeChain;
  console.log(
    `[translate-feed] done in ${formatDuration(Date.now() - runStarted)} · translated ${translated}, skipped ${skipped}, off-homepage ${ignoredOffHomepage}, failed ${failed} → data/feed-i18n.json`,
  );
  if (failed > 0 && continueOnError) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
