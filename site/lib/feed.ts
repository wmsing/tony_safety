import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { deepReadFeedListMarkdown } from './deep-read-markdown';
import type { CollectionEntry } from 'astro:content';

/** Local posts without frontmatter date sort below dated Wire items. */
const LOCAL_UNDATED_FALLBACK = new Date('2000-01-01T00:00:00.000Z');

export type FeedKind = 'article' | 'digest' | 'news';

export type FeedItem = {
	kind: FeedKind;
	id: string;
	title: string;
	descriptionHtml: string;
	summaryText: string;
	href: string;
	deepReadHref?: string;
	sourceId: string;
	sourceLabel: string;
	publishedAt: Date;
};

type ExternalCache = {
	items: {
		id: string;
		title: string;
		summary: string;
		url: string;
		publishedAt: string;
		sourceId: string;
		sourceLabel: string;
	}[];
};

export type FeedI18nEntry = {
	titleZh: string;
	summaryZh: string;
	sourceHash?: string;
	translatedAt?: string;
};

type FeedI18nCache = {
	version?: number;
	byId: Record<string, FeedI18nEntry>;
};

export type FeedDeepEntry = {
	summaryMd: string;
	contentHash?: string;
	summarizedAt?: string;
	url?: string;
	summaryMdEn?: string;
	summarySourceHash?: string;
	translatedAtEn?: string;
	bodyZhContentHash?: string;
	translatedBodyAt?: string;
};

type FeedDeepCache = {
	version?: number;
	byId: Record<string, FeedDeepEntry>;
};

type PostEntry =
	| CollectionEntry<'articles'>
	| CollectionEntry<'digests'>
	| CollectionEntry<'enArticles'>
	| CollectionEntry<'enDigests'>;

export type FeedLocale = 'zh' | 'en';

const FEED_LOCALE: Record<
	FeedLocale,
	{
		pathPrefix: string;
		articleLabel: string;
		digestLabel: string;
		useWireI18n: boolean;
		useWireDeep: boolean;
		wireDeepLocale: 'zh' | 'en';
		dateLocale: 'zh-CN' | 'en-US';
	}
> = {
	zh: {
		pathPrefix: '',
		articleLabel: '小编',
		digestLabel: '摘要',
		useWireI18n: true,
		useWireDeep: true,
		wireDeepLocale: 'zh',
		dateLocale: 'zh-CN',
	},
	en: {
		pathPrefix: 'en/',
		articleLabel: 'Articles',
		digestLabel: 'Digests',
		useWireI18n: false,
		useWireDeep: true,
		wireDeepLocale: 'en',
		dateLocale: 'en-US',
	},
};

function localPublishedAt(entry: PostEntry): Date {
	const raw = entry.data.publishedAt;
	if (raw instanceof Date && !Number.isNaN(raw.getTime())) return raw;
	return LOCAL_UNDATED_FALLBACK;
}

export async function loadExternalWireItems(): Promise<ExternalCache['items']> {
	const cachePath = path.join(process.cwd(), 'data', 'feed-external.json');
	try {
		const raw = await readFile(cachePath, 'utf8');
		const data = JSON.parse(raw) as ExternalCache;
		return data.items ?? [];
	} catch {
		return [];
	}
}

export async function loadFeedI18n(): Promise<FeedI18nCache['byId']> {
	const cachePath = path.join(process.cwd(), 'data', 'feed-i18n.json');
	try {
		const raw = await readFile(cachePath, 'utf8');
		const data = JSON.parse(raw) as FeedI18nCache;
		return data.byId ?? {};
	} catch {
		return {};
	}
}

export async function loadFeedDeep(): Promise<FeedDeepCache['byId']> {
	const cachePath = path.join(process.cwd(), 'data', 'feed-deep.json');
	try {
		const raw = await readFile(cachePath, 'utf8');
		const data = JSON.parse(raw) as FeedDeepCache;
		return data.byId ?? {};
	} catch {
		return {};
	}
}

