"""启动本地 Admin（仅绑定 127.0.0.1）。用法: ADMIN_TOKEN=… python -m src.admin"""

from __future__ import annotations

import os
from pathlib import Path

import uvicorn
from dotenv import load_dotenv


def main() -> None:
    load_dotenv(Path(__file__).resolve().parent.parent / ".env")
    if not os.environ.get("ADMIN_TOKEN", "").strip():
        raise SystemExit("Set ADMIN_TOKEN before starting admin (see .env.example).")
    uvicorn.run(
        "src.admin_app:app",
        host="127.0.0.1",
        port=int(os.environ.get("ADMIN_PORT", "8787")),
        reload=os.environ.get("APP_ENV") == "development",
    )


if __name__ == "__main__":
    main()
