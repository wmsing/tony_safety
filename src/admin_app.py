"""本地 Admin：CRUD content/zh 下的 Markdown（勿暴露到公网）。"""

from __future__ import annotations

import hashlib
import hmac
import html
import os
import secrets
from pathlib import Path
from typing import Annotated

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
    <a href="/admin/logout">Logout</a>
    <span class="muted">本地 only · 127.0.0.1</span>
  </nav>
  {body}
</body>
</html>"""


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
        f"<tr><td>{html.escape(p.slug)}</td>"
        f"<td>{html.escape(p.title)}</td>"
        f'<td><a href="/admin/posts/{html.escape(p.slug)}/edit?kind={kind}">'
        f"Edit</a></td></tr>"
        for p in rows
    )
    empty = '<tr><td colspan="3" class="muted">暂无</td></tr>'
    body = f"""
    <h1>Posts ({html.escape(kind)})</h1>
    <p class="muted">保存后执行 <code>npm run build</code> 或 push 更新站点。</p>
    <p>
      <a href="/admin/posts?kind=articles">Articles</a> |
      <a href="/admin/posts?kind=digests">Digests</a> |
      <a href="/admin/posts/new?kind={html.escape(kind)}">New</a>
    </p>
    <table>
      <thead><tr><th>Slug</th><th>Title</th><th></th></tr></thead>
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
      <label>Description <input name="description"></label>
      <label>Body (Markdown) <textarea name="body" required></textarea></label>
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
    url = f"/admin/posts/{post.slug}/edit?kind={kind}"
    return RedirectResponse(url=url, status_code=303)


@app.get("/admin/posts/{slug}/edit", response_class=HTMLResponse)
def posts_edit(
    _: Annotated[None, Depends(require_admin)],
    slug: str,
    kind: str = "articles",
) -> str:
    if kind not in ("articles", "digests"):
        kind = "articles"
    post = read_post(kind, slug)
    slug_e = html.escape(post.slug)
    body = f"""
    <h1>Edit {slug_e}</h1>
    <form method="post" action="/admin/posts/{slug_e}">
      <input type="hidden" name="kind" value="{html.escape(kind)}">
      <label>Title <input name="title" value="{html.escape(post.title)}" required>
      </label>
      <label>Description
        <input name="description" value="{html.escape(post.description)}">
      </label>
      <label>Body
        <textarea name="body" required>{html.escape(post.body)}</textarea>
      </label>
      <button type="submit">Save</button>
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
    return RedirectResponse(url=f"/admin/posts?kind={kind}", status_code=303)


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
