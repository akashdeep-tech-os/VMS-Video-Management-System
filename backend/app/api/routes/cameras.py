import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.camera import Camera
from app.schemas.camera import CameraCreate, CameraCreateRtsp, CameraRead, CameraStatus, CameraUpdate
from app.services import mediamtx
from app.services.onvif import build_rtsp_url, derive_sub_path
from app.services.status import status_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/cameras", tags=["cameras"])

CONNECTION_FIELDS = {"ip_address", "onvif_port", "rtsp_port", "username", "password"}

# Group each NVR's channels together and sort them numerically. Ordering by
# name alone is wrong for channels: "X-Ch-10" sorts between "X-Ch-1" and
# "X-Ch-2". Standalone cameras have NULL nvr_id/channel and sort first by name.
CAMERA_ORDER = (Camera.nvr_id, Camera.channel, Camera.name)


async def _register_path(camera: Camera) -> None:
    """Register the camera's RTSP source with MediaMTX (best effort).

    Registers both main and sub stream paths. If no sub path is configured,
    the main stream source is used for the sub path as well, so the SUB/MAIN
    toggle always works.
    """
    source = build_rtsp_url(camera.ip_address, camera.rtsp_port, camera.rtsp_path, camera.username, camera.password)
    ok = await mediamtx.mediamtx.add_path(mediamtx.path_name(camera.id), source)

    # Register sub stream path — use dedicated sub path if configured,
    # otherwise try to derive it from the main path (e.g. Dahua subtype=0 -> 1),
    # and only fall back to the main source if no derivation is possible.
    sub_path = camera.rtsp_sub_path or derive_sub_path(camera.rtsp_path)
    if sub_path:
        sub_source = build_rtsp_url(camera.ip_address, camera.rtsp_port, sub_path, camera.username, camera.password)
    else:
        sub_source = source
    await mediamtx.mediamtx.add_path(mediamtx.sub_path_name(camera.id), sub_source)

    camera.stream_state = "registered" if ok else "error"


def _assert_endpoint_free(db: Session, ip: str, onvif_port: int, rtsp_port: int) -> None:
    """Reject a standalone camera on an endpoint that is already registered.

    The endpoint is IP *plus both ports*: one public IP can front many devices
    through different port forwards, so the IP alone proves nothing.
    """
    clash = db.scalars(
        select(Camera).where(
            Camera.ip_address == ip,
            Camera.onvif_port == onvif_port,
            Camera.rtsp_port == rtsp_port,
        )
    ).first()
    if clash is not None:
        raise HTTPException(
            status_code=409,
            detail=(
                f"A device is already registered at {ip}:{onvif_port} "
                f"(RTSP {rtsp_port}): '{clash.name}' (id {clash.id})."
            ),
        )


@router.get("", response_model=list[CameraRead])
def list_cameras(db: Session = Depends(get_db)) -> list[Camera]:
    return list(db.scalars(select(Camera).order_by(*CAMERA_ORDER)).all())


@router.get("/statuses", response_model=list[CameraStatus])
async def camera_statuses(db: Session = Depends(get_db)) -> list[CameraStatus]:
    cameras = list(db.scalars(select(Camera).order_by(*CAMERA_ORDER)).all())
    return await status_service.statuses(cameras)


@router.get("/tree")
def camera_tree(db: Session = Depends(get_db)) -> list[dict]:
    """Return all enabled cameras as a flat list for the live monitoring sidebar."""
    cameras = list(
        db.scalars(
            select(Camera).where(Camera.enabled == True).order_by(*CAMERA_ORDER)
        ).all()
    )
    return [
        {
            "camera_id": cam.id,
            "name": cam.name,
            "online": cam.stream_state == "registered",
            "camera_type": "bullet",
        }
        for cam in cameras
    ]


@router.post("", response_model=CameraRead, status_code=201)
async def create_camera(payload: CameraCreate, db: Session = Depends(get_db)) -> Camera:
    _assert_endpoint_free(db, payload.ip_address, payload.onvif_port, payload.rtsp_port)
    camera = Camera(
        name=payload.name,
        ip_address=payload.ip_address,
        onvif_port=payload.onvif_port,
        rtsp_port=payload.rtsp_port,
        username=payload.username,
        password=payload.password,
        latitude=payload.latitude,
        longitude=payload.longitude,
    )
    db.add(camera)
    db.commit()
    db.refresh(camera)

    await _register_path(camera)
    db.commit()
    db.refresh(camera)
    return camera


