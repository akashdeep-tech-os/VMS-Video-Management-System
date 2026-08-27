import asyncio
import logging
import platform
import time

from fastapi import APIRouter

from app.schemas.system import CpuInfo, RamInfo, StorageInfo, SystemHealthResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/system", tags=["system"])

_cache: tuple[float, SystemHealthResponse] | None = None
CACHE_TTL = 5.0  # seconds


def _get_disk_path() -> str:
    import psutil

    if platform.system() == "Windows":
        import string

        for letter in reversed(string.ascii_uppercase):
            path = f"{letter}:\\"
            try:
                psutil.disk_usage(path)
                return path
            except (FileNotFoundError, PermissionError):
                continue
        return "C:\\"
    return "/"


def _read_system_metrics() -> SystemHealthResponse:
    import psutil

    cpu_pct = psutil.cpu_percent(interval=0.1)
    cpu_cores = psutil.cpu_count(logical=True) or 1

    mem = psutil.virtual_memory()
    ram_total_gb = round(mem.total / (1024**3), 2)
    ram_used_gb = round(mem.used / (1024**3), 2)
    ram_free_gb = round(mem.available / (1024**3), 2)

    disk = psutil.disk_usage(_get_disk_path())
    stor_total_gb = round(disk.total / (1024**3), 2)
    stor_used_gb = round(disk.used / (1024**3), 2)
    stor_free_gb = round(disk.free / (1024**3), 2)
    stor_used_pct = round(disk.percent, 1)
    stor_free_pct = round(100.0 - stor_used_pct, 1)

    # Mark degraded when CPU > 90% or RAM > 90%
    overall = "operational"
    if cpu_pct > 90 or (mem.percent > 90):
        overall = "degraded"

    return SystemHealthResponse(
        overall=overall,
        cpu=CpuInfo(usage_pct=round(cpu_pct, 1), cores=cpu_cores),
        ram=RamInfo(
            total_gb=ram_total_gb,
            used_gb=ram_used_gb,
            free_gb=ram_free_gb,
            used_pct=round(mem.percent, 1),
        ),
        storage=StorageInfo(
            total_gb=stor_total_gb,
            used_gb=stor_used_gb,
            free_gb=stor_free_gb,
            used_pct=stor_used_pct,
            free_pct=stor_free_pct,
        ),
    )


@router.get("/health", response_model=SystemHealthResponse)
async def system_health() -> SystemHealthResponse:
    global _cache
    now = time.monotonic()
    if _cache and now - _cache[0] < CACHE_TTL:
        return _cache[1]

    try:
        result = await asyncio.to_thread(_read_system_metrics)
    except Exception as exc:
        logger.warning("psutil unavailable, returning degraded health: %s", exc)
        result = SystemHealthResponse(
            overall="degraded",
            cpu=CpuInfo(usage_pct=0, cores=1),
            ram=RamInfo(total_gb=0, used_gb=0, free_gb=0, used_pct=0),
            storage=StorageInfo(total_gb=0, used_gb=0, free_gb=0, used_pct=0, free_pct=0),
        )

    _cache = (now, result)
    return result
