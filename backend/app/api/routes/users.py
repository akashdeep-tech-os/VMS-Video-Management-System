import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import ensure_self_or_admin, get_current_user, require_admin
from app.core.rbac import (
    BASE_RIGHTS,
    RIGHT_DESCRIPTIONS,
    RIGHT_IDS_BY_UI_ID,
    RIGHTS_BY_ID,
    ROLE_ADMIN,
    normalize_base_rights,
    normalize_channel_rights,
)
from app.core.security import hash_password
from app.models.camera import Camera
from app.models.user import User
from app.schemas.user import (
    AccessibleCamera,
    PasswordUpdate,
    RightCatalogItem,
    RightGroup,
    RightItem,
    UserCreate,
    UserRead,
    UserUpdate,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/users", tags=["users"])
rights_router = APIRouter(prefix="/rights", tags=["rights"])


def _apply_rights(
    user: User,
    *,
    base_rights: list[str] | None = None,
    channel_rights: dict | None = None,
    recompute_base: bool = False,
) -> None:
    """Normalize and store rights, keeping channel grants consistent.

    ``recompute_base`` is set when the role changed: an ADMIN must end up with
    every right, a USER with the default operator set (unless the payload sent
    an explicit selection).
    """
    if recompute_base or base_rights is not None or user.base_rights is None:
        user.base_rights = normalize_base_rights(user.role, base_rights)
    if channel_rights is not None:
        user.channel_rights = normalize_channel_rights(user.base_rights, channel_rights)
    else:
        user.channel_rights = normalize_channel_rights(user.base_rights, user.channel_rights)
    # Drop grants for rights the user no longer holds.
    user.channel_rights = {
        ui_id: cameras
        for ui_id, cameras in (user.channel_rights or {}).items()
        if ui_id in user.base_rights
    }


def _get_user_or_404(db: Session, user_id: int) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# --------------------------------------------------------------------------- #
# Catalog
# --------------------------------------------------------------------------- #
@rights_router.get("", response_model=list[RightCatalogItem])
def list_rights(user: User = Depends(get_current_user)) -> list[RightCatalogItem]:
    return [
        RightCatalogItem(
            id=RIGHT_IDS_BY_UI_ID[ui_id],
            rights_name=rights_name,
            ui_id=ui_id,
            label=label,
            description=RIGHT_DESCRIPTIONS[ui_id],
        )
        for ui_id, rights_name, label, _ in BASE_RIGHTS
    ]


# --------------------------------------------------------------------------- #
# Users
# --------------------------------------------------------------------------- #
@router.get("", response_model=list[UserRead])
def list_users(db: Session = Depends(get_db), _: User = Depends(require_admin)) -> list[User]:
    return list(db.scalars(select(User).order_by(User.username)).all())


@router.post("", response_model=UserRead, status_code=201)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> User:
    existing = db.scalar(select(User).where(User.username == payload.username))
    if existing is not None:
        raise HTTPException(status_code=409, detail=f"Username '{payload.username}' is already taken")

    user = User(
        username=payload.username,
        password_hash=_hash(payload.password),
        role=payload.role,
        active=payload.active,
    )
    _apply_rights(
        user,
        base_rights=payload.base_rights,
        channel_rights=payload.channel_rights,
        recompute_base=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    logger.info("Created user '%s' (role %s)", user.username, user.role)
    return user


@router.get("/{user_id}", response_model=UserRead)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
) -> User:
    ensure_self_or_admin(current, user_id)
    return _get_user_or_404(db, user_id)


@router.patch("/{user_id}", response_model=UserRead)
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current: User = Depends(require_admin),
) -> User:
    user = _get_user_or_404(db, user_id)
    changes = payload.model_dump(exclude_unset=True)

    if user_id == current.id:
        if "role" in changes and changes["role"] != user.role:
            raise HTTPException(status_code=409, detail="You cannot change your own role")
        if changes.get("active") is False:
            raise HTTPException(status_code=409, detail="You cannot disable your own account")

    role_changed = False
    if "role" in changes:
        new_role = changes.pop("role")
        role_changed = new_role != user.role
        user.role = new_role
    if "active" in changes:
        user.active = changes.pop("active")
    password = changes.pop("password", None)
    if password:
        user.password_hash = _hash(password)

    _apply_rights(
        user,
        base_rights=changes.get("base_rights"),
        channel_rights=changes.get("channel_rights"),
        recompute_base=role_changed,
    )
    db.commit()
    db.refresh(user)
    return user


@router.patch("/{user_id}/password", response_model=UserRead)
def reset_password(
    user_id: int,
    payload: PasswordUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> User:
    user = _get_user_or_404(db, user_id)
    user.password_hash = _hash(payload.new_password)
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=204)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(require_admin),
) -> None:
    user = _get_user_or_404(db, user_id)

    if user.id == current.id:
        raise HTTPException(status_code=409, detail="You cannot delete your own account")
    if user.role == ROLE_ADMIN:
        admins = db.scalar(
            select(func.count()).select_from(User).where(User.role == ROLE_ADMIN, User.active == True)  # noqa: E712
        )
        if (admins or 0) <= 1:
            raise HTTPException(status_code=409, detail="The last administrator cannot be deleted")

    db.delete(user)
    db.commit()
    logger.info("Deleted user '%s'", user.username)


# --------------------------------------------------------------------------- #
# Rights / channel grants
# --------------------------------------------------------------------------- #
@router.get("/{user_id}/rights", response_model=list[RightGroup])
def user_rights(
    user_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
) -> list[RightGroup]:
    ensure_self_or_admin(current, user_id)
    user = _get_user_or_404(db, user_id)
    held = set(user.base_rights or [])
    return [
        RightGroup(
            scope="base",
            rights=[
                RightItem(id=RIGHT_IDS_BY_UI_ID[ui_id], rights_name=rights_name)
                for ui_id, rights_name, _, _ in BASE_RIGHTS
                if ui_id in held
            ],
        )
    ]


@router.get("/{user_id}/accessible-cameras", response_model=list[AccessibleCamera])
def accessible_cameras(
    user_id: int,
    right_id: int = Query(..., description="Numeric id from GET /rights"),
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
) -> list[AccessibleCamera]:
    """Cameras the user may use the given right on (the channel-rights grant)."""
    ensure_self_or_admin(current, user_id)
    target = _get_user_or_404(db, user_id)

    ui_id = RIGHTS_BY_ID.get(right_id)
    if ui_id is None:
        raise HTTPException(status_code=404, detail="Unknown right")

    # Admins see everything; everyone else is scoped by their channel grants.
    if target.role != ROLE_ADMIN:
        if not target.holds_right(ui_id):
            return []
        granted = (target.channel_rights or {}).get(ui_id)
        if granted is None:
            # Right granted without an explicit camera list -> all cameras.
            cameras = list(db.scalars(select(Camera).where(Camera.enabled == True)).all())  # noqa: E712
        else:
            if not granted:
                return []
            cameras = list(
                db.scalars(
                    select(Camera)
                    .where(Camera.id.in_(granted), Camera.enabled == True)  # noqa: E712
                    .order_by(Camera.name)
                ).all()
            )
    else:
        cameras = list(
            db.scalars(select(Camera).where(Camera.enabled == True).order_by(Camera.name)).all()  # noqa: E712
        )

    return [
        AccessibleCamera(
            camera_id=camera.id,
            name=camera.name,
            online=camera.stream_state == "registered",
        )
        for camera in cameras
    ]


def _hash(password: str) -> str:
    return hash_password(password)
