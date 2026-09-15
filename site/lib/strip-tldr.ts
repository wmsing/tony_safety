/** 公开站点不展示编辑稿里的 (TL;DR) 标记（大小写不敏感）。 */
export function stripTldr(text: string): string {
	return text.replace(/\s*\(TL;DR\)/gi, '');
}
