import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.camera import Camera
from app.models.nvr import NVR
from app.schemas.nvr import NVRCreate, NVRDiscoverRequest, NVRRead, NVRUpdate
from app.services import mediamtx
from app.services.onvif import build_rtsp_url
from app.services.playback_urls import normalize_brand

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/nvrs", tags=["nvrs"])

# Brand-to-RTSP-path mapping for channel registration without probing.
# Indian-market brands that OEM the big Chinese platforms are mapped to their
# parent convention (Consistent/Hi-Focus -> Dahua, Prama/Hawkvision ->
# Hikvision, e-Vision -> /rtsp/streaming). Brands without a known convention
# fall back to the "default" template; their playback family is still resolved
# per camera from the ONVIF manufacturer / live-path pattern.
BRAND_RTSP_PATHS = {
    "cpplus": "/cam/realmonitor?channel={ch}&subtype=0",
    "dahua": "/cam/realmonitor?channel={ch}&subtype=0",
    "consistent": "/cam/realmonitor?channel={ch}&subtype=0",
    "hifocus": "/cam/realmonitor?channel={ch}&subtype=0",
    "hikvision": "/Streaming/Channels/{ch}01",
    "prama": "/Streaming/Channels/{ch}01",
    "hawkvision": "/Streaming/Channels/{ch}01",
    "evision": "/rtsp/streaming?channel={ch}&subtype=0",
    "axis": "/axis-media/media.axs",
    "default": "/stream1",
}

# Sub-stream RTSP paths (low resolution) for each brand
BRAND_RTSP_SUB_PATHS = {
    "cpplus": "/cam/realmonitor?channel={ch}&subtype=1",
    "dahua": "/cam/realmonitor?channel={ch}&subtype=1",
    "consistent": "/cam/realmonitor?channel={ch}&subtype=1",
    "hifocus": "/cam/realmonitor?channel={ch}&subtype=1",
    "hikvision": "/Streaming/Channels/{ch}02",
    "prama": "/Streaming/Channels/{ch}02",
    "hawkvision": "/Streaming/Channels/{ch}02",
    "evision": "/rtsp/streaming?channel={ch}&subtype=1",
}

# Max length of Camera.name / NVR.name in the schema.
NAME_MAX = 120


def _get_rtsp_path(brand: str | None, channel: int) -> str:
    """Get the RTSP path for a given brand and channel number."""
    brand_key = normalize_brand(brand)
    path_template = BRAND_RTSP_PATHS.get(brand_key, BRAND_RTSP_PATHS["default"])
    return path_template.format(ch=channel)


def _get_rtsp_sub_path(brand: str | None, channel: int) -> str | None:
    """Get the sub-stream RTSP path for a given brand and channel number.

    Returns None for brands without a known sub-stream convention;
    the caller can derive it from the main path via derive_sub_path().
    """
    brand_key = normalize_brand(brand)
    path_template = BRAND_RTSP_SUB_PATHS.get(brand_key)
    if path_template:
        return path_template.format(ch=channel)
    return None


def channel_name(device_name: str, channel: int) -> str:
    """Build an NVR channel label: ``<Device Name>-Ch-<Number>``.

    The device name is the operator-supplied name of the recorder, NOT its
    brand. Two recorders behind one public IP on different forwarded ports are
    different devices and must produce different labels.
    """
    suffix = f"-Ch-{channel}"
    return f"{device_name[: NAME_MAX - len(suffix)]}{suffix}"


def _legacy_channel_names(nvr: NVR, channel: int) -> set[str]:
    """Labels a channel row could carry from before it had a nvr_id/channel.

    Used once, to adopt pre-existing rows instead of inserting duplicates
    alongside them.
    """
    labels = {nvr.name, nvr.brand_name, "NVR"}
    return {f"{label} - CH{channel}" for label in labels if label} | {
        channel_name(label, channel) for label in labels if label
    }


def _find_channel_row(db: Session, nvr: NVR, channel: int) -> Camera | None:
    """Locate the row for this NVR's channel, adopting legacy rows if needed.

    Identity is (nvr_id, channel) - deliberately NOT the name, because keying
    on a label means every rename inserts a fresh copy of every channel.
    """
    cam = db.scalars(
        select(Camera).where(Camera.nvr_id == nvr.id, Camera.channel == channel)
    ).first()
    if cam is not None:
        return cam

    return db.scalars(
        select(Camera)
        .where(
            Camera.nvr_id.is_(None),
            Camera.ip_address == nvr.ip_address,
            Camera.onvif_port == nvr.port,
            Camera.rtsp_port == nvr.rtsp_port,
            Camera.name.in_(_legacy_channel_names(nvr, channel)),
        )
        .order_by(Camera.id)
    ).first()


