from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from app.api.routes import cameras, dashboard, health, nvr, system
from app.core.config import settings
from app.core.database import SessionLocal
from app.core.logging import setup_logging
from app.models.camera import Camera
from app.services import mediamtx
from app.services.onvif import build_rtsp_url

setup_logging()

logger = logging.getLogger(__name__)


async def _reregister_all_cameras() -> None:
    """Re-register every enabled camera with MediaMTX on startup.

    MediaMTX forgets all dynamically-added paths when it restarts, so this
    ensures the WebRTC player pages (cam_{id}) exist before the browser
    tries to connect.
    """
    with SessionLocal() as db:
        cams = list(
            db.scalars(select(Camera).where(Camera.enabled == True)).all()
        )
    if not cams:
        return
    logger.info("Re-registering %d camera(s) with MediaMTX …", len(cams))
    ok_count = 0
    for cam in cams:
        source = build_rtsp_url(
            cam.ip_address, cam.rtsp_port, cam.rtsp_path,
            cam.username, cam.password,
        )
        path_name = mediamtx.path_name(cam.id)
        ok = await mediamtx.mediamtx.add_path(path_name, source)
        if ok:
            ok_count += 1
        with SessionLocal() as db:
            db_cam = db.get(Camera, cam.id)
            if db_cam:
                db_cam.stream_state = "registered" if ok else "error"
                db.commit()
    logger.info("MediaMTX re-registration done: %d/%d succeeded", ok_count, len(cams))


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting %s v%s (%s)", settings.app_name, settings.app_version, settings.app_env)
    await _reregister_all_cameras()
    yield
    await mediamtx.mediamtx.close()
    logger.info("Shutting down %s", settings.app_name)


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Live streaming platform API",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api/v1")
app.include_router(cameras.router, prefix="/api/v1")
app.include_router(nvr.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(system.router, prefix="/api/v1")


@app.get("/")
def root() -> dict:
    return {"app": settings.app_name, "version": settings.app_version, "docs": "/docs"}
