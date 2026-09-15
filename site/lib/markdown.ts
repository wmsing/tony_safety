import { marked } from 'marked';

import { stripTldr } from './strip-tldr';

marked.setOptions({ gfm: true, breaks: true });

/** 将作者写的 Markdown 片段转为 HTML（用于 description、Feed 摘要等）。 */
export function renderMarkdown(src: string): string {
	const cleaned = stripTldr(src);
	if (!cleaned.trim()) {
		return '';
	}
	return marked.parse(cleaned, { async: false }) as string;
}
