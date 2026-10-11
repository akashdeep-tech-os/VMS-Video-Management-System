"""Recorded playback for CP Plus / Dahua style NVRs.

CP Plus is a Dahua OEM, and Dahua recorders ignore time parameters on the live
``/cam/realmonitor`` URL (verified against the fleet: even ``starttime=20270101``
returns the live stream). Recorded playback has its own RTSP path with
underscore-formatted times:

    rtsp://user:pass@ip:port/cam/playback?channel=1&subtype=0
        &starttime=2026_10_09_12_00_00&endtime=2026_10_09_12_05_00

Verified behaviour on the fleet's NVRs:
* ``404 Not Found`` when nothing is recorded at that time (times are honoured),
* the stream ends at ``endtime`` and is paced at ~1x real time,
* ``subtype=1`` is rejected with 404, so playback always uses the main stream.

The rest of the system is unchanged: the route only registers the playback URL
as another on-demand MediaMTX path and the browser plays it over WHEP.
"""

import asyncio
import logging
import os
import re
import shutil
import subprocess
import tempfile
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from starlette.background import BackgroundTask

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.rbac import ROLE_ADMIN
from app.models.camera import Camera
from app.models.user import User
from app.schemas.playback import PlaybackResponse, PlaybackStartRequest
from app.services import mediamtx
from app.services.onvif import build_rtsp_url

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/playback", tags=["playback"])

# MediaMTX paths this router owns. Anything else can never be removed through
# DELETE /playback/stop, so a tampered query cannot un-register live cameras.
PLAYBACK_PATH_PREFIX = "pb"

# (user_id, camera_id) -> MediaMTX path currently serving that user's playback
# for that camera. A seek registers a fresh path (the player re-mounts on a new
# URL), so the previous one has to be de-registered here - the frontend only
# stops the path it last saw, and a fast double seek could otherwise orphan the
# middle one. Keying by user keeps two operators watching the same camera from
# interfering with each other.
_active_paths: dict[tuple[int, int], str] = {}
_registration_lock = asyncio.Lock()


def _fmt_dahua_time(dt: datetime) -> str:
    return dt.strftime("%Y_%m_%d_%H_%M_%S")


def _path_name(user: User, camera_id: int, start: datetime) -> str:
    # No slashes: the name is used verbatim in http://host:8889/{path}/whep.
    return (
        f"{PLAYBACK_PATH_PREFIX}_u{user.id}_c{camera_id}"
        f"_{start.strftime('%Y-%m-%d_%H-%M-%S')}"
    )


def build_playback_source(camera: Camera, start: datetime, end: datetime) -> str:
    """Build the NVR's recorded-playback RTSP URL for this camera.

    Dahua-family paths (``/cam/realmonitor?channel=N&...``) are converted to
    ``/cam/playback?channel=N&subtype=0&starttime=...&endtime=...``. Anything
    else gets the time window appended to its stored path as a best effort.
    """
    rtsp_path = camera.rtsp_path or ""
    match = re.search(r"channel=(\d+)", rtsp_path)
    channel = int(match.group(1)) if match else (camera.channel or 1)
    window = f"starttime={_fmt_dahua_time(start)}&endtime={_fmt_dahua_time(end)}"

    if "realmonitor" in rtsp_path:
        path = f"/cam/playback?channel={channel}&subtype=0&{window}"
    else:
        separator = "&" if "?" in rtsp_path else "?"
        path = f"{rtsp_path}{separator}{window}"

    return build_rtsp_url(camera.ip_address, camera.rtsp_port, path, camera.username, camera.password)


def _parse_window(date: str, start_time: str, end_time: str | None) -> tuple[datetime, datetime]:
    """Turn the form's date + start/end times into a sane datetimes pair."""
    try:
        start = datetime.strptime(f"{date} {start_time}", "%Y-%m-%d %H:%M:%S")
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid date or start time")

    if end_time:
        try:
            end = datetime.strptime(f"{date} {end_time}", "%Y-%m-%d %H:%M:%S")
        except ValueError:
            raise HTTPException(status_code=422, detail="Invalid end time")
    else:
        end = start.replace(hour=23, minute=59, second=59)

    if end <= start:
        # End at/before the start (empty or mis-picked end time): run for the
        # rest of the day - unless the start is already the last second.
        end = start.replace(hour=23, minute=59, second=59)
        if end <= start:
            end = start + timedelta(hours=1)
    return start, end


def _assert_can_play(user: User, camera: Camera) -> None:
    """ADMIN always may; a USER needs the playback right (and camera grant)."""
    if user.role == ROLE_ADMIN:
        return
    if not user.holds_right("playback"):
        raise HTTPException(status_code=403, detail="Playback right not granted")
    granted = (user.channel_rights or {}).get("playback")
    if granted is not None and camera.id not in granted:
        raise HTTPException(status_code=403, detail="Not allowed to play back this camera")


def _load_camera(db: Session, user: User, camera_id: int) -> Camera:
    camera = db.get(Camera, camera_id)
    if camera is None:
        raise HTTPException(status_code=404, detail="Camera not found")
    _assert_can_play(user, camera)
    if not camera.enabled:
        raise HTTPException(status_code=403, detail="Camera is disabled")
    if not camera.rtsp_path:
        raise HTTPException(status_code=400, detail="Camera has no RTSP path configured")
    return camera