export function buildFeed(params: {
	base: string;
	locale: FeedLocale;
	articles: PostEntry[];
	digests: PostEntry[];
	wire: ExternalCache['items'];
	wireI18n?: FeedI18nCache['byId'];
	wireDeep?: FeedDeepCache['byId'];
	renderDescription: (md: string) => string;
	/** Homepage cap (wire + local posts); unrelated to fetch `maxAgeDays`. */
	displayMaxItems?: number;
}): FeedItem[] {
	const {
		base,
		locale,
		articles,
		digests,
		wire,
		wireI18n = {},
		wireDeep = {},
		renderDescription,
		displayMaxItems,
	} = params;
	const cfg = FEED_LOCALE[locale];

	const mapPost = (
		kind: 'article' | 'digest',
		entry: PostEntry,
		segment: string,
		sourceLabel: string,
	): FeedItem => ({
		kind,
		id: entry.id,
		title: entry.data.title,
		descriptionHtml: entry.data.description
			? renderDescription(entry.data.description)
			: '',
		summaryText: '',
		href: `${base}${cfg.pathPrefix}${segment}/${entry.id}/`,
		sourceId: kind,
		sourceLabel,
		publishedAt: localPublishedAt(entry),
	});

	const fromPosts: FeedItem[] = [
		...articles.map((e) =>
			mapPost('article', e, 'articles', cfg.articleLabel),
		),
		...digests.map((e) => mapPost('digest', e, 'digests', cfg.digestLabel)),
	];

	const fromWire: FeedItem[] = wire.map((item) => {
		const zh = cfg.useWireI18n ? wireI18n[item.id] : undefined;
		const deep = cfg.useWireDeep ? wireDeep[item.id] : undefined;
		const deepSummary =
			cfg.wireDeepLocale === 'en'
				? deep?.summaryMdEn?.trim()
				: deep?.summaryMd?.trim();
		const wirePath = cfg.wireDeepLocale === 'en' ? 'en/wire' : 'wire';
		return {
			kind: 'news' as const,
			id: item.id,
			title: zh?.titleZh ?? item.title,
			descriptionHtml: deepSummary
				? renderDescription(
						deepReadFeedListMarkdown(deepSummary, cfg.wireDeepLocale),
					)
				: '',
			summaryText: deepSummary ? '' : (zh?.summaryZh ?? item.summary),
			href: item.url,
			deepReadHref: deepSummary
				? `${base}${wirePath}/${item.id}/`
				: undefined,
			sourceId: item.sourceId,
			sourceLabel: item.sourceLabel,
			publishedAt: new Date(item.publishedAt),
		};
	});

	const sorted = [...fromPosts, ...fromWire].sort(
		(a, b) => b.publishedAt.getTime() - a.publishedAt.getTime(),
	);
	return limitFeedForDisplay(sorted, displayMaxItems);
}

/** Homepage: newest first, optional cap only (no fetch date window). */
export function limitFeedForDisplay(
	feed: FeedItem[],
	maxItems?: number,
): FeedItem[] {
	if (maxItems == null || maxItems <= 0) return feed;
	return feed.slice(0, maxItems);
}

const SHANGHAI = 'Asia/Shanghai';

/** Calendar day for grouping (Asia/Shanghai). */
export function feedDayKey(date: Date): string {
	return new Intl.DateTimeFormat('en-CA', { timeZone: SHANGHAI }).format(date);
}

export function formatFeedDate(
	date: Date,
	dateLocale: 'zh-CN' | 'en-US' = 'zh-CN',
): string {
	return new Intl.DateTimeFormat(dateLocale, {
		timeZone: SHANGHAI,
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	}).format(date);
}

export function feedDateLocale(locale: FeedLocale): 'zh-CN' | 'en-US' {
	return FEED_LOCALE[locale].dateLocale;
}

export type FeedRow =
	| { type: 'day'; day: string; label: string }
	| { type: 'item'; item: FeedItem };

/** Tabs for each RSS source that appears in the current feed (config order). */
export function wireSourceTabs(
	feed: FeedItem[],
	configFeeds: { id: string; label: string }[],
): { id: string; label: string }[] {
	const present = new Set(
		feed.filter((item) => item.kind === 'news').map((item) => item.sourceId),
	);
	return configFeeds
		.filter((f) => present.has(f.id))
		.map((f) => ({ id: f.id, label: f.label }));
}

export function feedRows(
	feed: FeedItem[],
	dateLocale: 'zh-CN' | 'en-US' = 'zh-CN',
): FeedRow[] {
	const rows: FeedRow[] = [];
	let lastDay = '';
	for (const item of feed) {
		const day = feedDayKey(item.publishedAt);
		if (day !== lastDay) {
			rows.push({
				type: 'day',
				day,
				label: formatFeedDate(item.publishedAt, dateLocale),
			});
			lastDay = day;
		}
		rows.push({ type: 'item', item });
	}
	return rows;
}
