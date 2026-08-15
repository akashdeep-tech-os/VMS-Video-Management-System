import logging
import socket
import urllib.request
from urllib.parse import urlparse

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.schemas.health import ComponentStatus, HealthResponse

logger = logging.getLogger(__name__)

router = APIRouter(tags=["health"])


def _check_database(db: Session) -> ComponentStatus:
    try:
        db.execute(text("SELECT 1"))
        return ComponentStatus(status="ok")
    except Exception as exc:
        logger.error("Database health check failed: %s", exc)
        return ComponentStatus(status="degraded", detail=str(exc))


def _check_mediamtx() -> ComponentStatus:
    try:
        with urllib.request.urlopen(f"{settings.mediamtx_api_url}/v3/paths/list", timeout=3) as response:
            if response.status < 300:
                return ComponentStatus(status="ok")
            return ComponentStatus(status="degraded", detail=f"MediaMTX API returned HTTP {response.status}")
    except Exception:
        pass

    rtsp_host, rtsp_port = _host_and_port(settings.mediamtx_rtsp_url)
    if _tcp_reachable(rtsp_host, rtsp_port):
        return ComponentStatus(status="ok", detail="API disabled; reachable over RTSP")
    return ComponentStatus(status="degraded", detail="MediaMTX API unreachable")


def _host_and_port(url: str) -> tuple[str, int]:
    parsed = urlparse(url)
    host = parsed.hostname or "127.0.0.1"
    port = parsed.port or 8554
    return host, port


def _tcp_reachable(host: str, port: int) -> bool:
    try:
        with socket.create_connection((host, port), timeout=3):
            return True
    except OSError:
        return False


@router.get("/health", response_model=HealthResponse)
def health(db: Session = Depends(get_db)) -> HealthResponse:
    database = _check_database(db)
    mediamtx = _check_mediamtx()
    overall = "ok" if database.status == "ok" and mediamtx.status == "ok" else "degraded"
    return HealthResponse(
        status=overall,
        app_name=settings.app_name,
        version=settings.app_version,
        environment=settings.app_env,
        database=database,
        mediamtx=mediamtx,
    )
