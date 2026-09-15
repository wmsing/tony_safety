# tony_safty

LLM 安全相关博客与笔记；仓库同时承载可公开发布内容与采集素材。领域术语见 [CONTEXT.md](CONTEXT.md)。

## 目录（摘要）

- `content/zh|en/{articles,digests}/` — Article / Digest 源文件（构建前 `npm run sync-content`）
- `content/inbox/` — Inbox（不进站点）
- `site/` — Astro Starlight 页面与文档源码；根目录 `package.json` 负责 **Public site** 构建
- `src/` — Python 工具与脚本（脚手架默认包）
- `.cursor/` — Agent 安全基线 + 工程规则

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

## 站点（Starlight）

```bash
npm install
npm run dev
npm run build
```

GitHub Pages 项目站 `base` 为 `/tony_safty/`（见 `astro.config.mjs`）。
