# tony_safty

LLM 安全相关博客与笔记；仓库同时承载可公开发布内容与采集素材。领域术语见 [CONTEXT.md](CONTEXT.md)。

## 目录（摘要）

- `content/zh|en/{articles,digests}/` — Article / Digest 源文件（构建前 `npm run sync-content`）
- `content/inbox/` — Inbox（不进站点）
- `site/` — Astro 站点（**AI Hot Editorial** 壳 + `design-system/`）；根目录 `package.json` 负责 **Public site** 构建
- `src/` — Python 工具与脚本（脚手架默认包）
- `.cursor/` — Agent 安全基线 + 工程规则

## 本地 Admin（CRUD Markdown 源稿）

GitHub Pages **不能**托管写库后台；Admin 仅在本机运行，直接改 `content/zh/{articles,digests}/`。

```bash
pip install -e ".[admin,dev]"
cp .env.example .env                # 编辑 ADMIN_TOKEN，勿提交 .env
python -m src.admin                 # http://127.0.0.1:8787 — 登录页输入 ADMIN_TOKEN
# 另开终端：npm run dev → Admin 里点 Preview 打开本地站点核对
```

保存后：Admin 会自动 sync；点 **Preview** 跳转 `SITE_DEV_URL`（默认 `http://127.0.0.1:4321/tony_safty/`）。**线上**需 `git push`。

## Python 快速开始

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
python -m src.main
```

## 质量闭环（改 Python 后必跑）

```bash
pytest
mypy src
ruff check src && ruff format --check src
```

## 站点（Astro · AI Hot Editorial）

```bash
npm install
npm run dev    # predev 会自动 npm run sync-content
npm run build  # prebuild 会自动 sync；MVP 主验收缝
```

`sync-content` 将 `content/zh|en/{articles,digests}/` 同步到 `site/content/docs/`（同步目录已 gitignore，勿手改生成物）。

### Public site（线上）

- **URL**：<https://wmsing.github.io/tony_safty/>
- **路径**：GitHub Pages 项目站 `base` 为 `/tony_safty/`（见 `astro.config.mjs`）。

### GitHub Pages 一次性设置（仓库管理员）

1. 打开仓库 **Settings → Pages**。
2. **Build and deployment → Source** 选 **GitHub Actions**（不要选 legacy 分支）。
3. 将本仓库 `main` 的 workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml) 合并后，push 会触发 **Deploy Public site to GitHub Pages**；首次成功部署后线上 URL 即可访问。

之后日常发布：改 `content/zh/...` → push `main` → Actions 自动 build 并部署。
