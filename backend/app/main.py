from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import cameras, dashboard, health, system
from app.core.config import settings
from app.core.logging import setup_logging
from app.services import mediamtx

setup_logging()

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting %s v%s (%s)", settings.app_name, settings.app_version, settings.app_env)
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
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(system.router, prefix="/api/v1")


@app.get("/")
def root() -> dict:
    return {"app": settings.app_name, "version": settings.app_version, "docs": "/docs"}
