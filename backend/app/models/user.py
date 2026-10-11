from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.core.rbac import ROLE_USER


class User(Base):
    """An application account with one of the two roles (ADMIN | USER).

    ``base_rights`` is a list of ui ids from ``app.core.rbac.BASE_RIGHTS``;
    ``channel_rights`` maps a ui id to the camera ids the user may use that
    right on ({"liveMonitoring": [3, 7]}).
    """

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(80), nullable=False, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    role: Mapped[str] = mapped_column(
        String(16), nullable=False, default=ROLE_USER, server_default=ROLE_USER
    )
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="1")

    base_rights: Mapped[list] = mapped_column(JSON, nullable=False, default=list, server_default="[]")
    channel_rights: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict, server_default="{}")

    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    @property
    def full_name(self) -> str:
        """The basic system has no profile names - the username is the name."""
        return self.username

    def holds_right(self, ui_id: str) -> bool:
        return ui_id in (self.base_rights or [])
