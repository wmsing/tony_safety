import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const articleSchema = z.object({
	title: z.string(),
	description: z.string().optional(),
	publishedAt: z.coerce.date().optional(),
});

export const collections = {
	articles: defineCollection({
		loader: glob({ pattern: '**/*.md', base: './site/content/docs/articles' }),
		schema: articleSchema,
	}),
	digests: defineCollection({
		loader: glob({ pattern: '**/*.md', base: './site/content/docs/digests' }),
		schema: articleSchema,
	}),
	enArticles: defineCollection({
		loader: glob({ pattern: '**/*.md', base: './site/content/docs/en/articles' }),
		schema: articleSchema,
	}),
	enDigests: defineCollection({
		loader: glob({ pattern: '**/*.md', base: './site/content/docs/en/digests' }),
		schema: articleSchema,
	}),
};
