"""Camera status service with server-side caching.

Checking ONVIF reachability means a TCP connect per camera; for 100 cameras
that must happen once per TTL (15 s), not per request. Concurrency is capped
so the checks never hammer the network or the event loop.
"""

import asyncio
import logging
import time

from app.models.camera import Camera
from app.schemas.camera import CameraStatus
from app.services import mediamtx
from app.services.onvif import _tcp_reachable

logger = logging.getLogger(__name__)

STATUS_TTL = 15.0
MAX_CONCURRENT_CHECKS = 20


class CameraStatusService:
    def __init__(self) -> None:
        self._semaphore = asyncio.Semaphore(MAX_CONCURRENT_CHECKS)
        self._cache: dict[int, tuple[float, bool]] = {}  # camera_id -> (checked_at, onvif_reachable)

    async def _check_onvif(self, camera: Camera) -> bool:
        now = time.monotonic()
        cached = self._cache.get(camera.id)
        if cached and now - cached[0] < STATUS_TTL:
            return cached[1]
        async with self._semaphore:
            reachable = await asyncio.to_thread(_tcp_reachable, camera.ip_address, camera.onvif_port)
        self._cache[camera.id] = (time.monotonic(), reachable)
        return reachable

    async def statuses(self, cameras: list[Camera]) -> list[CameraStatus]:
        """Bulk status for all cameras using a single MediaMTX query."""
        publishing = await mediamtx.mediamtx.publishing_paths()

        async def one(camera: Camera) -> CameraStatus:
            if not camera.enabled:
                return CameraStatus(camera_id=camera.id, onvif_reachable=False, stream_publishing=False, state="disabled")
            reachable = await self._check_onvif(camera)
            is_publishing = mediamtx.path_name(camera.id) in publishing
            return CameraStatus(
                camera_id=camera.id,
                onvif_reachable=reachable,
                stream_publishing=is_publishing,
                state="online" if reachable else "offline",
            )

        return await asyncio.gather(*(one(camera) for camera in cameras))

    async def status(self, camera: Camera) -> CameraStatus:
        return (await self.statuses([camera]))[0]


status_service = CameraStatusService()
