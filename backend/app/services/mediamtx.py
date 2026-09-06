"""MediaMTX control API client.

Only the endpoints needed for camera management are used (v1.19.3 API):
- POST   /v3/config/paths/replace/{name}  register or update an RTSP source
- DELETE /v3/config/paths/delete/{name}  remove a path
- GET    /v3/paths/list                  list paths + publishing state

The browser talks to MediaMTX directly (WHEP); this service never touches
video, it only manages stream paths.
"""

import logging
import time

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

PATH_PREFIX = "cam"


def path_name(camera_id: int) -> str:
    return f"{PATH_PREFIX}_{camera_id}"


def sub_path_name(camera_id: int) -> str:
    return f"{PATH_PREFIX}_{camera_id}_sub"


def webrtc_url(camera_id: int) -> str:
    return f"{settings.mediamtx_webrtc_url.rstrip('/')}/{path_name(camera_id)}/whep"


def sub_webrtc_url(camera_id: int) -> str:
    return f"{settings.mediamtx_webrtc_url.rstrip('/')}/{sub_path_name(camera_id)}/whep"


class MediaMTXClient:
    def __init__(self) -> None:
        self._client = httpx.AsyncClient(base_url=settings.mediamtx_api_url, timeout=5.0)
        self._paths_cache: tuple[float, dict[str, dict]] | None = None
        self._cache_ttl = 10.0

    async def close(self) -> None:
        await self._client.aclose()

    def _invalidate(self) -> None:
        self._paths_cache = None

    async def _list_paths(self) -> dict[str, dict]:
        """Cache of name -> raw path info, refreshed every few seconds."""
        now = time.monotonic()
        if self._paths_cache and now - self._paths_cache[0] < self._cache_ttl:
            return self._paths_cache[1]
        try:
            response = await self._client.get("/v3/paths/list")
            response.raise_for_status()
            items = response.json().get("items", [])
            mapping = {item.get("name"): item for item in items if item.get("name")}
            self._paths_cache = (now, mapping)
            return mapping
        except httpx.HTTPError as exc:
            logger.warning("MediaMTX paths list failed: %s", exc)
            return self._paths_cache[1] if self._paths_cache else {}

    @staticmethod
    def _is_publishing(path_info: dict) -> bool:
        """True when a path is actually serving a live stream right now.

        Experimentally verified on v1.19.3: ``online`` is true even when a
        sourceOnDemand pull is not running, so it cannot be used. The reliable
        indicators are ``available`` (source connected + tracks present) and a
        non-empty ``tracks2`` list.
        """
        if path_info.get("available") is True:
            return True
        if path_info.get("tracks2"):
            return True
        if path_info.get("ready") is True:
            return True
        if path_info.get("state") == "publishing":
            return True
        if path_info.get("ready") and (path_info.get("publishings") or path_info.get("publishers")):
            return True
        return False

    async def path_exists(self, name: str) -> bool:
        return name in await self._list_paths()

    async def publishing_paths(self) -> set[str]:
        """Names of all paths currently publishing (camera online = stream live)."""
        return {name for name, info in (await self._list_paths()).items() if self._is_publishing(info)}

    async def is_publishing(self, name: str) -> bool:
        info = (await self._list_paths()).get(name)
        return bool(info) and self._is_publishing(info)

    async def add_path(self, name: str, source_url: str) -> bool:
        """Register or update an RTSP pull source with MediaMTX.

        ``sourceOnDemand`` keeps the source stopped until a viewer connects
        (WHEP), which keeps 100 idle cameras from consuming bandwidth.

        Uses ``replace`` rather than ``add`` because both re-running NVR channel
        discovery and the startup re-registration sweep hit paths that already
        exist; ``add`` answers those with 400 "path already exists", which would
        park every healthy channel in the ``error`` state.
        """
        try:
            response = await self._client.post(
                f"/v3/config/paths/replace/{name}",
                json={
                    "source": source_url,
                    "sourceOnDemand": True,
                    # Pull the source over TCP: packets arrive in order, the
                    # browser's jitter buffer stays tiny, which keeps WHEP
                    # latency low and freezes rare even at 100 live cameras.
                    "rtspTransport": "tcp",
                    # Start the pull within 3s when a viewer connects so the
                    # stream appears almost instantly instead of waiting the
                    # default 10s.
                    "sourceOnDemandStartTimeout": "3s",
                },
            )
            response.raise_for_status()
            self._invalidate()
            logger.info("Registered MediaMTX path %s -> %s", name, source_url)
            return True
        except httpx.HTTPError as exc:
            logger.error("Failed to register MediaMTX path %s: %s", name, exc)
            return False

    async def remove_path(self, name: str) -> bool:
        try:
            response = await self._client.delete(f"/v3/config/paths/delete/{name}")
            if response.status_code not in (200, 404):
                response.raise_for_status()
            self._invalidate()
            return True
        except httpx.HTTPError as exc:
            logger.error("Failed to remove MediaMTX path %s: %s", name, exc)
            return False


mediamtx = MediaMTXClient()
