"""First-run seeding: create the bootstrap administrator when needed."""

import logging

from sqlalchemy import func, select

from app.core.config import settings
from app.core.database import SessionLocal
from app.core.rbac import ROLE_ADMIN, ALL_RIGHT_IDS
from app.core.security import hash_password
from app.models.user import User

logger = logging.getLogger(__name__)


def ensure_bootstrap_admin() -> None:
    """Create the initial ADMIN account if the users table is empty.

    Idempotent: it does nothing once any user exists. Failures are logged, not
    raised, so a missing migration never blocks the API from starting.
    """
    try:
        with SessionLocal() as db:
            count = db.scalar(select(func.count()).select_from(User)) or 0
            if count:
                return
            user = User(
                username=settings.bootstrap_admin_username,
                password_hash=hash_password(settings.bootstrap_admin_password),
                role=ROLE_ADMIN,
                active=True,
                base_rights=list(ALL_RIGHT_IDS),
                channel_rights={},
            )
            db.add(user)
            db.commit()
            logger.info(
                "Seeded bootstrap administrator '%s' (change the password after first login)",
                settings.bootstrap_admin_username,
            )
    except Exception:
        logger.exception("Bootstrap admin not seeded - run 'alembic upgrade head' first")
