import json
from pathlib import Path

import pytest

from src.feed_keyword_preview import (
    parse_keywords_text,
    save_config_keywords,
)


def test_parse_keywords_text() -> None:
    raw = """
    ai safety
    # comment
    cyber security

    """
    assert parse_keywords_text(raw) == ["ai safety", "cyber security"]


def test_save_config_keywords(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    import src.feed_keyword_preview as fkp

    cfg = tmp_path / "security-feeds.json"
    cfg.write_text(
        json.dumps({"maxItems": 80, "keywords": ["old"], "feeds": []}),
        encoding="utf-8",
    )
    monkeypatch.setattr(fkp, "CONFIG_PATH", cfg)
    save_config_keywords(["a", "b"])
    data = json.loads(cfg.read_text(encoding="utf-8"))
    assert data["keywords"] == ["a", "b"]
    assert data["maxItems"] == 80
