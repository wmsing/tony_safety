# tony_safty

面向中文读者的 LLM 安全主题博客；仓库同时承载可公开发布的内容与尚未发布的采集素材。

## Language

**Article**:
由作者撰写、可公开发布的长文（分析、教程、事件复盘等）。
_Avoid_: Post（与泛称混淆）、Blog post

**Digest**:
由作者策展的链接摘要栏目（可周更或专题），每条带来源链接与简短评述。
_Avoid_: Newsletter（若未做邮件订阅）、Roundup（口语可接受，正文用 Digest）

**Wire**:
从外部 RSS 缓存展示在首页的外链资讯卡片（标题、纯文本摘要、原文链接）；不经 Article/Digest 详情页，不写入 Inbox。
_Avoid_: 把 Wire 当成已发布的 Article

**Inbox**:
从外部来源自动或半自动抓取后、仅入库待人工处理的原始或半成品素材；不直接对外发布。
_Avoid_: Feed（指来源）、Draft（指作者正在写的稿，见下）

**Draft**:
作者正在编写、尚未达到发布标准的 Markdown 稿（可源自 Inbox 或从零写作）。
_Avoid_: WIP

## Branding

**Site title**:
对外站点标题为 **LLM 网络安全**（页眉与 HTML `<title>`）；与仓库名 `tony_safty` 无关。若日后要加作者署名，采用「作者名 · LLM 网络安全」。
_Avoid_: 仅用仓库 slug 作对外品牌

## Audience

**Reader**:
以简体中文阅读 LLM 安全内容的从业者与深度爱好者。
_Avoid_: 泛「用户」

**Locale (primary)**:
`zh-Hans`：首发正文与站点 UI 默认语言。
_Avoid_: CN（非标准 locale 码）

**Locale (secondary)**:
`en`：主文稳定后追加的英文 Article/Digest；与中文稿同 slug、分 locale 存放，不混排在同一篇内。

## Publishing

**Public site**:
面向 Reader 的站点，由已发布的 Article、Digest 与首页 **Wire** 组成；Inbox 与未发布 Draft 不出现在站上。
_Avoid_: 把 Inbox 当博客文章发

**External RSS cache**:
`data/feed-external.json`，由作者手动执行 `npm run fetch-feeds` 更新（不挂 prebuild）；CI build 读取已提交的缓存，无需外网。
_Avoid_: 把 Wire 自动写入 `content/zh/articles`

**MVP (site)**:
可公开访问的 Public site，且至少包含一篇中文 Article。
_Avoid_: 仅仓库 Markdown 无站点

**Hosting (MVP)**:
首版挂在与本仓库绑定的 GitHub Pages；构建产物为静态文件，日后可迁到其他静态托管（如 Cloudflare Pages）而不改内容模型。
_Avoid_: 把「换托管」当成重写内容

**Inbox (MVP)**:
仅手工写入 `content/inbox/`；不做定时抓取脚本。
_Avoid_: MVP 阶段把 Inbox 自动发布到 Public site

**Content locale layout**:
已发布类型按 locale 分树：`content/zh|en/{articles,digests}/`；`content/inbox/` 无 locale、不参与 Public site 构建。

## Tooling (names only)

**Site stack**:
用 Astro Starlight 生成 Public site（选型理由见日后 ADR，若需要）。
_Avoid_: 在 CONTEXT 里展开构建命令（见 project-conventions）
