"""tony_safty 入口程序。"""

from src.config import settings


def main() -> None:
    print(f"[tony_safty] Running in {settings.app_env} mode")


if __name__ == "__main__":
    main()
