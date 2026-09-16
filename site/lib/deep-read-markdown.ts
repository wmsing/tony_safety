/** 去掉「## 先看这句」标题行，保留其下正文直到下一个 ##。 */
export function normalizeDeepReadMarkdown(md: string): string {
	return md.replace(/^##\s*先看这句\s*\n+/im, '').trim();
}

const KEY_POINTS_HEADING: Record<'zh' | 'en', string> = {
	zh: '要点',
	en: 'Key points',
};

/** 首页 Feed 卡片：仅展示要点小节（不含行动提示与段首导语）。 */
export function deepReadFeedListMarkdown(
	md: string,
	locale: 'zh' | 'en' = 'zh',
): string {
	const base = normalizeDeepReadMarkdown(md);
	const heading = KEY_POINTS_HEADING[locale];
	// 不用 multiline：否则 `$` 会在每行末尾截断，只留下第一条 bullet
	const section = base.match(
		new RegExp(
			`(?:^|\\n)##\\s*${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\n+([\\s\\S]*?)(?=\\n##\\s|$)`,
			'i',
		),
	);
	if (section) return section[1].trim();
	return base;
}
