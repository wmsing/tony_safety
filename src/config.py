"""配置管理模块，从环境变量加载。"""

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    app_env: str = "development"


settings = Settings(app_env=os.environ.get("APP_ENV", "development"))
