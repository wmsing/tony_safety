/** 去掉「## 先看这句」标题行，保留其下正文直到下一个 ##。 */
export function normalizeDeepReadMarkdown(md: string): string {
	return md.replace(/^##\s*先看这句\s*\n+/im, '').trim();
}

/** 首页 Feed 卡片：仅展示「要点」小节（不含行动提示与段首导语）。 */
export function deepReadFeedListMarkdown(md: string): string {
	const base = normalizeDeepReadMarkdown(md);
	// 不用 multiline：否则 `$` 会在每行末尾截断，只留下第一条 bullet
	const section = base.match(
		/(?:^|\n)##\s*要点\s*\n+([\s\S]*?)(?=\n##\s|$)/i,
	);
	if (section) return section[1].trim();
	return base;
}
