import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.camera import Camera
from app.schemas.camera import CameraCreate, CameraRead, CameraStatus, CameraUpdate
from app.services import mediamtx
from app.services.onvif import FAIL_MESSAGES, build_rtsp_url, probe_camera
from app.services.status import status_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/camera", tags=["cameras"])

CONNECTION_FIELDS = {"ip_address", "onvif_port", "rtsp_port", "username", "password"}


async def _register_path(camera: Camera) -> None:
    """Register the camera's RTSP source with MediaMTX (best effort)."""
    source = build_rtsp_url(camera.ip_address, camera.rtsp_port, camera.rtsp_path, camera.username, camera.password)
    ok = await mediamtx.mediamtx.add_path(mediamtx.path_name(camera.id), source)
    camera.stream_state = "registered" if ok else "error"


def _validate_failed(detail: str) -> HTTPException:
    return HTTPException(status_code=422, detail=detail)


def _apply_probe(camera: Camera, probe) -> None:
    camera.manufacturer = probe.manufacturer
    camera.model = probe.model
    camera.firmware = probe.firmware
    camera.serial = probe.serial
    camera.rtsp_path = probe.rtsp_path
    camera.rtsp_source = probe.rtsp_source


@router.get("", response_model=list[CameraRead])
def list_cameras(db: Session = Depends(get_db)) -> list[Camera]:
    return list(db.scalars(select(Camera).order_by(Camera.name)).all())


@router.get("/statuses", response_model=list[CameraStatus])
async def camera_statuses(db: Session = Depends(get_db)) -> list[CameraStatus]:
    cameras = list(db.scalars(select(Camera).order_by(Camera.name)).all())
    return await status_service.statuses(cameras)


@router.post("", response_model=CameraRead, status_code=201)
async def create_camera(payload: CameraCreate, db: Session = Depends(get_db)) -> Camera:
    probe = await probe_camera(payload.ip_address, payload.onvif_port, payload.rtsp_port, payload.username, payload.password)
    if not probe.ok:
        logger.info("Camera add rejected (%s): %s", probe.fail_reason, payload.ip_address)
        raise _validate_failed(FAIL_MESSAGES.get(probe.fail_reason or "error", "Camera validation failed"))

    camera = Camera(
        name=payload.name,
        ip_address=payload.ip_address,
        onvif_port=payload.onvif_port,
        rtsp_port=payload.rtsp_port,
        username=payload.username,
        password=payload.password,
    )
    _apply_probe(camera, probe)
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

    if connection_changed:
        username = changes.get("username", camera.username)
        password = changes.get("password", camera.password)
        probe = await probe_camera(
            changes.get("ip_address", camera.ip_address),
            changes.get("onvif_port", camera.onvif_port),
            changes.get("rtsp_port", camera.rtsp_port),
            username,
            password,
        )
        if not probe.ok:
            logger.info("Camera update rejected (%s): %s", probe.fail_reason, camera.ip_address)
            raise _validate_failed(FAIL_MESSAGES.get(probe.fail_reason or "error", "Camera validation failed"))
        _apply_probe(camera, probe)

    for field, value in changes.items():
        setattr(camera, field, value)

    if was_enabled and not camera.enabled:
        await mediamtx.mediamtx.remove_path(mediamtx.path_name(camera.id))
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
    status_service._cache.pop(camera.id, None)
    db.delete(camera)
    db.commit()
