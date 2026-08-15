from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(PROJECT_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Live Streaming"
    app_env: str = "development"
    app_version: str = "0.1.0"

    api_host: str = "127.0.0.1"
    api_port: int = 8000

    log_level: str = "INFO"
    log_dir: str = str(PROJECT_ROOT / "backend" / "logs")

    database_url: str = "sqlite:///" + str(PROJECT_ROOT / "backend" / "streaming.db").replace("\\", "/")

    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    mediamtx_api_url: str = "http://localhost:9997"
    mediamtx_rtsp_url: str = "rtsp://localhost:8554"
    mediamtx_rtmp_url: str = "rtmp://localhost:1935"
    mediamtx_hls_url: str = "http://localhost:8888"
    mediamtx_webrtc_url: str = "http://localhost:8889"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
