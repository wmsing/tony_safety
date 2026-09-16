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
  const hay = text.toLowerCase();
  return keywords.some((kw) => hay.includes(kw.toLowerCase()));
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

async function fetchFeed(feed, globalKeywords, summaryMaxLength) {
  const keywords = feed.keywords?.length ? feed.keywords : globalKeywords;
  const parsed = await parser.parseURL(feed.url);
  const out = [];
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
  return out;
}

async function main() {
  const config = await loadConfig();
  const globalKeywords = config.keywords ?? [];
  const maxItems = config.maxItems ?? 80;
  const summaryMaxLength = config.summaryMaxLength ?? 280;

  const byUrl = new Map();
  let sourcesOk = 0;

  await Promise.all(
    (config.feeds ?? []).map(async (feed) => {
      try {
        const items = await fetchFeed(feed, globalKeywords, summaryMaxLength);
        sourcesOk += 1;
        for (const item of items) {
          if (!byUrl.has(item.url)) byUrl.set(item.url, item);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[fetch-feeds] ${feed.id} failed: ${msg}`);
      }
    }),
  );

  const items = [...byUrl.values()]
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, maxItems);

  if (items.length === 0) {
    console.error(
      `[fetch-feeds] 过滤后 0 条（成功拉取源: ${sourcesOk}/${config.feeds?.length ?? 0}）`,
    );
    process.exit(1);
  }

  await mkdir(path.dirname(outPath), { recursive: true });
  const payload = { fetchedAt: new Date().toISOString(), items };
  await writeFile(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(`[fetch-feeds] wrote ${items.length} items → data/feed-external.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
