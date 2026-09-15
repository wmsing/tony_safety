import { cp, mkdir, readdir, rm } from 'node:fs/promises';
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

for (const [srcRel, destRel] of mappings) {
	const src = path.join(root, srcRel);
	const dest = path.join(root, destRel);
	await rm(dest, { recursive: true, force: true });
	if (!existsSync(src)) {
		continue;
	}
	const entries = await readdir(src);
	const publishable = entries.filter((name) => name !== '.gitkeep');
	if (publishable.length === 0) {
		await mkdir(dest, { recursive: true });
		continue;
	}
	await cp(src, dest, {
		recursive: true,
		filter: (srcPath) => !srcPath.endsWith('.gitkeep'),
	});
}