def _assert_name_available(db: Session, name: str, nvr_id: int | None) -> None:
    """Reject a device name already used by a *different* recorder.

    Without this, two NVRs sharing a name regenerate identical channel labels
    and the device table fills with indistinguishable rows.
    """
    stmt = select(NVR).where(NVR.name == name)
    if nvr_id is not None:
        stmt = stmt.where(NVR.id != nvr_id)
    clash = db.scalars(stmt).first()
    if clash is not None:
        raise HTTPException(
            status_code=409,
            detail=(
                f"Device name '{name}' is already used by the NVR at "
                f"{clash.ip_address}:{clash.port} (RTSP {clash.rtsp_port}). "
                "Give each recorder a unique device name."
            ),
        )


async def _sync_channels(
    db: Session,
    nvr: NVR,
    *,
    brand: str | None,
    start_channel: int,
    num_channels: int,
    is_nvr: bool = True,
) -> list[dict]:
    """Create-or-update this NVR's channel rows and publish them to MediaMTX.

    Idempotent: running it again after a rename or a port change updates the
    existing rows in place rather than inserting a second set.
    """
    brand_hint = brand or nvr.brand_name
    cameras: list[dict] = []

    for ch in range(start_channel, start_channel + num_channels):
        rtsp_path = _get_rtsp_path(brand_hint, ch)
        rtsp_sub_path = _get_rtsp_sub_path(brand_hint, ch)
        rtsp_url = build_rtsp_url(
            nvr.ip_address, nvr.rtsp_port, rtsp_path, nvr.username, nvr.password
        )
        # A lone camera is not a channel of anything, so it keeps its own name.
        cam_name = channel_name(nvr.name, ch) if is_nvr else nvr.name[:NAME_MAX]

        cam = _find_channel_row(db, nvr, ch)
        if cam is None:
            cam = Camera(nvr_id=nvr.id, channel=ch)
            db.add(cam)

        cam.nvr_id = nvr.id
        cam.channel = ch
        cam.name = cam_name
        cam.ip_address = nvr.ip_address
        cam.onvif_port = nvr.port
        cam.rtsp_port = nvr.rtsp_port
        cam.username = nvr.username
        cam.password = nvr.password
        cam.rtsp_path = rtsp_path
        cam.rtsp_sub_path = rtsp_sub_path
        cam.rtsp_source = "brand_convention"
        db.flush()

        ok = await mediamtx.mediamtx.add_path(mediamtx.path_name(cam.id), rtsp_url)
        # Register sub stream path with MediaMTX
        if rtsp_sub_path:
            sub_url = build_rtsp_url(
                nvr.ip_address, nvr.rtsp_port, rtsp_sub_path, nvr.username, nvr.password
            )
            await mediamtx.mediamtx.add_path(mediamtx.sub_path_name(cam.id), sub_url)
        cam.stream_state = "registered" if ok else "error"
        db.flush()

        cameras.append({"id": cam.id, "name": cam.name, "channel": ch})

    return cameras


def _owned_cameras_stmt(nvr: NVR):
    """Cameras belonging to this NVR, including not-yet-adopted legacy rows."""
    return select(Camera).where(
        (Camera.nvr_id == nvr.id)
        | (
            Camera.nvr_id.is_(None)
            & (Camera.ip_address == nvr.ip_address)
            & (Camera.onvif_port == nvr.port)
            & (Camera.rtsp_port == nvr.rtsp_port)
        )
    )


class DiscoverResponse(BaseModel):
    nvr_id: int
    nvr_name: str
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
    _assert_name_available(db, payload.name, None)
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
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail=(
                f"An NVR is already registered at {payload.ip_address}:{payload.port} "
                f"(RTSP {payload.rtsp_port})."
            ),
        )
    db.refresh(nvr)
    return nvr


# ---- ID-less Discovery (MUST come before /{nvr_id} routes) ----


