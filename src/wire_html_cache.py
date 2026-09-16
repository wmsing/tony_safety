"""Wire 精读：本地 HTML 缓存（与 scripts/deep-read-feed.mjs 同路径）。"""

from __future__ import annotations

import json
import re
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parent.parent
FEED_EXTERNAL_PATH = REPO_ROOT / "data" / "feed-external.json"
WIRE_HTML_DIR = REPO_ROOT / "data" / "wire-html"
WIRE_ID_RE = re.compile(r"^[a-f0-9]{16}$")
MAX_HTML_BYTES = 2 * 1024 * 1024


class WireHtmlError(ValueError):
    pass


def validate_wire_id(wire_id: str) -> str:
    cleaned = wire_id.strip().lower()
    if not WIRE_ID_RE.fullmatch(cleaned):
        raise WireHtmlError("invalid wire id")
    return cleaned


def load_wire_items(limit: int = 40) -> list[dict[str, Any]]:
    raw = json.loads(FEED_EXTERNAL_PATH.read_text(encoding="utf-8"))
    items = list(raw.get("items") or [])
    items.sort(key=lambda x: x.get("publishedAt") or "", reverse=True)
    return items[:limit]


def get_wire_item(wire_id: str) -> dict[str, Any]:
    wid = validate_wire_id(wire_id)
    for item in load_wire_items(limit=10_000):
        if item.get("id") == wid:
            return item
    raise WireHtmlError("wire id not in feed-external.json")


def _paths(wire_id: str) -> tuple[Path, Path]:
    wid = validate_wire_id(wire_id)
    html_path = WIRE_HTML_DIR / f"{wid}.html"
    meta_path = WIRE_HTML_DIR / f"{wid}.json"
    return html_path, meta_path


def read_cached_html(wire_id: str) -> tuple[str, dict[str, Any]] | None:
    html_path, meta_path = _paths(wire_id)
    if not html_path.is_file() or not meta_path.is_file():
        return None
    meta = json.loads(meta_path.read_text(encoding="utf-8"))
    html = html_path.read_text(encoding="utf-8")
    if not html.strip():
        return None
    return html, meta


def save_wire_html(wire_id: str, url: str, html: str) -> None:
    wid = validate_wire_id(wire_id)
    url = url.strip()
    if not url:
        raise WireHtmlError("url required")
    body = html.strip()
    if not body:
        raise WireHtmlError("html is empty")
    encoded = body.encode("utf-8")
    if len(encoded) > MAX_HTML_BYTES:
        raise WireHtmlError(f"html exceeds {MAX_HTML_BYTES} bytes")

    WIRE_HTML_DIR.mkdir(parents=True, exist_ok=True)
    html_path, meta_path = _paths(wid)
    html_path.write_text(body if body.endswith("\n") else f"{body}\n", encoding="utf-8")
    meta = {
        "url": url,
        "fetchedAt": datetime.now(UTC).isoformat().replace("+00:00", "Z"),
        "source": "admin",
    }
    meta_path.write_text(f"{json.dumps(meta, indent=2)}\n", encoding="utf-8")
