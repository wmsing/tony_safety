"""配置加载测试。"""

from src.config import Settings


def test_settings_load_defaults() -> None:
    cfg = Settings(app_env="test")
    assert cfg.app_env == "test"