@router.post("/discover-cameras", response_model=DiscoverResponse)
async def discover_cameras_id_less(
    nvr_body: NVRDiscoverRequest,
    method: str = Query("AUTO"),
    max_channels: int = Query(16, ge=1, le=128),
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

    # A recorder is identified by its full endpoint. Several NVRs can sit
    # behind one public IP, distinguished only by their forwarded ports, so the
    # IP alone must never be treated as the identity.
    nvr = db.scalars(
        select(NVR).where(
            NVR.ip_address == ip,
            NVR.port == onvif_port,
            NVR.rtsp_port == rtsp_port,
        )
    ).first()

    # Prefer the operator's Device Name; fall back to the stored one, and only
    # then to the brand. The brand is shared by every unit of that make, so it
    # cannot serve as a name.
    device_name = (
        nvr_body.name
        or (nvr.name if nvr is not None else None)
        or nvr_body.brand_name
        or "NVR"
    )[:NAME_MAX]
    _assert_name_available(db, device_name, nvr.id if nvr is not None else None)

    if preview:
        # Dry run: validate and report, but register nothing. nvr_id is 0 when
        # this endpoint is new and no row exists yet.
        return DiscoverResponse(
            nvr_id=nvr.id if nvr is not None else 0,
            nvr_name=device_name,
            method=method,
            channels_probed=0,
            cameras_registered=0,
            cameras=[],
        )

    if nvr is None:
        nvr = NVR(
            name=device_name,
            ip_address=ip,
            port=onvif_port,
            rtsp_port=rtsp_port,
            username=username,
            password=password,
            no_of_channels=nvr_body.no_of_channels,
            brand_name=nvr_body.brand_name,
            manufacturer=nvr_body.brand_name,
        )
        db.add(nvr)
        db.flush()
    else:
        nvr.name = device_name
        nvr.username = username or nvr.username
        nvr.password = password or nvr.password
        nvr.rtsp_port = rtsp_port
        if nvr_body.no_of_channels:
            nvr.no_of_channels = nvr_body.no_of_channels
        if nvr_body.brand_name:
            nvr.brand_name = nvr_body.brand_name

    num_channels = (
        (nvr.no_of_channels or max_channels) if nvr_body.is_nvr else 1
    )
    cameras_found = await _sync_channels(
        db,
        nvr,
        brand=brand,
        start_channel=1,
        num_channels=num_channels,
        is_nvr=nvr_body.is_nvr,
    )
    db.commit()

    return DiscoverResponse(
        nvr_id=nvr.id,
        nvr_name=nvr.name,
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

    new_name = changes.get("name")
    if new_name:
        new_name = new_name.strip()[:NAME_MAX]
        changes["name"] = new_name
        _assert_name_available(db, new_name, nvr.id)

    for field, value in changes.items():
        setattr(nvr, field, value)

    # Channel labels are derived from the device name, so a rename has to
    # propagate. Otherwise the old name lingers on every channel row.
    if new_name:
        for cam in db.scalars(_owned_cameras_stmt(nvr)).all():
            if cam.channel is not None:
                cam.name = channel_name(new_name, cam.channel)

    db.commit()
    db.refresh(nvr)
    return nvr


@router.delete("/{nvr_id}", status_code=204)
async def delete_nvr(nvr_id: int, db: Session = Depends(get_db)) -> None:
    nvr = db.get(NVR, nvr_id)
    if nvr is None:
        raise HTTPException(status_code=404, detail="NVR not found")
    # Also delete the cameras registered under this NVR.
    for cam in db.scalars(_owned_cameras_stmt(nvr)).all():
        await mediamtx.mediamtx.remove_path(mediamtx.path_name(cam.id))
        db.delete(cam)
    db.delete(nvr)
    db.commit()


@router.get("/{nvr_id}/channels", response_model=list[dict])
def list_nvr_channels(nvr_id: int, db: Session = Depends(get_db)) -> list[dict]:
    """List cameras (channels) registered under this NVR."""
    nvr = db.get(NVR, nvr_id)
    if nvr is None:
        raise HTTPException(status_code=404, detail="NVR not found")
    # Order by channel number, not by name: alphabetical sorting puts CH10
    # between CH1 and CH2.
    cameras = db.scalars(
        _owned_cameras_stmt(nvr).order_by(Camera.channel, Camera.id)
    ).all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "channel": c.channel,
            "ip_address": c.ip_address,
            "onvif_port": c.onvif_port,
            "rtsp_port": c.rtsp_port,
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
    max_channels: int = Query(16, ge=1, le=128),
    start_channel: int = Query(1, ge=1),
    brand: str = Query(None),
    db: Session = Depends(get_db),
) -> DiscoverResponse:
    """Register camera channels on an already-registered NVR.

    Channels are registered directly based on no_of_channels without probing.
    """
    nvr = db.get(NVR, nvr_id)
    if nvr is None:
        raise HTTPException(status_code=404, detail="NVR not found")

    num_channels = nvr.no_of_channels or max_channels
    cameras_found = await _sync_channels(
        db,
        nvr,
        brand=brand,
        start_channel=start_channel,
        num_channels=num_channels,
    )
    db.commit()

    return DiscoverResponse(
        nvr_id=nvr.id,
        nvr_name=nvr.name,
        method=method,
        channels_probed=num_channels,
        cameras_registered=len(cameras_found),
        cameras=cameras_found,
    )
