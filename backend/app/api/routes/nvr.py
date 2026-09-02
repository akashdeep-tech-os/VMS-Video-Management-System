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
from app.services.onvif import build_rtsp_url

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/nvrs", tags=["nvrs"])

# Brand-to-RTSP-path mapping for channel registration without probing
BRAND_RTSP_PATHS = {
    "cpplus": "/cam/realmonitor?channel={ch}&subtype=0",
    "dahua": "/cam/realmonitor?channel={ch}&subtype=0",
    "hikvision": "/Streaming/Channels/{ch}01",
    "axis": "/axis-media/media.axs",
    "default": "/stream1",
}


def _get_rtsp_path(brand: str | None, channel: int) -> str:
    """Get the RTSP path for a given brand and channel number."""
    brand_key = (brand or "").lower().replace(" ", "")
    path_template = BRAND_RTSP_PATHS.get(brand_key, BRAND_RTSP_PATHS["default"])
    return path_template.format(ch=channel)


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
        rtsp_port=payload.rtsp_port,
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
    """ID-less discovery: register-or-find the NVR, then register channels.

    Channels are registered directly based on no_of_channels without probing.
    """
    ip = nvr_body.ip_address
    onvif_port = nvr_body.onvif_port or 80
    rtsp_port = nvr_body.rtsp_port or 554
    username = nvr_body.username or ""
    password = nvr_body.plain_password or ""

    # Find or create the NVR (unique per IP + HTTP port + RTSP port)
    nvr = db.scalars(
        select(NVR).where(
            NVR.ip_address == ip,
            NVR.port == onvif_port,
            NVR.rtsp_port == rtsp_port,
        )
    ).first()

    if nvr is None:
        nvr = NVR(
            name=nvr_body.brand_name or "NVR",
            ip_address=ip,
            port=onvif_port,
            rtsp_port=rtsp_port,
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
        nvr.rtsp_port = rtsp_port
        if nvr_body.no_of_channels:
            nvr.no_of_channels = nvr_body.no_of_channels
        if nvr_body.brand_name:
            nvr.brand_name = nvr_body.brand_name

    if preview:
        # Preview mode: just return the NVR info without registering channels
        db.flush()
        return DiscoverResponse(
            nvr_id=nvr.id,
            method=method,
            channels_probed=0,
            cameras_registered=0,
            cameras=[],
        )

    # Register channels directly based on no_of_channels
    num_channels = nvr.no_of_channels or max_channels
    cameras_found = []

    for ch in range(1, num_channels + 1):
        rtsp_path = _get_rtsp_path(brand or nvr_body.brand_name, ch)
        rtsp_url = build_rtsp_url(ip, rtsp_port, rtsp_path, username, password)

        cam_name = f"{nvr.name} - CH{ch}"
        existing = db.scalars(
            select(Camera).where(
                Camera.ip_address == ip,
                Camera.onvif_port == onvif_port,
                Camera.rtsp_port == rtsp_port,
                Camera.name == cam_name,
            )
        ).first()

        if existing:
            existing.rtsp_path = rtsp_path
            existing.rtsp_source = "brand_convention"
            cam = existing
        else:
            cam = Camera(
                name=cam_name,
                ip_address=ip,
                onvif_port=onvif_port,
                rtsp_port=rtsp_port,
                username=username,
                password=password,
                rtsp_path=rtsp_path,
                rtsp_source="brand_convention",
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
        channels_probed=num_channels,
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
    # Also delete cameras registered under this NVR (matched by IP + ports)
    cameras = db.scalars(
        select(Camera).where(
            Camera.ip_address == nvr.ip_address,
            Camera.onvif_port == nvr.port,
            Camera.rtsp_port == nvr.rtsp_port,
        )
    ).all()
    for cam in cameras:
        db.delete(cam)
    db.delete(nvr)
    db.commit()


@router.get("/{nvr_id}/channels", response_model=list[dict])
def list_nvr_channels(nvr_id: int, db: Session = Depends(get_db)) -> list[dict]:
    """List cameras (channels) registered under this NVR (matched by IP + ports)."""
    nvr = db.get(NVR, nvr_id)
    if nvr is None:
        raise HTTPException(status_code=404, detail="NVR not found")
    cameras = db.scalars(
        select(Camera).where(
            Camera.ip_address == nvr.ip_address,
            Camera.onvif_port == nvr.port,
            Camera.rtsp_port == nvr.rtsp_port,
        ).order_by(Camera.name)
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
    station_id: int = Query(None),
    site_id: int = Query(None),
    db: Session = Depends(get_db),
) -> DiscoverResponse:
    """Register camera channels on an already-registered NVR.

    Channels are registered directly based on no_of_channels without probing.
    """
    nvr = db.get(NVR, nvr_id)
    if nvr is None:
        raise HTTPException(status_code=404, detail="NVR not found")

    onvif_port = nvr.port or 80
    rtsp_port = nvr.rtsp_port or 554
    num_channels = nvr.no_of_channels or max_channels
    cameras_found = []

    for ch in range(start_channel, start_channel + num_channels):
        rtsp_path = _get_rtsp_path(brand or nvr.brand_name, ch)
        rtsp_url = build_rtsp_url(
            nvr.ip_address, rtsp_port, rtsp_path, nvr.username, nvr.password
        )

        cam_name = f"{nvr.name} - CH{ch}"
        existing = db.scalars(
            select(Camera).where(
                Camera.ip_address == nvr.ip_address,
                Camera.onvif_port == nvr.port,
                Camera.rtsp_port == nvr.rtsp_port,
                Camera.name == cam_name,
            )
        ).first()

        if existing:
            existing.rtsp_path = rtsp_path
            existing.rtsp_source = "brand_convention"
            cam = existing
        else:
            cam = Camera(
                name=cam_name,
                ip_address=nvr.ip_address,
                onvif_port=onvif_port,
                rtsp_port=rtsp_port,
                username=nvr.username,
                password=nvr.password,
                rtsp_path=rtsp_path,
                rtsp_source="brand_convention",
                station_id=station_id,
                site_id=site_id,
                station_name=zone,
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
        channels_probed=num_channels,
        cameras_registered=len(cameras_found),
        cameras=cameras_found,
    )
