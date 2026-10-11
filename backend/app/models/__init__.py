from app.core.database import Base
from app.models.camera import Camera
from app.models.nvr import NVR
from app.models.user import User

# Camera.nvr_id carries a ForeignKey("nvrs.id"), which SQLAlchemy resolves
# against Base.metadata when the mapper is configured. Importing both models
# here guarantees the nvrs table is registered no matter which module is
# imported first (app.main, the routers, or alembic/env.py).
__all__ = ["Base", "Camera", "NVR", "User"]
