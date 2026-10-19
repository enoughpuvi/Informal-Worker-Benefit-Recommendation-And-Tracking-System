import random
from typing import Any, List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from app.api import deps
from app.database.session import get_db
from app.models.user import User
from app.models.scheme import Scheme
from app.models.application import Application
from app.models.application_history import ApplicationStatusHistory
from app.models.notification import Notification
from app.models.audit_log import AuditLog
from app.schemas.application import (
    ApplicationCreate,
    ApplicationStatusUpdate,
    ApplicationOut,
    ApplicationDetailOut,
    ApplicationHistoryOut,
    ApplicationDocumentOut
)
from app.schemas.scheme import SchemeOut
from app.schemas.user import UserOut
from app.services.tracking_service import update_application_status, get_application_timeline

router = APIRouter()

def generate_application_no(db: Session) -> str:
    year = datetime.now().year
    count = db.query(Application).count() + 1
    rand_suffix = random.randint(10, 99)
    return f"APP-{year}-{count:04d}{rand_suffix}"

@router.post("", response_model=ApplicationDetailOut)
@router.post("/", response_model=ApplicationDetailOut)
def apply_for_scheme(
    app_in: ApplicationCreate,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    scheme = db.query(Scheme).filter(Scheme.scheme_id == app_in.scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Welfare scheme not found.")

    if scheme.status != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This scheme is currently inactive and not accepting new applications."
        )

    # Check for active duplicate application
    existing_app = (
        db.query(Application)
        .filter(
            Application.worker_id == current_user.id,
            Application.scheme_id == app_in.scheme_id,
            Application.current_status.notin_(["REJECTED", "BENEFIT_DISBURSED"])
        )
        .first()
    )
    if existing_app:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You already have an active application ({existing_app.application_no}) for this scheme."
        )

    app_no = generate_application_no(db)
    new_app = Application(
        application_no=app_no,
        worker_id=current_user.id,
        scheme_id=scheme.scheme_id,
        application_date=datetime.now(timezone.utc),
        current_status="APPLIED",
        benefit_amount=scheme.benefit_amount,
        admin_remarks=app_in.remarks or "Application submitted online by worker."
    )
    db.add(new_app)
    db.flush()

    # Create initial Status History
    history = ApplicationStatusHistory(
        application_id=new_app.id,
        previous_status="DRAFT",
        new_status="APPLIED",
        changed_by_id=current_user.id,
        changed_by_name=current_user.full_name,
        timestamp=datetime.now(timezone.utc),
        remarks=app_in.remarks or "Application submitted by worker"
    )
    db.add(history)

    # Notification to worker
    notif = Notification(
        user_id=current_user.id,
        title=f"Application Submitted: {app_no}",
        message=f"Your application for '{scheme.scheme_name}' has been successfully submitted with Application ID {app_no}. You can track progress anytime.",
        type="application_status",
        related_id=app_no
    )
    db.add(notif)

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        user_name=current_user.full_name,
        action="APPLICATION_SUBMISSION",
        entity="application",
        entity_id=app_no,
        new_value=f"Applied for {scheme.scheme_name}"
    )
    db.add(audit)

    db.commit()
    db.refresh(new_app)

    timeline = get_application_timeline(new_app)
    detail_out = ApplicationDetailOut.model_validate(new_app)
    detail_out.timeline_steps = timeline
    return detail_out

@router.get("/my", response_model=List[ApplicationDetailOut])
def get_my_applications(
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    apps = (
        db.query(Application)
        .filter(Application.worker_id == current_user.id)
        .order_by(desc(Application.application_date))
        .all()
    )
    results = []
    for a in apps:
        out = ApplicationDetailOut.model_validate(a)
        out.timeline_steps = get_application_timeline(a)
        results.append(out)
    return results

@router.get("", response_model=List[ApplicationDetailOut])
@router.get("/", response_model=List[ApplicationDetailOut])
def list_all_applications_admin(
    status_filter: Optional[str] = None,
    scheme_id: Optional[str] = None,
    search: Optional[str] = None,
    current_admin: User = Depends(deps.get_current_active_admin),
    db: Session = Depends(get_db)
) -> Any:
    query = db.query(Application)

    if status_filter and status_filter != "All":
        query = query.filter(Application.current_status == status_filter)

    if scheme_id and scheme_id != "All":
        query = query.filter(Application.scheme_id == scheme_id)

    if search:
        term = f"%{search.strip()}%"
        query = query.join(User, Application.worker_id == User.id).join(Scheme, Application.scheme_id == Scheme.scheme_id).filter(
            or_(
                Application.application_no.ilike(term),
                User.full_name.ilike(term),
                User.phone.ilike(term),
                User.email.ilike(term),
                Scheme.scheme_name.ilike(term)
            )
        )

    apps = query.order_by(desc(Application.application_date)).all()
    results = []
    for a in apps:
        out = ApplicationDetailOut.model_validate(a)
        out.timeline_steps = get_application_timeline(a)
        results.append(out)
    return results

@router.get("/track/{application_no}", response_model=ApplicationDetailOut)
def track_application_by_number(
    application_no: str,
    db: Session = Depends(get_db)
) -> Any:
    app = db.query(Application).filter(Application.application_no == application_no.strip()).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application with ID '{application_no}' not found. Please check the reference number."
        )

    out = ApplicationDetailOut.model_validate(app)
    out.timeline_steps = get_application_timeline(app)
    return out

@router.get("/{id}", response_model=ApplicationDetailOut)
def get_application_by_id(
    id: int,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    app = db.query(Application).filter(Application.id == id).first()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")

    # Workers can only view their own applications
    if current_user.role != "admin" and app.worker_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    out = ApplicationDetailOut.model_validate(app)
    out.timeline_steps = get_application_timeline(app)
    return out

@router.put("/{id}/status", response_model=ApplicationDetailOut)
def update_status(
    id: int,
    status_update: ApplicationStatusUpdate,
    current_admin: User = Depends(deps.get_current_active_admin),
    db: Session = Depends(get_db)
) -> Any:
    app = db.query(Application).filter(Application.id == id).first()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")

    try:
        updated_app = update_application_status(
            db=db,
            application=app,
            new_status=status_update.new_status,
            changed_by=current_admin,
            remarks=status_update.remarks,
            benefit_amount=status_update.benefit_amount
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))

    out = ApplicationDetailOut.model_validate(updated_app)
    out.timeline_steps = get_application_timeline(updated_app)
    return out
