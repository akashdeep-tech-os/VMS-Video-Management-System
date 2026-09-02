import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.camera import Camera
from app.schemas.camera import CameraCreate, CameraCreateRtsp, CameraRead, CameraStatus, CameraUpdate
from app.services import mediamtx
from app.services.onvif import build_rtsp_url
from app.services.status import status_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/cameras", tags=["cameras"])

CONNECTION_FIELDS = {"ip_address", "onvif_port", "rtsp_port", "username", "password"}


# --- Tree response models for the live monitoring sidebar ---

class TreeCamera(BaseModel):
    camera_id: int
    name: str
    online: bool = True
    camera_type: str = "bullet"


class TreeSite(BaseModel):
    site_id: int | None = None
    site_name: str
    cameras: list[TreeCamera] = []


class TreeStation(BaseModel):
    station_id: int | None = None
    station_name: str
    sites: list[TreeSite] = []


class CameraTreeResponse(BaseModel):
    stations: list[TreeStation] = []


async def _register_path(camera: Camera) -> None:
    """Register the camera's RTSP source with MediaMTX (best effort)."""
    source = build_rtsp_url(camera.ip_address, camera.rtsp_port, camera.rtsp_path, camera.username, camera.password)
    ok = await mediamtx.mediamtx.add_path(mediamtx.path_name(camera.id), source)
    camera.stream_state = "registered" if ok else "error"


@router.get("", response_model=list[CameraRead])
def list_cameras(db: Session = Depends(get_db)) -> list[Camera]:
    return list(db.scalars(select(Camera).order_by(Camera.name)).all())


@router.get("/statuses", response_model=list[CameraStatus])
async def camera_statuses(db: Session = Depends(get_db)) -> list[CameraStatus]:
    cameras = list(db.scalars(select(Camera).order_by(Camera.name)).all())
    return await status_service.statuses(cameras)


@router.get("/tree", response_model=CameraTreeResponse)
def camera_tree(db: Session = Depends(get_db)) -> CameraTreeResponse:
    """Return all enabled cameras grouped by station -> site for the live monitoring sidebar.

    Cameras that have station_name/site_name set are grouped hierarchically.
    Cameras without station info are placed under a default "All Cameras" group.
    """
    cameras = list(
        db.scalars(
            select(Camera).where(Camera.enabled == True).order_by(Camera.name)
        ).all()
    )

    # Group cameras by station_name, then by site_name
    station_map: dict[str, dict] = {}
    ungrouped: list[TreeCamera] = []

    for cam in cameras:
        cam_obj = TreeCamera(
            camera_id=cam.id,
            name=cam.name,
            online=cam.stream_state == "registered",
            camera_type="bullet",
        )
        st_name = (cam.station_name or "").strip()
        si_name = (cam.site_name or "").strip()

        if not st_name:
            ungrouped.append(cam_obj)
            continue

        if st_name not in station_map:
            station_map[st_name] = {
                "station_id": cam.station_id,
                "station_name": st_name,
                "sites": {},
            }
        st_entry = station_map[st_name]

        if not si_name:
            # Camera has station but no site — put in a default site
            si_name = "Default Site"
        if si_name not in st_entry["sites"]:
            st_entry["sites"][si_name] = {
                "site_id": cam.site_id if si_name != "Default Site" else None,
                "site_name": si_name,
                "cameras": [],
            }
        st_entry["sites"][si_name]["cameras"].append(cam_obj)

    # Build final response
    stations = []
    for st_data in station_map.values():
        sites = [TreeSite(**s) for s in st_data["sites"].values()]
        stations.append(
            TreeStation(
                station_id=st_data["station_id"],
                station_name=st_data["station_name"],
                sites=sites,
            )
        )

    # Ungrouped cameras go under a fallback station
    if ungrouped:
        fallback_site = TreeSite(site_name="All Cameras", cameras=ungrouped)
        stations.append(
            TreeStation(station_name="All Cameras", sites=[fallback_site])
        )

    return CameraTreeResponse(stations=stations)


@router.post("", response_model=CameraRead, status_code=201)
async def create_camera(payload: CameraCreate, db: Session = Depends(get_db)) -> Camera:
    camera = Camera(
        name=payload.name,
        ip_address=payload.ip_address,
        onvif_port=payload.onvif_port,
        rtsp_port=payload.rtsp_port,
        username=payload.username,
        password=payload.password,
        latitude=payload.latitude,
        longitude=payload.longitude,
        station_id=payload.station_id,
        station_name=payload.station_name,
        site_id=payload.site_id,
        site_name=payload.site_name,
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
        raise _validate_failed("Invalid RTSP URL: no hostname found")

    camera = Camera(
        name=payload.name,
        ip_address=host,
        onvif_port=80,
        rtsp_port=port,
        username=username,
        password=password,
        latitude=payload.latitude,
        longitude=payload.longitude,
        station_id=payload.station_id,
        station_name=payload.station_name,
        site_id=payload.site_id,
        site_name=payload.site_name,
        rtsp_path=path,
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
