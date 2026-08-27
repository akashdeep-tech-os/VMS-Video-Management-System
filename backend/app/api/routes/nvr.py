import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.nvr import NVR
from app.schemas.nvr import NVRCreate, NVRRead, NVRUpdate

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/nvrs", tags=["nvrs"])


@router.get("", response_model=list[NVRRead])
def list_nvrs(db: Session = Depends(get_db)) -> list[NVR]:
    return list(db.scalars(select(NVR).order_by(NVR.name)).all())


@router.get("/{nvr_id}", response_model=NVRRead)
def get_nvr(nvr_id: int, db: Session = Depends(get_db)) -> NVR:
    nvr = db.get(NVR, nvr_id)
    if nvr is None:
        raise HTTPException(status_code=404, detail="NVR not found")
    return nvr


@router.post("", response_model=NVRRead, status_code=201)
def create_nvr(payload: NVRCreate, db: Session = Depends(get_db)) -> NVR:
    nvr = NVR(
        name=payload.name,
        ip_address=payload.ip_address,
        port=payload.port,
        username=payload.username,
        password=payload.password,
    )
    db.add(nvr)
    db.commit()
    db.refresh(nvr)
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
    db.delete(nvr)
    db.commit()
