# Spec: MVP Public site（LLM 网络安全）

Status: **ready-for-agent**  
Source: `/grill-with-docs` 共识（见 [CONTEXT.md](../../CONTEXT.md)）

## Problem Statement

作者需要面向中文 Reader 发布 LLM 安全主题的 **Article** 与 **Digest**，并单独管理尚未发布的 **Inbox** 素材。当前仓库仅有 Markdown 占位与安全基线，没有 **Public site**，无法满足 **MVP (site)**（可公开访问且至少一篇中文 Article）。

## Solution

用 **Site stack**（Astro Starlight）在仓库根目录生成 **Public site**，默认 **Locale (primary)** 为 `zh-Hans`，预留 **Locale (secondary)** `en` 目录结构。首版 **Hosting (MVP)** 为 GitHub Pages；构建为静态 **Static export**，日后可迁 Cloudflare Pages 而不改内容模型。站点标题为 **Site title**：「LLM 网络安全」。

## User Stories

1. As a Reader, I want to open a public URL and see the site title「LLM 网络安全」, so that I know what the site is about.
2. As a Reader, I want to read at least one Chinese Article on the Public site, so that the MVP delivers real content.
3. As a Reader, I want Articles listed or linked from the home or docs nav, so that I can discover long-form content.
4. As an author, I want to add new Articles under the Chinese locale tree, so that publishing stays a Markdown + git workflow.
5. As an author, I want Digests supported in the content model (routing or section), so that curated link roundups have a home even if the first Digest ships after MVP.
6. As an author, I want `content/inbox/` material excluded from the Public site build, so that Inbox never leaks as published pages.
7. As an author, I want empty `en` article/digest trees without broken builds, so that English can be added later with the same slug convention.
8. As an author, I want a single local dev command to preview the site, so that I can edit before push.
9. As an author, I want push to `main` to deploy the Public site to GitHub Pages, so that hosting does not require manual FTP.
10. As an author, I want README and project conventions to document install/dev/build, so that agents and humans share one workflow.
11. As an author, I want the legacy `content/posts/` placeholder removed or migrated, so that the repo matches **Content locale layout**.
12. As a future maintainer, I want the build output to be plain static files, so that migrating to Cloudflare Pages is a CI/host change only.

## Implementation Decisions

### Seam (primary test surface)

**One seam:** `build` (package script) — success means Starlight compiles all included locales/types; failure means broken content or config. Secondary smoke: optional check that a known sample Article title appears in build output HTML (behavioral, not snapshot of entire site).

Confirm with author: build-only gate is acceptable for MVP (no E2E browser suite unless you ask for it).

### Site generator

- Initialize **Astro + Starlight** at repository root (not a nested package unless tooling forces it).
- Configure site title「LLM 网络安全」; default language `zh` / `zh-Hans` aligned with CONTEXT.
- Enable or configure Starlight i18n so `zh` is default and `en` is a secondary locale with empty or placeholder sidebar acceptable.

### Content model

- Adopt **Content locale layout**:
  - Published: `content/zh/articles/`, `content/zh/digests/`, `content/en/articles/`, `content/en/digests/` (en may be empty).
  - Inbox: `content/inbox/` — not registered as Starlight docs routes (exclude via config or location outside `docs` content roots).
- **Article** vs **Digest**: distinguish by directory (preferred per grill) and/or frontmatter `type` if Starlight requires a single docs root — pick one approach and document in project-conventions.
- Ship **one sample Chinese Article** (short welcome or manifesto) to satisfy MVP (site).
- Remove or relocate `content/posts/` placeholder after new trees exist.

### Deployment

- GitHub Actions workflow: on `main`, install deps, run `build`, upload artifact to GitHub Pages (Actions-based Pages, not legacy branch-only unless simpler).
- Set `base` / `site` URL for project Pages (`/tony_safety/`) so assets resolve on GitHub Pages.
- Document in README how to enable Pages from Actions in repo settings (human one-time step).

### Repository hygiene

- Extend `.gitignore` for Astro/Node artifacts if not already covered.
- Update `project-conventions.mdc` with **install**, **dev**, **build** commands once `package.json` exists.
- Do not add Inbox fetch scripts, `.env` secrets, or auto-publish pipelines in this spec.

### Security

- Keep existing `.cursor` hooks/rules unchanged unless a change is required for Node scripts.
- No API keys in repo; future Inbox automation stays out of scope.

## Testing Decisions

- **Good tests** assert observable outcomes: build exits 0; optional script greps built HTML for sample Article heading (external behavior).
- **Modules tested:** build pipeline only for MVP (no unit tests inside Starlight config unless repo already has a test runner).
- **Prior art:** none yet — first test is the build smoke check above.

## Out of Scope

- **Inbox (MVP)** automation (RSS/cron/API); manual files only.
- Auto-publish Briefs, LLM-generated Digests, or email newsletter.
- Custom domain, Cloudflare migration (only document portability).
- English Article content (structure only).
- Comment systems, analytics, search beyond Starlight defaults.
- ADR unless author requests one for Starlight vs Hugo.

## Further Notes

- After this spec: run **`/to-tickets`** to split into tracer-bullet issues (suggested order: Starlight init → content dirs + sample Article → Pages workflow → README/conventions → remove `posts/` placeholder).
- Issue tracker: no Matt scratch layout in repo; use GitHub Issues with label `ready-for-agent` if desired.
