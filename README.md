# tony_safty

LLM 安全博客与笔记仓库。术语见 [CONTEXT.md](CONTEXT.md)。

## 我只想…

| 目标 | 做什么 |
|------|--------|
| **本地写稿** | 下面 [本地 Admin](#本地-admin写稿) → 浏览器改 `content/zh/...` |
| **本地看站** | `npm install` → `npm run dev` → 打开终端里给的本地 URL |
| **发布线上** | 改内容后 `git push` 到 `main`（Actions 自动部署） |

线上地址：<https://wmsing.github.io/tony_safty/>

## 架构图（可选）

交互图在仓库内用浏览器打开对应 HTML：

- [内容发布与 CI/CD](docs/diagrams/tony_safty-cicd.workflow.html)
- [Public site 架构](docs/diagrams/tony_safty-public-site.architecture.html)
- [部署时序](docs/diagrams/tony_safty-deploy.sequence.html)

源规格：`docs/diagrams/tony_safty-*.json`（本地 Archify 更新后 `deliver` 到同目录 HTML）。

## 本地 Admin（写稿）

GitHub Pages 不能跑写库后台；用本机 Admin 改 Markdown 源稿。

```bash
pip install -e ".[admin,dev]"
cp .env.example .env          # 填 ADMIN_TOKEN，勿提交 .env
python -m src.admin           # http://127.0.0.1:8787
```

1. 浏览器登录（Token = `ADMIN_TOKEN`）。
2. **另开终端**运行 `npm run dev`，在 Admin 点 **Preview** 看站点（默认 `http://127.0.0.1:4321/tony_safty/`）。
3. 保存后 Admin 会 sync；要上线再 **push** `main`。

## 本地看站（不经过 Admin）

```bash
npm install
npm run dev      # 会自动 sync-content
npm run build    # 发布前自检（MVP 主验收）
```

源稿在 `content/zh|en/{articles,digests}/`；`sync-content` 同步到 `site/content/docs/`（已 gitignore，勿手改）。

## 目录（摘要）

- `content/zh|en/{articles,digests}/` — 已发布源文件
- `content/inbox/` — 不进站点
- `site/` — Astro + AI Hot Editorial（`design-system/`）
- `src/` — Python 工具（含 Admin）
- `.cursor/` — Agent 规则与安全基线

## Python 工具开发（可选）

改 `src/` 业务代码时用：

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
python -m src.main
pytest && mypy src && ruff check src && ruff format --check src
```

## 仓库管理员（一次性）

首次启用 GitHub Pages：

1. **Settings → Pages** → Source 选 **GitHub Actions**。
2. `main` 上已有 [`.github/workflows/pages.yml`](.github/workflows/pages.yml)；push 触发部署。

日常：改 `content/zh/...` → push `main` 即可。项目站 `base` 为 `/tony_safty/`（见 `astro.config.mjs`）。