async def _begin(db: Session, user: User, payload: PlaybackStartRequest) -> PlaybackResponse:
    camera = _load_camera(db, user, payload.camera_id)
    start, end = _parse_window(payload.date, payload.time, payload.end_time)
    source = build_playback_source(camera, start, end)
    key = (user.id, camera.id)
    path = _path_name(user, camera.id, start)

    async with _registration_lock:
        previous = _active_paths.get(key)
        if previous and previous != path:
            await mediamtx.mediamtx.remove_path(previous)
        registered = await mediamtx.mediamtx.add_path(path, source)
        if registered:
            _active_paths[key] = path
        else:
            if _active_paths.get(key) in (previous, path):
                _active_paths.pop(key, None)
            raise HTTPException(
                status_code=502,
                detail="MediaMTX could not register the playback stream",
            )

    logger.info(
        "Playback registered camera=%s window=%s..%s path=%s",
        camera.id, start.isoformat(), end.isoformat(), path,
    )
    return PlaybackResponse(
        camera_id=camera.id,
        date=payload.date,
        start_time=payload.time,
        end_time=end.strftime("%H:%M:%S"),
        media_mtx_path=path,
        webrtc_url=f"{settings.mediamtx_webrtc_url.rstrip('/')}/{path}",
    )


@router.post("/start", response_model=PlaybackResponse)
async def start_playback(
    payload: PlaybackStartRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> PlaybackResponse:
    return await _begin(db, user, payload)


@router.post("/seek", response_model=PlaybackResponse)
async def seek_playback(
    payload: PlaybackStartRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> PlaybackResponse:
    # A seek is the same operation as start: register the window again from a
    # new point in time (the old path is dropped inside _begin).
    return await _begin(db, user, payload)


@router.delete("/stop")
async def stop_playback(
    media_mtx_path: str = Query(..., alias="mediaMtxPath"),
    user: User = Depends(get_current_user),
) -> dict:
    if not media_mtx_path.startswith(f"{PLAYBACK_PATH_PREFIX}_"):
        raise HTTPException(status_code=400, detail="Not a playback path")
    async with _registration_lock:
        await mediamtx.mediamtx.remove_path(media_mtx_path)
        for key, path in list(_active_paths.items()):
            if path == media_mtx_path:
                del _active_paths[key]
    return {"status": "stopped", "mediaMtxPath": media_mtx_path}


def _record_clip(source_url: str, destination: str, duration_seconds: int) -> tuple[bool, str]:
    """Copy the RTSP playback window into an MP4 (blocking - run in a thread)."""
    ffmpeg = shutil.which("ffmpeg")
    if ffmpeg is None:
        return False, "ffmpeg is not installed on the server"

    command = [
        ffmpeg, "-y", "-hide_banner", "-loglevel", "error",
        "-rtsp_transport", "tcp",
        "-i", source_url,
        "-c:v", "copy",
        # The fleet's cameras send G.711 (pcm_mulaw), which MP4 cannot carry.
        "-c:a", "aac", "-b:a", "128k",
        "-movflags", "+faststart",
        "-t", str(duration_seconds),
        destination,
    ]
    try:
        proc = subprocess.run(command, capture_output=True, text=True, timeout=duration_seconds + 120)
    except subprocess.TimeoutExpired:
        return False, "The recording took too long to export and was aborted"
    if proc.returncode != 0:
        lines = (proc.stderr or "").strip().splitlines()
        return False, lines[-1] if lines else f"ffmpeg exited with code {proc.returncode}"
    if not os.path.exists(destination) or os.path.getsize(destination) == 0:
        return False, "The recorder returned no data for that time window"
    return True, ""


@router.get("/download/{camera_id}")
async def download_clip(
    camera_id: int,
    date: str = Query(..., pattern=r"^\d{4}-\d{2}-\d{2}$"),
    start_time: str = Query(..., alias="startTime", pattern=r"^\d{2}:\d{2}:\d{2}$"),
    end_time: str = Query(..., alias="endTime", pattern=r"^\d{2}:\d{2}:\d{2}$"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> FileResponse:
    """Export [startTime..endTime] of one camera as an MP4 download."""
    camera = _load_camera(db, user, camera_id)
    start, end = _parse_window(date, start_time, end_time)
    source = build_playback_source(camera, start, end)
    duration = int((end - start).total_seconds())

    handle = tempfile.NamedTemporaryFile(suffix=".mp4", delete=False)
    handle.close()
    try:
        ok, error = await asyncio.to_thread(_record_clip, source, handle.name, duration)
    except Exception:
        os.unlink(handle.name)
        raise HTTPException(status_code=500, detail="Clip export failed")

    if not ok:
        os.unlink(handle.name)
        raise HTTPException(status_code=502, detail=error)

    filename = f"camera-{camera.id}_{date}_{start_time}-{end_time}.mp4".replace(":", "")
    return FileResponse(
        handle.name,
        media_type="video/mp4",
        filename=filename,
        background=BackgroundTask(_remove_file, handle.name),
    )


def _remove_file(path: str) -> None:
    try:
        os.unlink(path)
    except OSError:
        pass
