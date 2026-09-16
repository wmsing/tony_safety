# tony_safty

LLM 安全博客与笔记仓库。术语见 [CONTEXT.md](CONTEXT.md)。

## 我只想…


| 目标         | 做什么                                                |
| ---------- | -------------------------------------------------- |
| **本地写稿**   | 下面 [本地 Admin](#本地-admin写稿) → 浏览器改 `content/zh/...` |
| **本地看站**   | `npm install` → `npm run dev` → 打开终端里给的本地 URL      |
| **更新首页资讯** | 见 [更新首页资讯 Feed](#更新首页资讯-feedwire)                  |
| **发布线上**   | 改内容后 `git push` 到 `main`（Actions 自动部署）             |


线上地址：[https://wmsing.github.io/tony_safty/](https://wmsing.github.io/tony_safty/)

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

## 更新首页资讯（Wire）

首页滚动资讯 = **外部 RSS**，不是你在 `content/zh/...` 写的文章。术语：[CONTEXT.md](CONTEXT.md)。

### 两步在干什么（只记这个）


| 命令                       | 人话                                                                              |
| ------------------------ | ------------------------------------------------------------------------------- |
| `npm run fetch-feeds`    | **进货**：上网抓 RSS → 英文清单 `data/feed-external.json`                                 |
| `npm run translate-feed` | **贴中文标**（可选）：本机 Ollama 译标题/摘要 → `data/feed-i18n.json`                           |
| `npm run deep-read-feed` | **精读**（可选）：抓原文 → Markdown + ADHD 友好摘要 → `data/feed-deep.json`、`data/wire-deep/` |


没跑 translate？首页仍能用，Wire 显示**英文**。有中文标就用中文，没有就用英文。精读仅中文首页：有摘要则卡片显示精读、链到站内 `/wire/{id}/`。

> 精读全文 Markdown 会进 Git，仅供个人学习站点；请遵守原文版权与引用规范。



### 今天我要干嘛？（三选一）

**A — 只想刷新新闻（英文也行）**

```bash
npm run fetch-feeds
npm run dev
# 满意后：git add data/feed-external.json → commit → push main
```

**B — 刷新新闻 + 首页要中文**

```bash
npm run fetch-feeds
npm run translate-feed    # 要先：ollama 在跑 + .env 里 OLLAMA_MODEL
npm run dev
# 满意后：git add data/feed-external.json data/feed-i18n.json → commit → push
```

**C — 新闻没变，只补翻译**

```bash
npm run translate-feed
npm run dev
# 若 feed-i18n.json 有变再 git add 它
```

**C' — 最新几条 Wire 做精读（ADHD 摘要 + 站内详情页）**

```bash
npm run fetch-feeds          # 若 feed 已新可跳过
npm run deep-read-feed -- --latest 5   # 成功 5 条即止；OpenAI 等 403 会换其它域名继续试
npm run dev
# 满意后：git add data/feed-deep.json data/wire-deep/ → commit → push
```

**精读 — 只重新生成摘要**（改过 prompt / 换模型）

精读有缓存：同一条 `id` 且 `contentHash` 未变 → 自动 skip。推荐（**不重新抓网页**，更快）：

```bash
npm run deep-read-feed -- --id <id> --summarize-only --force-summary
```

仍可从 `feed-deep.json` 删掉该 `id` 条目后加 `--summarize-only`（不必 `--force-summary`）。要重新抓取原文再去掉 `--summarize-only`。

**正文裁剪**：抓取后经 Readability 转 Markdown，再去掉文末常见块（References、Contact、Disclaimer 等）；`wire-deep/*.md` 与送 Qwen 的正文均为裁剪后版本，摘要更快。

**HTML 本地缓存**：首次成功抓取会写入 `data/wire-html/{id}.html`（默认 **不提交** Git）。同一条再次精读时读本地 HTML，不再请求外网；强制重下加 `--refetch`。**不能**靠缓存绕过首次 403（OpenAI 等仍要在第一次抓到 HTML，或你手动放入缓存文件）。

线上 **不会**自动 fetch / 翻译 / 精读；你把 JSON 与 `wire-deep/` **commit 并 push**，CI 只 `build`。

### 第一次在这台电脑（做一次）

```bash
npm install                 # 从没装过 node 依赖时
ollama serve                # 若要中文：Ollama 常驻
ollama pull <model>         # 若要中文：与 ollama list 一致
cp .env.example .env        # 若要中文：填 OLLAMA_MODEL=…
```



### 细节（现在不用背）

点开才看

- **改 RSS 源 / 关键词**：`[config/security-feeds.json](config/security-feeds.json)` → 再 `fetch-feeds`。
- **translate 增量**：同一条、原文没变 → 自动 skip；RSS 改了标题/摘要 → 只重译那条。
- **Ctrl+C**：已译完并写盘的会保留；正在译的那一条可能要再跑一次。
- **卡 / 占内存**：主要是 Ollama 模型；保持 `TRANSLATE_CONCURRENCY=1`（见 `[.env.example](.env.example)`）。
- **fetch 最多约 80 条缓存**，首页展示更少；translate **译** `feed-external.json` **里全部条目**（与首页条数无关）。
- **deep-read** `--latest N`：按时间从新到旧扫描**全库**，成功精读 **N 条**后停止；某域名 403/404 后本 run 跳过同域名，继续试其它源（不必再加 `--continue-on-error`）。
- **deep-read 重算摘要**：`--summarize-only --force-summary`；或删 `feed-deep.json` 里该 id 后 `--summarize-only`。
- **deep-read 自检裁剪**：`node scripts/deep-read-feed.mjs --self-check`（需样例 `wire-deep/cffee32c5fe965c9.md`）。
- **deep-read HTML 缓存**：`data/wire-html/`；`--refetch` 忽略缓存重新下载。
- Wire 不进 `content/inbox/`，也不会自动变成 Article。



## 目录（摘要）

- `content/zh|en/{articles,digests}/` — 已发布源文件
- `content/inbox/` — 不进站点
- `config/security-feeds.json` — RSS 源与关键词
- `data/feed-external.json` — Wire 缓存（`fetch-feeds` 生成，需提交）
- `data/feed-i18n.json` — Wire 中文译稿（`translate-feed` 生成，需提交）
- `data/feed-deep.json`、`data/wire-deep/` — Wire 精读索引与全文 md（`deep-read-feed` 生成，需提交）
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
2. `main` 上已有 `[.github/workflows/pages.yml](.github/workflows/pages.yml)`；push 触发部署。

日常：改 `content/zh/...` → push `main` 即可。项目站 `base` 为 `/tony_safty/`（见 `astro.config.mjs`）。