import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.camera import Camera
from app.models.nvr import NVR
from app.schemas.nvr import NVRCreate, NVRDiscoverRequest, NVRRead, NVRUpdate
from app.services import mediamtx
from app.services.onvif import build_rtsp_url, probe_camera

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/nvrs", tags=["nvrs"])


class DiscoverResponse(BaseModel):
    nvr_id: int
    method: str
    channels_probed: int
    cameras_registered: int
    cameras: list[dict] = []


# ---- Basic CRUD ----


@router.get("", response_model=list[NVRRead])
def list_nvrs(db: Session = Depends(get_db)) -> list[NVR]:
    return list(db.scalars(select(NVR).order_by(NVR.name)).all())


@router.post("", response_model=NVRRead, status_code=201)
def create_nvr(payload: NVRCreate, db: Session = Depends(get_db)) -> NVR:
    nvr = NVR(
        name=payload.name,
        ip_address=payload.ip_address,
        port=payload.port,
        username=payload.username,
        password=payload.password,
        no_of_channels=payload.no_of_channels,
        brand_name=payload.brand_name,
        manufacturer=payload.manufacturer or payload.brand_name,
    )
    db.add(nvr)
    db.commit()
    db.refresh(nvr)
    return nvr


# ---- ID-less Discovery (MUST come before /{nvr_id} routes) ----


@router.post("/discover-cameras", response_model=DiscoverResponse)
async def discover_cameras_id_less(
    nvr_body: NVRDiscoverRequest,
    method: str = Query("AUTO"),
    max_channels: int = Query(16),
    zone: str = Query(None),
    station_id: int = Query(None),
    site_id: int = Query(None),
    preview: bool = Query(False),
    rewrite_rtsp_port: bool = Query(False),
    brand: str = Query(None),
    db: Session = Depends(get_db),
) -> DiscoverResponse:
    """ID-less discovery: register-or-find the NVR, then discover channels.

    If preview=True, probe only and return results without persisting.
    """
    ip = nvr_body.ip_address
    onvif_port = nvr_body.onvif_port or 80
    rtsp_port = nvr_body.rtsp_port or 554
    username = nvr_body.username or ""
    password = nvr_body.plain_password or ""

    # Find or create the NVR
    nvr = db.scalars(select(NVR).where(NVR.ip_address == ip)).first()

    if nvr is None:
        nvr = NVR(
            name=nvr_body.brand_name or "NVR",
            ip_address=ip,
            port=onvif_port,
            username=username,
            password=password,
            no_of_channels=nvr_body.no_of_channels,
            brand_name=nvr_body.brand_name,
        )
        db.add(nvr)
        db.flush()
    else:
        nvr.username = username or nvr.username
        nvr.password = password or nvr.password
        if nvr_body.no_of_channels:
            nvr.no_of_channels = nvr_body.no_of_channels
        if nvr_body.brand_name:
            nvr.brand_name = nvr_body.brand_name

    if preview:
        # Just probe one channel to verify connectivity
        probe = await probe_camera(ip, onvif_port, rtsp_port, username, password)
        db.flush()
        return DiscoverResponse(
            nvr_id=nvr.id,
            method=method,
            channels_probed=1 if probe.ok else 0,
            cameras_registered=0,
            cameras=[],
        )

    # Real discovery: probe up to max_channels
    cameras_found = []
    for ch in range(1, max_channels + 1):
        probe = await probe_camera(ip, onvif_port, rtsp_port, username, password)
        if not probe.ok:
            logger.info("NVR ch%d probe failed: %s", ch, probe.fail_reason)
            break

        rtsp_url = build_rtsp_url(ip, rtsp_port, probe.rtsp_path, username, password)

        cam_name = f"{nvr.name} - CH{ch}"
        existing = db.scalars(
            select(Camera).where(
                Camera.ip_address == ip,
                Camera.name == cam_name,
            )
        ).first()

        if existing:
            existing.rtsp_path = probe.rtsp_path
            existing.rtsp_source = probe.rtsp_source
            existing.manufacturer = probe.manufacturer
            existing.model = probe.model
            existing.firmware = probe.firmware
            existing.serial = probe.serial
            cam = existing
        else:
            cam = Camera(
                name=cam_name,
                ip_address=ip,
                onvif_port=onvif_port,
                rtsp_port=rtsp_port,
                username=username,
                password=password,
                rtsp_path=probe.rtsp_path,
                rtsp_source=probe.rtsp_source,
                manufacturer=probe.manufacturer,
                model=probe.model,
                firmware=probe.firmware,
                serial=probe.serial,
                station_id=station_id,
                site_id=site_id,
                station_name=zone,
            )
            db.add(cam)

        db.flush()
        await mediamtx.mediamtx.add_path(mediamtx.path_name(cam.id), rtsp_url)
        cam.stream_state = "registered"
        db.flush()

        cameras_found.append({
            "id": cam.id,
            "name": cam.name,
            "channel": ch,
        })

    db.commit()

    return DiscoverResponse(
        nvr_id=nvr.id,
        method=method,
        channels_probed=min(max_channels, len(cameras_found) or max_channels),
        cameras_registered=len(cameras_found),
        cameras=cameras_found,
    )


# ---- NVR-specific routes (/{nvr_id}) ----


