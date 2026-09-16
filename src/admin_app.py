"""本地 Admin：CRUD content/zh 下的 Markdown（勿暴露到公网）。"""

from __future__ import annotations

import hashlib
import hmac
import html
import os
import secrets
from pathlib import Path
from typing import Annotated
from urllib.parse import quote

from dotenv import load_dotenv
from fastapi import Cookie, Depends, FastAPI, Form, HTTPException, status
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles

from src.content_store import (
    Post,
    delete_post,
    list_posts,
    read_post,
    validate_slug,
    write_post,
)
from src.wire_html_cache import (
    WireHtmlError,
    get_wire_item,
    load_wire_items,
    read_cached_html,
    save_wire_html,
)

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

SESSION_COOKIE = "tony_admin_session"
app = FastAPI(title="tony_safty admin", docs_url=None, redoc_url=None)
_static = Path(__file__).resolve().parent
app.mount("/admin/static", StaticFiles(directory=_static), name="admin-static")


def _admin_token() -> str:
    token = os.environ.get("ADMIN_TOKEN", "").strip()
    if not token:
        raise RuntimeError("ADMIN_TOKEN is not set")
    return token


def _session_digest() -> str:
    return hmac.new(
        _admin_token().encode(),
        b"tony_safty-admin-session",
        hashlib.sha256,
    ).hexdigest()


def _valid_session(session: str | None) -> bool:
    if not session:
        return False
    return secrets.compare_digest(session, _session_digest())


def site_dev_base() -> str:
    raw = os.environ.get(
        "SITE_DEV_URL",
        "http://127.0.0.1:4321/tony_safty/",
    ).strip()
    return raw if raw.endswith("/") else f"{raw}/"


def preview_post_url(kind: str, slug: str) -> str:
    folder = "articles" if kind == "articles" else "digests"
    return f"{site_dev_base()}{folder}/{slug}/"


def _preview_panel(kind: str, slug: str | None = None, saved: bool = False) -> str:
    home = html.escape(site_dev_base(), quote=True)
    saved_note = (
        '<p class="muted">已保存并 sync，可在本地站点核对效果。</p>' if saved else ""
    )
    if slug:
        post_url = html.escape(preview_post_url(kind, slug), quote=True)
        primary = (
            f'<a class="btn-preview" href="{post_url}" '
            f'target="_blank" rel="noopener noreferrer">预览此文 ↗</a>'
        )
    else:
        primary = (
            f'<a class="btn-preview" href="{home}" '
            f'target="_blank" rel="noopener noreferrer">打开本地站点 ↗</a>'
        )
    return f"""
    <div class="preview-panel">
      {saved_note}
      <p>{primary}
        <a class="muted" href="{home}" target="_blank"
          rel="noopener noreferrer">Feed 首页</a>
      </p>
      <p class="muted">另开终端 <code>npm run dev</code> ·
        {html.escape(site_dev_base())}</p>
    </div>
    """


def require_admin(
    session: Annotated[str | None, Cookie(alias=SESSION_COOKIE)] = None,
) -> None:
    if not _valid_session(session):
        raise HTTPException(
            status_code=status.HTTP_302_FOUND,
            headers={"Location": "/"},
        )


def _layout(title: str, body: str) -> str:
    safe_title = html.escape(title)
    return f"""<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{safe_title} · Admin</title>
  <link rel="stylesheet" href="/admin/static/admin_static.css">
</head>
<body>
  <nav>
    <a href="/admin/posts">Posts</a>
    <a href="/admin/wire-deep">Wire 精读 HTML</a>
    <a href="{html.escape(site_dev_base(), quote=True)}" target="_blank"
      rel="noopener noreferrer">Preview (dev)</a>
    <a href="/admin/logout">Logout</a>
    <span class="muted">本地 only · 127.0.0.1</span>
  </nav>
  {body}
</body>
</html>"""


