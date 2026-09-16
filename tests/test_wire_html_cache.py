import json
from pathlib import Path

import pytest

from src.wire_html_cache import (
    WireHtmlError,
    save_wire_html,
    validate_wire_id,
)


def test_validate_wire_id() -> None:
    assert validate_wire_id("cffee32c5fe965c9") == "cffee32c5fe965c9"
    with pytest.raises(WireHtmlError):
        validate_wire_id("not-an-id")


def test_save_wire_html(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    import src.wire_html_cache as whc

    monkeypatch.setattr(whc, "WIRE_HTML_DIR", tmp_path)
    save_wire_html("cffee32c5fe965c9", "https://example.com/a", "<html><body>x</body></html>")
    assert (tmp_path / "cffee32c5fe965c9.html").is_file()
    meta = json.loads((tmp_path / "cffee32c5fe965c9.json").read_text(encoding="utf-8"))
    assert meta["url"] == "https://example.com/a"
    assert meta["source"] == "admin"
