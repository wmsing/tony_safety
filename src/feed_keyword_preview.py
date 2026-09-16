"""Admin：试跑 fetch-feeds 关键词过滤（调用 scripts/fetch-feeds.mjs --preview）。"""

from __future__ import annotations

import json
import subprocess
import tempfile
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parent.parent
CONFIG_PATH = REPO_ROOT / "config" / "security-feeds.json"
FETCH_SCRIPT = REPO_ROOT / "scripts" / "fetch-feeds.mjs"


class FeedKeywordError(Exception):
    pass


def parse_keywords_text(text: str) -> list[str]:
    out: list[str] = []
    for line in text.splitlines():
        s = line.strip()
        if not s or s.startswith("#"):
            continue
        out.append(s)
    return out


def keywords_to_text(keywords: list[str]) -> str:
    if not keywords:
        return ""
    return "\n".join(keywords) + "\n"


def load_config_keywords() -> list[str]:
    raw = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    kws = raw.get("keywords")
    if not isinstance(kws, list):
        return []
    return [str(k) for k in kws]


def save_config_keywords(keywords: list[str]) -> None:
    data = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    data["keywords"] = keywords
    CONFIG_PATH.write_text(
        f"{json.dumps(data, indent=2, ensure_ascii=False)}\n",
        encoding="utf-8",
    )


def run_fetch_preview(keywords: list[str], timeout_sec: int = 120) -> dict[str, Any]:
    if not FETCH_SCRIPT.is_file():
        raise FeedKeywordError("scripts/fetch-feeds.mjs missing")

    with tempfile.NamedTemporaryFile(
        mode="w",
        suffix=".txt",
        delete=False,
        encoding="utf-8",
    ) as tmp:
        tmp.write(keywords_to_text(keywords))
        kw_path = tmp.name

    kw_file = Path(kw_path)
    try:
        proc = subprocess.run(
            [
                "node",
                str(FETCH_SCRIPT),
                "--preview",
                "--keywords-file",
                str(kw_file),
            ],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            timeout=timeout_sec,
            check=False,
        )
    finally:
        kw_file.unlink(missing_ok=True)

    if proc.returncode != 0:
        detail = (proc.stderr or proc.stdout or "preview failed").strip()
        raise FeedKeywordError(detail[:2000])

    try:
        return json.loads(proc.stdout)
    except json.JSONDecodeError as exc:
        raise FeedKeywordError(f"invalid preview JSON: {exc}") from exc
