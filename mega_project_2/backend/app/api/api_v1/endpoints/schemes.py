from typing import Any, List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.api import deps
from app.database.session import get_db
from app.models.user import User
from app.models.scheme import Scheme
from app.models.audit_log import AuditLog
from app.schemas.scheme import SchemeCreate, SchemeUpdate, SchemeOut
from app.services.rag_service import rag_service

router = APIRouter()

@router.get("", response_model=List[SchemeOut])
@router.get("/", response_model=List[SchemeOut])
def list_schemes(
    category: Optional[str] = None,
    state: Optional[str] = None,
    occupation: Optional[str] = None,
    search: Optional[str] = None,
    status_filter: Optional[str] = "active",  # "active", "all", "inactive"
    db: Session = Depends(get_db)
) -> Any:
    query = db.query(Scheme)

    if status_filter == "active":
        query = query.filter(Scheme.status == "active")
    elif status_filter == "inactive":
        query = query.filter(Scheme.status == "inactive")

    if category and category != "All":
        query = query.filter(Scheme.category == category)

    if state and state != "All India" and state != "All":
        query = query.filter(or_(Scheme.state == "All India", Scheme.state.ilike(f"%{state}%")))

    if occupation and occupation != "All":
        query = query.filter(or_(Scheme.target_occupation.ilike("%all%"), Scheme.target_occupation.ilike(f"%{occupation}%")))

    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Scheme.scheme_name.ilike(search_term),
                Scheme.description.ilike(search_term),
                Scheme.category.ilike(search_term),
                Scheme.target_occupation.ilike(search_term),
                Scheme.scheme_id.ilike(search_term)
            )
        )

    schemes = query.order_by(Scheme.scheme_name.asc()).all()
    return [SchemeOut.model_validate(s) for s in schemes]

@router.get("/categories", response_model=List[str])
def get_scheme_categories(db: Session = Depends(get_db)) -> Any:
    categories = db.query(Scheme.category).distinct().all()
    cleaned = sorted(list({c[0] for c in categories if c[0]}))
    return cleaned

@router.get("/{scheme_id}", response_model=SchemeOut)
def get_scheme_detail(scheme_id: str, db: Session = Depends(get_db)) -> Any:
    scheme = db.query(Scheme).filter(Scheme.scheme_id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Welfare scheme not found.")
    return SchemeOut.model_validate(scheme)

@router.post("", response_model=SchemeOut)
@router.post("/", response_model=SchemeOut)
def create_scheme(
    scheme_in: SchemeCreate,
    current_admin: User = Depends(deps.get_current_active_admin),
    db: Session = Depends(get_db)
) -> Any:
    existing = db.query(Scheme).filter(Scheme.scheme_id == scheme_in.scheme_id.strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A scheme with ID '{scheme_in.scheme_id}' already exists."
        )

    scheme_data = scheme_in.dict()
    scheme_data["scheme_id"] = scheme_data["scheme_id"].strip()
    scheme = Scheme(**scheme_data)
    db.add(scheme)

    # Add audit log
    audit = AuditLog(
        user_id=current_admin.id,
        user_name=current_admin.full_name,
        action="SCHEME_CREATED",
        entity="scheme",
        entity_id=scheme.scheme_id,
        new_value=scheme.scheme_name
    )
    db.add(audit)

    db.commit()
    db.refresh(scheme)

    # Re-index RAG system automatically
    rag_service.index_schemes(db)

    return SchemeOut.model_validate(scheme)

@router.put("/{scheme_id}", response_model=SchemeOut)
def update_scheme(
    scheme_id: str,
    scheme_in: SchemeUpdate,
    current_admin: User = Depends(deps.get_current_active_admin),
    db: Session = Depends(get_db)
) -> Any:
    scheme = db.query(Scheme).filter(Scheme.scheme_id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Welfare scheme not found.")

    update_data = scheme_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(scheme, field, value)

    scheme.last_updated = datetime.now(timezone.utc)

    # Add audit log
    audit = AuditLog(
        user_id=current_admin.id,
        user_name=current_admin.full_name,
        action="SCHEME_UPDATED",
        entity="scheme",
        entity_id=scheme.scheme_id,
        new_value=f"Updated fields: {', '.join(update_data.keys())}"
    )
    db.add(audit)

    db.commit()
    db.refresh(scheme)

    # Re-index RAG system automatically
    rag_service.index_schemes(db)

    return SchemeOut.model_validate(scheme)

@router.patch("/{scheme_id}/toggle-status", response_model=SchemeOut)
def toggle_scheme_status(
    scheme_id: str,
    current_admin: User = Depends(deps.get_current_active_admin),
    db: Session = Depends(get_db)
) -> Any:
    scheme = db.query(Scheme).filter(Scheme.scheme_id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Welfare scheme not found.")

    new_status = "inactive" if scheme.status == "active" else "active"
    old_status = scheme.status
    scheme.status = new_status
    scheme.last_updated = datetime.now(timezone.utc)

    # Add audit log
    audit = AuditLog(
        user_id=current_admin.id,
        user_name=current_admin.full_name,
        action="SCHEME_STATUS_TOGGLE",
        entity="scheme",
        entity_id=scheme.scheme_id,
        previous_value=old_status,
        new_value=new_status
    )
    db.add(audit)

    db.commit()
    db.refresh(scheme)

    # Re-index RAG system automatically
    rag_service.index_schemes(db)

    return SchemeOut.model_validate(scheme)

@router.delete("/{scheme_id}")
def delete_scheme(
    scheme_id: str,
    current_admin: User = Depends(deps.get_current_active_admin),
    db: Session = Depends(get_db)
) -> Any:
    scheme = db.query(Scheme).filter(Scheme.scheme_id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Welfare scheme not found.")

    # Audit log
    audit = AuditLog(
        user_id=current_admin.id,
        user_name=current_admin.full_name,
        action="SCHEME_DELETED",
        entity="scheme",
        entity_id=scheme.scheme_id,
        previous_value=scheme.scheme_name
    )
    db.add(audit)

    db.delete(scheme)
    db.commit()

    # Re-index RAG system automatically
    rag_service.index_schemes(db)

    return {"message": f"Scheme '{scheme_id}' was successfully deleted."}