@router.post("/rtsp", response_model=CameraRead, status_code=201)
async def create_camera_rtsp(payload: CameraCreateRtsp, db: Session = Depends(get_db)) -> Camera:
    """Register a camera directly from an RTSP URL (no ONVIF probe needed)."""
    from urllib.parse import urlparse

    parsed = urlparse(payload.rtsp_url)
    host = parsed.hostname or ""
    port = parsed.port or 554
    path = parsed.path + (f"?{parsed.query}" if parsed.query else "")
    username = parsed.username or ""
    password = parsed.password or ""

    if not host:
        raise HTTPException(status_code=422, detail="Invalid RTSP URL: no hostname found")

    _assert_endpoint_free(db, host, 80, port)

    # Parse sub URL if provided
    sub_path = None
    if payload.rtsp_sub_url:
        sub_parsed = urlparse(payload.rtsp_sub_url)
        sub_path = sub_parsed.path + (f"?{sub_parsed.query}" if sub_parsed.query else "")

    camera = Camera(
        name=payload.name,
        ip_address=host,
        onvif_port=80,
        rtsp_port=port,
        username=username,
        password=password,
        latitude=payload.latitude,
        longitude=payload.longitude,
        rtsp_path=path,
        rtsp_sub_path=sub_path,
        rtsp_source="rtsp_url",
    )
    db.add(camera)
    db.commit()
    db.refresh(camera)

    await _register_path(camera)
    db.commit()
    db.refresh(camera)
    return camera


@router.get("/{camera_id}", response_model=CameraRead)
def get_camera(camera_id: int, db: Session = Depends(get_db)) -> Camera:
    camera = db.get(Camera, camera_id)
    if camera is None:
        raise HTTPException(status_code=404, detail="Camera not found")
    return camera


@router.get("/{camera_id}/status", response_model=CameraStatus)
async def get_camera_status(camera_id: int, db: Session = Depends(get_db)) -> CameraStatus:
    camera = db.get(Camera, camera_id)
    if camera is None:
        raise HTTPException(status_code=404, detail="Camera not found")
    return await status_service.status(camera)


@router.put("/{camera_id}", response_model=CameraRead)
async def update_camera(camera_id: int, payload: CameraUpdate, db: Session = Depends(get_db)) -> Camera:
    camera = db.get(Camera, camera_id)
    if camera is None:
        raise HTTPException(status_code=404, detail="Camera not found")

    changes = payload.model_dump(exclude_unset=True)
    password_provided = bool(changes.get("password"))
    if "password" in changes and not password_provided:
        # Empty password from the form means "keep the stored one".
        changes.pop("password")

    was_enabled = camera.enabled
    connection_changed = bool(CONNECTION_FIELDS.intersection(changes))

    for field, value in changes.items():
        setattr(camera, field, value)

    if was_enabled and not camera.enabled:
        await mediamtx.mediamtx.remove_path(mediamtx.path_name(camera.id))
        if camera.rtsp_sub_path:
            await mediamtx.mediamtx.remove_path(mediamtx.sub_path_name(camera.id))
        camera.stream_state = "idle"
    elif camera.enabled and (not was_enabled or connection_changed):
        await _register_path(camera)

    db.commit()
    db.refresh(camera)
    return camera


@router.delete("/{camera_id}", status_code=204)
async def delete_camera(camera_id: int, db: Session = Depends(get_db)) -> None:
    camera = db.get(Camera, camera_id)
    if camera is None:
        raise HTTPException(status_code=404, detail="Camera not found")
    await mediamtx.mediamtx.remove_path(mediamtx.path_name(camera.id))
    if camera.rtsp_sub_path:
        await mediamtx.mediamtx.remove_path(mediamtx.sub_path_name(camera.id))
    status_service._cache.pop(camera.id, None)
    db.delete(camera)
    db.commit()
