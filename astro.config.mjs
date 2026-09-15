// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://wmsing.github.io',
	base: '/tony_safty/',
	srcDir: 'site',
	integrations: [
		starlight({
			title: 'LLM 网络安全',
			defaultLocale: 'root',
			locales: {
				root: { label: '简体中文', lang: 'zh-CN' },
				en: { label: 'English', lang: 'en' },
			},
			social: [
				{
					icon: 'github',
					label: 'GitHub',
					href: 'https://github.com/wmsing/tony_safty',
				},
			],
			sidebar: [
				{
					label: 'Guides',
					items: [{ label: 'Example Guide', slug: 'guides/example' }],
				},
				{
					label: 'Reference',
					items: [{ autogenerate: { directory: 'reference' } }],
				},
			],
		}),
	],
});
