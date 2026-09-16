import { readFile } from 'node:fs/promises';
import path from 'node:path';
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
		dateLocale: 'zh-CN' | 'en-US';
	}
> = {
	zh: {
		pathPrefix: '',
		articleLabel: '小编',
		digestLabel: '摘要',
		useWireI18n: true,
		dateLocale: 'zh-CN',
	},
	en: {
		pathPrefix: 'en/',
		articleLabel: 'Articles',
		digestLabel: 'Digests',
		useWireI18n: false,
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

export function buildFeed(params: {
	base: string;
	locale: FeedLocale;
	articles: PostEntry[];
	digests: PostEntry[];
	wire: ExternalCache['items'];
	wireI18n?: FeedI18nCache['byId'];
	renderDescription: (md: string) => string;
}): FeedItem[] {
	const {
		base,
		locale,
		articles,
		digests,
		wire,
		wireI18n = {},
		renderDescription,
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
		return {
			kind: 'news' as const,
			id: item.id,
			title: zh?.titleZh ?? item.title,
			descriptionHtml: '',
			summaryText: zh?.summaryZh ?? item.summary,
			href: item.url,
			sourceId: item.sourceId,
			sourceLabel: item.sourceLabel,
			publishedAt: new Date(item.publishedAt),
		};
	});

	const sorted = [...fromPosts, ...fromWire].sort(
		(a, b) => b.publishedAt.getTime() - a.publishedAt.getTime(),
	);
	return limitFeedForDisplay(sorted);
}

/** Homepage: last calendar month; if fewer than 30, show 30 most recent overall. */
export function limitFeedForDisplay(
	feed: FeedItem[],
	now = new Date(),
): FeedItem[] {
	const minItems = 30;
	const cutoff = new Date(now);
	cutoff.setMonth(cutoff.getMonth() - 1);

	const inLastMonth = feed.filter((item) => item.publishedAt >= cutoff);
	if (inLastMonth.length >= minItems) {
		return inLastMonth;
	}
	return feed.slice(0, minItems);
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