def _excerpt(text: str, max_len: int = 100) -> str:
    compact = " ".join(text.split())
    if len(compact) <= max_len:
        return compact
    return f"{compact[: max_len - 1]}…"


def _post_from_form(
    kind: str,
    slug: str,
    title: str,
    description: str,
    body: str,
) -> Post:
    return Post(
        kind=kind,
        slug=validate_slug(slug),
        title=title.strip(),
        description=description.strip(),
        body=body,
    )


@app.get("/", response_model=None)
def login_page(
    session: Annotated[str | None, Cookie(alias=SESSION_COOKIE)] = None,
    error: str = "",
) -> HTMLResponse | RedirectResponse:
    if _valid_session(session):
        return RedirectResponse(url="/admin/posts", status_code=status.HTTP_302_FOUND)
    err = (
        f'<p class="muted" style="color:#f5b70a">{html.escape(error)}</p>'
        if error
        else ""
    )
    body = f"""
    <h1>Admin 登录</h1>
    <p class="muted">密码为 <code>.env</code> 中的 <code>ADMIN_TOKEN</code>。</p>
    {err}
    <form method="post" action="/admin/login">
      <label>Password
        <input type="password" name="password" required autocomplete="current-password">
      </label>
      <button type="submit">登录</button>
    </form>
    """
    return HTMLResponse(_layout("Login", body))


@app.post("/admin/login")
def login_submit(password: str = Form(...)) -> RedirectResponse:
    token = _admin_token()
    if not secrets.compare_digest(password.encode(), token.encode()):
        return RedirectResponse(
            url="/?error=wrong",
            status_code=status.HTTP_303_SEE_OTHER,
        )
    response = RedirectResponse(
        url="/admin/posts",
        status_code=status.HTTP_303_SEE_OTHER,
    )
    response.set_cookie(
        SESSION_COOKIE,
        _session_digest(),
        httponly=True,
        samesite="lax",
        max_age=60 * 60 * 12,
    )
    return response


@app.get("/admin/logout")
def logout() -> RedirectResponse:
    response = RedirectResponse(url="/", status_code=status.HTTP_302_FOUND)
    response.delete_cookie(SESSION_COOKIE)
    return response


@app.get("/admin/posts", response_class=HTMLResponse)
def posts_index(
    _: Annotated[None, Depends(require_admin)],
    kind: str = "articles",
) -> str:
    if kind not in ("articles", "digests"):
        kind = "articles"
    rows = list_posts(kind)
    items = "".join(
        f"<tr>"
        f"<td><code>{html.escape(p.slug)}</code></td>"
        f"<td>{html.escape(p.title)}</td>"
        f'<td class="muted">{html.escape(_excerpt(p.description, 80))}</td>'
        f'<td class="muted">{html.escape(_excerpt(p.body, 120))}</td>'
        f'<td><a href="/admin/posts/{html.escape(p.slug)}/edit?kind={kind}">'
        f"Edit</a> · "
        f'<a href="{html.escape(preview_post_url(kind, p.slug), quote=True)}" '
        f'target="_blank" rel="noopener noreferrer">Preview</a></td></tr>'
        for p in rows
    )
    empty = '<tr><td colspan="5" class="muted">暂无</td></tr>'
    preview = _preview_panel(kind)
    body = f"""
    <h1>Posts ({html.escape(kind)})</h1>
    {preview}
    <p class="muted">保存后会 sync；线上需 <code>git push</code>。</p>
    <p>
      <a href="/admin/posts?kind=articles">Articles</a> |
      <a href="/admin/posts?kind=digests">Digests</a> |
      <a href="/admin/posts/new?kind={html.escape(kind)}">New</a>
    </p>
    <table>
      <thead>
        <tr>
          <th>Slug</th>
          <th>Title</th>
          <th>Description</th>
          <th>Body (preview)</th>
          <th></th>
        </tr>
      </thead>
      <tbody>{items or empty}</tbody>
    </table>
    """
    return _layout("Posts", body)


