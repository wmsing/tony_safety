import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const configPath = path.join(root, 'config', 'security-feeds.json');
const LOCAL_UNDATED_FALLBACK = new Date('2000-01-01T00:00:00.000Z');

/** Mirror site/lib/feed.ts limitFeedForDisplay */
export function limitFeedForDisplay(feed, maxItems) {
  if (maxItems == null || maxItems <= 0) return feed;
  return feed.slice(0, maxItems);
}

async function loadDisplayMaxItems() {
  try {
    const config = JSON.parse(await readFile(configPath, 'utf8'));
    return config.displayMaxItems ?? config.maxItems ?? undefined;
  } catch {
    return undefined;
  }
}

function localPublishedAt(raw) {
  if (!raw) return LOCAL_UNDATED_FALLBACK;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? LOCAL_UNDATED_FALLBACK : d;
}

function parsePublishedAt(markdown) {
  const m = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return LOCAL_UNDATED_FALLBACK;
  const line = m[1].match(/^publishedAt:\s*(.+)$/m);
  return localPublishedAt(line?.[1]?.trim());
}

async function loadLocalDates(relativeDir) {
  const dir = path.join(root, relativeDir);
  if (!existsSync(dir)) return [];
  const names = await readdir(dir);
  const out = [];
  for (const name of names) {
    if (!name.endsWith('.md') || name === '.gitkeep') continue;
    const raw = await readFile(path.join(dir, name), 'utf8');
    out.push({
      kind: relativeDir.includes('digests') ? 'digest' : 'article',
      publishedAt: parsePublishedAt(raw),
    });
  }
  return out;
}

/** Wire ids shown on homepage (same merge + limit as buildFeed). */
export async function wireIdsOnHomepage(wireItems) {
  const local = [
    ...(await loadLocalDates('content/zh/articles')),
    ...(await loadLocalDates('content/zh/digests')),
  ];
  const entries = [
    ...local.map((e) => ({ kind: e.kind, publishedAt: e.publishedAt, wireId: null })),
    ...wireItems.map((w) => ({
      kind: 'news',
      publishedAt: new Date(w.publishedAt),
      wireId: w.id,
    })),
  ];
  entries.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
  const limited = limitFeedForDisplay(entries, await loadDisplayMaxItems());
  return new Set(
    limited.filter((e) => e.kind === 'news' && e.wireId).map((e) => e.wireId),
  );
}
