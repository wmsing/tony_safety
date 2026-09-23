import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Parser from 'rss-parser';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const configPath = path.join(root, 'config', 'security-feeds.json');
const outPath = path.join(root, 'data', 'feed-external.json');

const parser = new Parser({
  timeout: 20_000,
  headers: { 'User-Agent': 'tony_safty-feed-fetch/1.0' },
});

function stripHtml(text) {
  return text
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(text, max) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

function normalizeUrl(url) {
  try {
    const u = new URL(url.trim());
    u.hash = '';
    return u.toString();
  } catch {
    return url.trim();
  }
}

function hashId(url) {
  return createHash('sha256').update(url).digest('hex').slice(0, 16);
}

function matchesKeywords(text, keywords) {
  if (!keywords?.length) return true;
  const hay = text.toLowerCase();
  return keywords.some((kw) => hay.includes(kw.toLowerCase()));
}

function parseKeywordLines(raw) {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
}

function parseCli() {
  const args = process.argv.slice(2);
  const preview = args.includes('--preview');
  const ki = args.indexOf('--keywords-file');
  const keywordsFile = ki >= 0 ? args[ki + 1] : null;
  const mdi = args.indexOf('--max-days');
  let maxDaysOverride = null;
  if (mdi >= 0 && args[mdi + 1]) {
    const n = Number.parseInt(args[mdi + 1], 10);
    if (Number.isFinite(n) && n > 0) maxDaysOverride = n;
  }
  return { preview, keywordsFile, maxDaysOverride };
}

/** @param {Date} publishedAt @param {number | null | undefined} maxAgeDays @param {Date} [now] */
function isWithinMaxAge(publishedAt, maxAgeDays, now = new Date()) {
  if (!maxAgeDays || maxAgeDays <= 0) return true;
  const cutoff = now.getTime() - maxAgeDays * 24 * 60 * 60 * 1000;
  return publishedAt.getTime() >= cutoff;
}

function parseDate(item) {
  const raw = item.isoDate ?? item.pubDate;
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function loadConfig() {
  const raw = await readFile(configPath, 'utf8');
  return JSON.parse(raw);
}

async function loadExistingItems() {
  try {
    const raw = await readFile(outPath, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data.items) ? data.items : [];
  } catch {
    return [];
  }
}

async function fetchFeed(
  feed,
  globalKeywords,
  summaryMaxLength,
  maxAgeDays,
  stats = null,
) {
  const keywords = feed.keywords?.length ? feed.keywords : globalKeywords;
  const parsed = await parser.parseURL(feed.url);
  const out = [];
  const rssCount = parsed.items?.length ?? 0;
  for (const item of parsed.items ?? []) {
    const link = item.link ?? item.guid;
    if (!link || !item.title) continue;
    const url = normalizeUrl(link);
    const snippet = stripHtml(
      item.contentSnippet ?? item.summary ?? item.content ?? '',
    );
    const blob = `${item.title} ${snippet}`;
    if (!matchesKeywords(blob, keywords)) continue;
    const publishedAt = parseDate(item);
    if (!publishedAt) continue;
    if (!isWithinMaxAge(publishedAt, maxAgeDays)) continue;
    out.push({
      id: hashId(url),
      title: stripHtml(item.title),
      summary: truncate(snippet, summaryMaxLength),
      url,
      publishedAt: publishedAt.toISOString(),
      sourceId: feed.id,
      sourceLabel: feed.label,
    });
  }
  if (stats) {
    stats.rssItems = rssCount;
    stats.matched = out.length;
  }
  return out;
}

async function main() {
  const { preview, keywordsFile, maxDaysOverride } = parseCli();
  const config = await loadConfig();
  let globalKeywords = config.keywords ?? [];
  if (keywordsFile) {
    const raw = await readFile(path.resolve(keywordsFile), 'utf8');
    globalKeywords = parseKeywordLines(raw);
  }
  const maxItems = config.maxItems ?? 80;
  const summaryMaxLength = config.summaryMaxLength ?? 280;
  const maxAgeDays = maxDaysOverride ?? config.maxAgeDays ?? null;

  const byUrl = new Map();
  let sourcesOk = 0;
  const sourceStats = [];

  await Promise.all(
    (config.feeds ?? []).map(async (feed) => {
      const stat = { id: feed.id, label: feed.label, rssItems: 0, matched: 0, error: null };
      try {
        const items = await fetchFeed(
          feed,
          globalKeywords,
          summaryMaxLength,
          maxAgeDays,
          stat,
        );
        sourcesOk += 1;
        for (const item of items) {
          if (!byUrl.has(item.url)) byUrl.set(item.url, item);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        stat.error = msg;
        console.error(`[fetch-feeds] ${feed.id} failed: ${msg}`);
      }
      sourceStats.push(stat);
    }),
  );

  const freshMatched = byUrl.size;
  if (!preview) {
    for (const item of await loadExistingItems()) {
      if (item?.url && !byUrl.has(item.url)) byUrl.set(item.url, item);
    }
  }

  const items = [...byUrl.values()]
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, maxItems);

  if (preview) {
    const payload = {
      fetchedAt: new Date().toISOString(),
      keywordCount: globalKeywords.length,
      maxItems,
      maxAgeDays: maxAgeDays ?? null,
      totalMatched: [...byUrl.values()].length,
      totalAfterCap: items.length,
      sourcesOk,
      sourceCount: config.feeds?.length ?? 0,
      sources: sourceStats,
      sampleItems: items.slice(0, 25).map((it) => ({
        title: it.title,
        publishedAt: it.publishedAt,
        sourceLabel: it.sourceLabel,
        url: it.url,
      })),
    };
    process.stdout.write(`${JSON.stringify(payload)}\n`);
    return;
  }

  if (items.length === 0) {
    console.error(
      `[fetch-feeds] 过滤后 0 条（成功拉取源: ${sourcesOk}/${config.feeds?.length ?? 0}）`,
    );
    process.exit(1);
  }

  await mkdir(path.dirname(outPath), { recursive: true });
  const payload = { fetchedAt: new Date().toISOString(), items };
  await writeFile(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(
    `[fetch-feeds] wrote ${items.length} items → data/feed-external.json` +
      (maxAgeDays ? ` (fetch window maxAgeDays=${maxAgeDays}, fresh=${freshMatched})` : ''),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
