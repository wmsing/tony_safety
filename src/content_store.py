"""读写 content/zh 下 Article / Digest 的 Markdown 源文件。"""

from __future__ import annotations

import json
import re
import shutil
from dataclasses import dataclass
from pathlib import Path

_SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
_KIND_DIRS = {"articles": "articles", "digests": "digests"}
_SYNC_DEST: dict[str, Path] = {
    "articles": Path("site/content/docs/articles"),
    "digests": Path("site/content/docs/digests"),
}


@dataclass(frozen=True)
class Post:
    kind: str
    slug: str
    title: str
    description: str
    body: str


def repo_root() -> Path:
    return Path(__file__).resolve().parent.parent


def content_dir(kind: str) -> Path:
    if kind not in _KIND_DIRS:
        raise ValueError(f"unknown kind: {kind}")
    return repo_root() / "content" / "zh" / _KIND_DIRS[kind]


def validate_slug(slug: str) -> str:
    slug = slug.strip().lower()
    if not _SLUG_RE.fullmatch(slug):
        raise ValueError("slug must be lowercase letters, numbers, and hyphens")
    return slug


def _parse_frontmatter(raw: str) -> tuple[dict[str, str], str]:
    if not raw.startswith("---"):
        return {}, raw.lstrip()
    parts = raw.split("---", 2)
    if len(parts) < 3:
        return {}, raw
    meta_block, body = parts[1], parts[2]
    meta: dict[str, str] = {}
    for line in meta_block.strip().splitlines():
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        key = key.strip()
        value = value.strip()
        if value.startswith('"') and value.endswith('"'):
            value = json.loads(value)
        meta[key] = value
    return meta, body.lstrip("\n")


def _quote_yaml(value: str) -> str:
    if re.search(r'[:#\n"]', value):
        return json.dumps(value, ensure_ascii=False)
    return value


def sync_post_to_site(kind: str, slug: str) -> None:
    """将单篇源稿复制到 Starlight 构建目录（与 scripts/sync-content.mjs 目标一致）。"""
    if kind not in _SYNC_DEST:
        raise ValueError(f"unknown kind: {kind}")
    slug = validate_slug(slug)
    src = content_dir(kind) / f"{slug}.md"
    dest_dir = repo_root() / _SYNC_DEST[kind]
    dest_dir.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dest_dir / f"{slug}.md")


def remove_post_from_site(kind: str, slug: str) -> None:
    if kind not in _SYNC_DEST:
        raise ValueError(f"unknown kind: {kind}")
    slug = validate_slug(slug)
    dest = repo_root() / _SYNC_DEST[kind] / f"{slug}.md"
    if dest.is_file():
        dest.unlink()


def serialize_post(post: Post) -> str:
    title = _quote_yaml(post.title)
    desc = _quote_yaml(post.description)
    return f"---\ntitle: {title}\ndescription: {desc}\n---\n\n{post.body.rstrip()}\n"


def list_posts(kind: str) -> list[Post]:
    directory = content_dir(kind)
    if not directory.is_dir():
        return []
    posts: list[Post] = []
    for path in sorted(directory.glob("*.md")):
        posts.append(read_post(kind, path.stem))
    return posts


def read_post(kind: str, slug: str) -> Post:
    slug = validate_slug(slug)
    path = content_dir(kind) / f"{slug}.md"
    if not path.is_file():
        raise FileNotFoundError(slug)
    raw = path.read_text(encoding="utf-8")
    meta, body = _parse_frontmatter(raw)
    return Post(
        kind=kind,
        slug=slug,
        title=meta.get("title", slug),
        description=meta.get("description", ""),
        body=body,
    )


def write_post(post: Post) -> Path:
    slug = validate_slug(post.slug)
    directory = content_dir(post.kind)
    directory.mkdir(parents=True, exist_ok=True)
    path = directory / f"{slug}.md"
    path.write_text(serialize_post(post), encoding="utf-8")
    sync_post_to_site(post.kind, slug)
    return path


def delete_post(kind: str, slug: str) -> None:
    slug = validate_slug(slug)
    path = content_dir(kind) / f"{slug}.md"
    if not path.is_file():
        raise FileNotFoundError(slug)
    path.unlink()
    remove_post_from_site(kind, slug)