@app.get("/admin/posts/new", response_class=HTMLResponse)
def posts_new(
    _: Annotated[None, Depends(require_admin)],
    kind: str = "articles",
) -> str:
    if kind not in ("articles", "digests"):
        kind = "articles"
    body = f"""
    <h1>New post</h1>
    <form method="post" action="/admin/posts">
      <input type="hidden" name="kind" value="{html.escape(kind)}">
      <label>Slug <input name="slug" required pattern="[a-z0-9-]+"></label>
      <label>Title <input name="title" required></label>
      <label>Description（支持 Markdown，如 <code>**粗体**</code>）
        <input name="description">
      </label>
      <label>Body（Markdown 正文）
        <textarea name="body" required></textarea>
      </label>
      <p class="muted">正文里的 <code>(TL;DR)</code> 仅作编辑标记；同步到站点预览时会自动隐藏。</p>
      <button type="submit">Create</button>
    </form>
    """
    return _layout("New post", body)


@app.post("/admin/posts")
def posts_create(
    _: Annotated[None, Depends(require_admin)],
    kind: str = Form(...),
    slug: str = Form(...),
    title: str = Form(...),
    description: str = Form(""),
    body: str = Form(...),
) -> RedirectResponse:
    if kind not in ("articles", "digests"):
        raise HTTPException(status_code=400, detail="invalid kind")
    post = _post_from_form(kind, slug, title, description, body)
    write_post(post)
    url = f"/admin/posts/{post.slug}/edit?kind={kind}&saved=1"
    return RedirectResponse(url=url, status_code=303)


@app.get("/admin/posts/{slug}/edit", response_class=HTMLResponse)
def posts_edit(
    _: Annotated[None, Depends(require_admin)],
    slug: str,
    kind: str = "articles",
    saved: str = "",
) -> str:
    if kind not in ("articles", "digests"):
        kind = "articles"
    post = read_post(kind, slug)
    slug_e = html.escape(post.slug)
    preview = _preview_panel(kind, post.slug, saved=saved == "1")
    body = f"""
    <h1>Edit {slug_e}</h1>
    {preview}
    <form method="post" action="/admin/posts/{slug_e}">
      <input type="hidden" name="kind" value="{html.escape(kind)}">
      <label>Title <input name="title" value="{html.escape(post.title)}" required>
      </label>
      <label>Description（Markdown）
        <input name="description" value="{html.escape(post.description)}">
      </label>
      <label>Body（Markdown）
        <textarea name="body" required>{html.escape(post.body)}</textarea>
      </label>
      <button type="submit">Save</button>
      <a class="btn-preview secondary" href="{html.escape(preview_post_url(kind, post.slug), quote=True)}"
        target="_blank" rel="noopener noreferrer">Save 后去预览 ↗</a>
    </form>
    <form method="post" action="/admin/posts/{slug_e}/delete"
      onsubmit="return confirm('Delete this post?');">
      <input type="hidden" name="kind" value="{html.escape(kind)}">
      <button type="submit" class="danger">Delete</button>
    </form>
    """
    return _layout(f"Edit {post.slug}", body)


@app.post("/admin/posts/{slug}")
def posts_update(
    _: Annotated[None, Depends(require_admin)],
    slug: str,
    kind: str = Form(...),
    title: str = Form(...),
    description: str = Form(""),
    body: str = Form(...),
) -> RedirectResponse:
    if kind not in ("articles", "digests"):
        raise HTTPException(status_code=400, detail="invalid kind")
    post = _post_from_form(kind, slug, title, description, body)
    write_post(post)
    url = f"/admin/posts/{post.slug}/edit?kind={kind}&saved=1"
    return RedirectResponse(url=url, status_code=303)


