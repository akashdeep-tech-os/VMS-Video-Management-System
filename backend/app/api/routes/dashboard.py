import asyncio
import logging
import time

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.camera import Camera
from app.schemas.dashboard import DashboardStats
from app.services import mediamtx
from app.services.status import status_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

_system_cache: tuple[float, float | None, float | None] | None = None  # (checked_at, cpu, memory)
SYSTEM_TTL = 5.0


async def _system_stats() -> tuple[float | None, float | None]:
    """CPU/memory via psutil, cached briefly. None when psutil is unavailable."""
    global _system_cache
    now = time.monotonic()
    if _system_cache and now - _system_cache[0] < SYSTEM_TTL:
        return _system_cache[1], _system_cache[2]
    try:
        import psutil

        cpu, memory = await asyncio.to_thread(_read_system_stats)
    except Exception as exc:
        logger.debug("psutil stats unavailable: %s", exc)
        cpu, memory = None, None
    _system_cache = (now, cpu, memory)
    return cpu, memory


def _read_system_stats() -> tuple[float, float]:
    import psutil

    return psutil.cpu_percent(interval=0.1), psutil.virtual_memory().percent


@router.get("/stats", response_model=DashboardStats)
async def dashboard_stats(db: Session = Depends(get_db)) -> DashboardStats:
    cameras = list(db.scalars(select(Camera)).all())
    statuses = await status_service.statuses(cameras)
    publishing = await mediamtx.mediamtx.publishing_paths()
    cpu, memory = await _system_stats()

    total = len(cameras)
    disabled = sum(1 for status in statuses if status.state == "disabled")
    online = sum(1 for status in statuses if status.state == "online")
    enabled = total - disabled

    return DashboardStats(
        total=total,
        enabled=enabled,
        online=online,
        offline=enabled - online,
        disabled=disabled,
        live_streams=len(publishing),
        cpu=cpu,
        memory=memory,
    )
