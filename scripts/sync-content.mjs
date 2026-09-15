import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const mappings = [
	['content/zh/articles', 'site/content/docs/articles'],
	['content/zh/digests', 'site/content/docs/digests'],
	['content/en/articles', 'site/content/docs/en/articles'],
	['content/en/digests', 'site/content/docs/en/digests'],
];

/** @param {string} text */
function stripTldr(text) {
	return text.replace(/\s*\(TL;DR\)/gi, '');
}

/**
 * @param {string} srcDir
 * @param {string} destDir
 */
async function syncMarkdownDir(srcDir, destDir) {
	await rm(destDir, { recursive: true, force: true });
	if (!existsSync(srcDir)) {
		return;
	}
	const entries = await readdir(srcDir);
	const publishable = entries.filter((name) => name !== '.gitkeep');
	if (publishable.length === 0) {
		await mkdir(destDir, { recursive: true });
		return;
	}
	await mkdir(destDir, { recursive: true });
	for (const name of publishable) {
		if (!name.endsWith('.md')) {
			continue;
		}
		const raw = await readFile(path.join(srcDir, name), 'utf8');
		await writeFile(path.join(destDir, name), stripTldr(raw));
	}
}

for (const [srcRel, destRel] of mappings) {
	await syncMarkdownDir(path.join(root, srcRel), path.join(root, destRel));
}