@app.post("/admin/posts/{slug}/delete")
def posts_delete(
    _: Annotated[None, Depends(require_admin)],
    slug: str,
    kind: str = Form(...),
) -> RedirectResponse:
    if kind not in ("articles", "digests"):
        raise HTTPException(status_code=400, detail="invalid kind")
    delete_post(kind, validate_slug(slug))
    return RedirectResponse(url=f"/admin/posts?kind={kind}", status_code=303)


@app.get("/admin/wire-deep", response_class=HTMLResponse)
def wire_deep_index(_: Annotated[None, Depends(require_admin)]) -> str:
    rows = []
    for item in load_wire_items():
        wid = html.escape(str(item.get("id", "")))
        title = html.escape(str(item.get("title", "")))
        label = html.escape(str(item.get("sourceLabel", "")))
        cached = "✓" if read_cached_html(str(item.get("id", ""))) else "—"
        rows.append(
            f"<tr><td><code>{wid}</code></td>"
            f"<td>{label}</td>"
            f"<td>{title}</td>"
            f"<td>{cached}</td>"
            f'<td><a href="/admin/wire-deep/{wid}">粘贴 HTML</a></td></tr>'
        )
    empty = '<tr><td colspan="5" class="muted">无 feed-external 条目</td></tr>'
    body = f"""
    <h1>Wire 精读 · HTML 缓存</h1>
    <p class="muted">浏览器打开原文 → 复制整页 HTML（或「另存为」源文件内容）粘贴保存。
      然后在本机运行 <code>npm run deep-read-feed -- --id &lt;id&gt;</code>
      （会读 <code>data/wire-html/</code>，不再请求外网）。</p>
    <table>
      <thead><tr><th>id</th><th>源</th><th>标题</th><th>缓存</th><th></th></tr></thead>
      <tbody>{"".join(rows) or empty}</tbody>
    </table>
    """
    return _layout("Wire deep-read HTML", body)


@app.get("/admin/wire-deep/{wire_id}", response_class=HTMLResponse)
def wire_deep_edit(
    _: Annotated[None, Depends(require_admin)],
    wire_id: str,
    saved: str = "",
    error: str = "",
) -> str:
    try:
        item = get_wire_item(wire_id)
    except WireHtmlError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    cached = read_cached_html(wire_id)
    html_value = html.escape(cached[0]) if cached else ""
    wid_e = html.escape(wire_id)
    url_e = html.escape(str(item.get("url", "")))
    title_e = html.escape(str(item.get("title", "")))
    note = '<p class="muted">已写入 data/wire-html/</p>' if saved == "1" else ""
    err = (
        f'<p class="muted" style="color:#f5b70a">{html.escape(error)}</p>' if error else ""
    )
    body = f"""
    <h1>粘贴 HTML</h1>
    <p><strong>{title_e}</strong></p>
    <p class="muted"><a href="{url_e}" target="_blank" rel="noopener noreferrer">{url_e}</a></p>
    {note}{err}
    <form method="post" action="/admin/wire-deep/{wid_e}">
      <input type="hidden" name="url" value="{url_e}">
      <label>HTML（整页源码，≤2MB）
        <textarea name="html" class="wire-html" required>{html_value}</textarea>
      </label>
      <button type="submit">保存到 wire-html 缓存</button>
    </form>
    <p><a href="/admin/wire-deep">← 列表</a></p>
    """
    return _layout(f"Wire {wire_id}", body)


@app.post("/admin/wire-deep/{wire_id}")
def wire_deep_save(
    _: Annotated[None, Depends(require_admin)],
    wire_id: str,
    url: str = Form(...),
    html: str = Form(...),
) -> RedirectResponse:
    try:
        get_wire_item(wire_id)
        save_wire_html(wire_id, url, html)
    except WireHtmlError as exc:
        return RedirectResponse(
            url=f"/admin/wire-deep/{wire_id}?error={quote(str(exc))}",
            status_code=303,
        )
    return RedirectResponse(
        url=f"/admin/wire-deep/{wire_id}?saved=1",
        status_code=303,
    )
