from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "SentinelFlow"
    environment: str = "development"

    workspace_dir: str = str(
        Path(__file__).resolve().parents[3] / "workspace"
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )


settings = Settings()