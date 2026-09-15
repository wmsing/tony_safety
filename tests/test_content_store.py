"""content_store 读写测试。"""

import pytest

from src.content_store import (
    Post,
    delete_post,
    read_post,
    repo_root,
    serialize_post,
    strip_tldr_for_site,
    write_post,
)


def test_serialize_roundtrip() -> None:
    post = Post(
        kind="articles",
        slug="demo",
        title="标题: 测试",
        description="简介",
        body="正文\n\n段落二",
    )
    raw = serialize_post(post)
    assert raw.startswith("---\n")
    assert "title:" in raw
    write_post(post)
    loaded = read_post("articles", "demo")
    assert loaded.title == post.title
    assert loaded.body.strip() == post.body.strip()
    synced = repo_root() / "site/content/docs/articles/demo.md"
    assert synced.is_file()
    delete_post("articles", "demo")
    assert not synced.is_file()


def test_strip_tldr_for_site() -> None:
    raw = "⚡ **3 秒极速版 (TL;DR)**\n\n正文"
    assert "(TL;DR)" not in strip_tldr_for_site(raw)
    assert "3 秒极速版" in strip_tldr_for_site(raw)


def test_validate_slug_rejects_bad() -> None:
    with pytest.raises(ValueError):
        write_post(
            Post(kind="articles", slug="../evil", title="x", description="", body="y"),
        )
