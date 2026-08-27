import asyncio
import logging
import time

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.camera import Camera
from app.schemas.dashboard import (
    DashboardCameras,
    DashboardOffline,
    DashboardOnline,
    DashboardStats,
    DashboardSummary,
    DashboardUsers,
    DashboardAlerts,
    StationCameraStats,
)
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


@router.get("/summary", response_model=DashboardSummary)
async def dashboard_summary(db: Session = Depends(get_db)) -> DashboardSummary:
    cameras = list(db.scalars(select(Camera)).all())
    statuses = await status_service.statuses(cameras)

    total_cameras = len(cameras)
    disabled = sum(1 for s in statuses if s.state == "disabled")
    enabled = total_cameras - disabled
    online = sum(1 for s in statuses if s.state == "online")
    offline_count = enabled - online

    stations_q = db.execute(select(func.count(func.distinct(Camera.manufacturer))))
    unique_stations = stations_q.scalar() or 0
    if unique_stations == 0:
        unique_stations = 1

    uptime_pct = round((online / enabled * 100), 1) if enabled > 0 else 0.0

    return DashboardSummary(
        users=DashboardUsers(total=0, active=0),
        cameras=DashboardCameras(total=total_cameras, stations=unique_stations),
        online=DashboardOnline(count=online, uptime_pct=uptime_pct),
        offline=DashboardOffline(count=offline_count),
        alerts=DashboardAlerts(total=0, critical=0),
    )


@router.get("/camera-stats", response_model=list[StationCameraStats])
async def dashboard_camera_stats(db: Session = Depends(get_db)) -> list[StationCameraStats]:
    cameras = list(db.scalars(select(Camera)).all())
    statuses = await status_service.statuses(cameras)

    status_map = {s.camera_id: s for s in statuses}

    station_groups: dict[str, list[Camera]] = {}
    for cam in cameras:
        station = cam.manufacturer or "Unknown"
        station_groups.setdefault(station, []).append(cam)

    result = []
    for station_name, station_cameras in station_groups.items():
        total = len(station_cameras)
        working = sum(1 for c in station_cameras if status_map.get(c.id, None) and status_map[c.id].state == "online")
        result.append(StationCameraStats(
            station_name=station_name,
            total=total,
            working=working,
            non_working=total - working,
        ))

    return sorted(result, key=lambda s: s.total, reverse=True)
