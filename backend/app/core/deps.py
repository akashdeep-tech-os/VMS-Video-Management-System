"""FastAPI dependencies for authenticating and role-gating requests."""

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.rbac import ROLE_ADMIN
from app.core.security import decode_token
from app.models.user import User

_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None or not credentials.credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")

    claims = decode_token(credentials.credentials)
    if claims is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = db.get(User, claims.get("uid"))
    if user is None:
        raise HTTPException(status_code=401, detail="Account no longer exists")
    if not user.active:
        raise HTTPException(status_code=403, detail="Account is disabled")
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != ROLE_ADMIN:
        raise HTTPException(status_code=403, detail="Administrator role required")
    return user


def ensure_self_or_admin(user: User, user_id: int) -> None:
    """Allow reading your own data; everything else needs the Admin role."""
    if user.id != user_id and user.role != ROLE_ADMIN:
        raise HTTPException(status_code=403, detail="Administrator role required")