@router.get("/{nvr_id}", response_model=NVRRead)
def get_nvr(nvr_id: int, db: Session = Depends(get_db)) -> NVR:
    nvr = db.get(NVR, nvr_id)
    if nvr is None:
        raise HTTPException(status_code=404, detail="NVR not found")
    return nvr


@router.patch("/{nvr_id}", response_model=NVRRead)
def update_nvr(nvr_id: int, payload: NVRUpdate, db: Session = Depends(get_db)) -> NVR:
    nvr = db.get(NVR, nvr_id)
    if nvr is None:
        raise HTTPException(status_code=404, detail="NVR not found")

    changes = payload.model_dump(exclude_unset=True)
    password_provided = bool(changes.get("password"))
    if "password" in changes and not password_provided:
        changes.pop("password")

    for field, value in changes.items():
        setattr(nvr, field, value)

    db.commit()
    db.refresh(nvr)
    return nvr


@router.delete("/{nvr_id}", status_code=204)
def delete_nvr(nvr_id: int, db: Session = Depends(get_db)) -> None:
    nvr = db.get(NVR, nvr_id)
    if nvr is None:
        raise HTTPException(status_code=404, detail="NVR not found")
    # Also delete cameras registered under this NVR's IP
    cameras = db.scalars(
        select(Camera).where(Camera.ip_address == nvr.ip_address)
    ).all()
    for cam in cameras:
        db.delete(cam)
    db.delete(nvr)
    db.commit()


@router.get("/{nvr_id}/channels", response_model=list[dict])
def list_nvr_channels(nvr_id: int, db: Session = Depends(get_db)) -> list[dict]:
    """List cameras (channels) registered under this NVR's IP address."""
    nvr = db.get(NVR, nvr_id)
    if nvr is None:
        raise HTTPException(status_code=404, detail="NVR not found")
    cameras = db.scalars(
        select(Camera).where(Camera.ip_address == nvr.ip_address).order_by(Camera.name)
    ).all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "ip_address": c.ip_address,
            "rtsp_path": c.rtsp_path,
            "stream_state": c.stream_state,
            "manufacturer": c.manufacturer,
            "model": c.model,
        }
        for c in cameras
    ]


@router.patch("/{nvr_id}/credentials")
def update_nvr_credentials(
    nvr_id: int,
    username: str = Query(None),
    plainPassword: str = Query(None),
    db: Session = Depends(get_db),
) -> dict:
    nvr = db.get(NVR, nvr_id)
    if nvr is None:
        raise HTTPException(status_code=404, detail="NVR not found")
    if username is not None:
        nvr.username = username
    if plainPassword is not None:
        nvr.password = plainPassword
    db.commit()
    db.refresh(nvr)
    return {"ok": True}


@router.post("/{nvr_id}/discover-cameras", response_model=DiscoverResponse)
async def discover_nvr_cameras(
    nvr_id: int,
    method: str = Query("AUTO"),
    max_channels: int = Query(16),
    start_channel: int = Query(1),
    zone: str = Query(None),
    brand: str = Query(None),
    db: Session = Depends(get_db),
) -> DiscoverResponse:
    """Discover camera channels on an already-registered NVR."""
    nvr = db.get(NVR, nvr_id)
    if nvr is None:
        raise HTTPException(status_code=404, detail="NVR not found")

    onvif_port = nvr.port or 80
    rtsp_port = 554
    cameras_found = []

    for ch in range(start_channel, start_channel + max_channels):
        probe = await probe_camera(
            nvr.ip_address, onvif_port, rtsp_port, nvr.username, nvr.password
        )
        if not probe.ok:
            logger.info("NVR ch%d probe failed: %s", ch, probe.fail_reason)
            break

        rtsp_url = build_rtsp_url(
            nvr.ip_address, rtsp_port, probe.rtsp_path, nvr.username, nvr.password
        )

        cam_name = f"{nvr.name} - CH{ch}"
        existing = db.scalars(
            select(Camera).where(
                Camera.ip_address == nvr.ip_address,
                Camera.name == cam_name,
            )
        ).first()

        if existing:
            existing.rtsp_path = probe.rtsp_path
            existing.rtsp_source = probe.rtsp_source
            existing.manufacturer = probe.manufacturer
            existing.model = probe.model
            existing.firmware = probe.firmware
            existing.serial = probe.serial
            cam = existing
        else:
            cam = Camera(
                name=cam_name,
                ip_address=nvr.ip_address,
                onvif_port=onvif_port,
                rtsp_port=rtsp_port,
                username=nvr.username,
                password=nvr.password,
                rtsp_path=probe.rtsp_path,
                rtsp_source=probe.rtsp_source,
                manufacturer=probe.manufacturer,
                model=probe.model,
                firmware=probe.firmware,
                serial=probe.serial,
            )
            db.add(cam)

        db.flush()
        await mediamtx.mediamtx.add_path(
            mediamtx.path_name(cam.id), rtsp_url
        )
        cam.stream_state = "registered"
        db.flush()

        cameras_found.append({
            "id": cam.id,
            "name": cam.name,
            "channel": ch,
        })

    db.commit()

    return DiscoverResponse(
        nvr_id=nvr.id,
        method=method,
        channels_probed=min(max_channels, len(cameras_found) or max_channels),
        cameras_registered=len(cameras_found),
        cameras=cameras_found,
    )
