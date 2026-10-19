from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api import deps
from app.database.session import get_db
from app.models.user import User
from app.models.worker_profile import WorkerProfile
from app.models.application import Application
from app.models.notification import Notification
from app.schemas.worker_profile import WorkerProfileOut, WorkerProfileUpdate
from app.services.recommendation_service import recommendation_engine

router = APIRouter()

def get_missing_profile_fields(profile: WorkerProfile) -> List[str]:
    missing = []
    if not (profile.date_of_birth or profile.age):
        missing.append("Date of Birth / Age")
    if not profile.gender:
        missing.append("Gender")
    if not profile.state:
        missing.append("State")
    if not (profile.district or profile.city):
        missing.append("District / City")
    if not profile.occupation:
        missing.append("Primary Occupation")
    if not profile.employment_type:
        missing.append("Employment Type")
    if profile.monthly_income is None or profile.monthly_income <= 0:
        missing.append("Monthly Income")
    if not profile.identity_proof_type:
        missing.append("Identity Document (Aadhaar / e-Shram)")
    return missing

@router.get("/profile", response_model=WorkerProfileOut)
def get_worker_profile(
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    profile = db.query(WorkerProfile).filter(WorkerProfile.user_id == current_user.id).first()
    if not profile:
        profile = WorkerProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    pct = profile.calculate_completion()
    db.commit()

    missing = get_missing_profile_fields(profile)
    out = WorkerProfileOut.model_validate(profile)
    out.missing_fields = missing
    return out

@router.put("/profile", response_model=WorkerProfileOut)
def update_worker_profile(
    profile_in: WorkerProfileUpdate,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    profile = db.query(WorkerProfile).filter(WorkerProfile.user_id == current_user.id).first()
    if not profile:
        profile = WorkerProfile(user_id=current_user.id)
        db.add(profile)

    update_data = profile_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)

    profile.calculate_completion()
    db.commit()
    db.refresh(profile)

    missing = get_missing_profile_fields(profile)
    out = WorkerProfileOut.model_validate(profile)
    out.missing_fields = missing
    return out

@router.get("/dashboard")
def get_worker_dashboard(
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    profile = db.query(WorkerProfile).filter(WorkerProfile.user_id == current_user.id).first()
    if not profile:
        profile = WorkerProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    completion = profile.calculate_completion()
    missing_fields = get_missing_profile_fields(profile)

    # Applications summary
    user_apps = db.query(Application).filter(Application.worker_id == current_user.id).all()
    total_apps = len(user_apps)
    approved_count = sum(1 for a in user_apps if a.current_status in ["APPROVED", "BENEFIT_DISBURSED"])
    under_review_count = sum(1 for a in user_apps if a.current_status in ["UNDER_REVIEW", "DOCUMENTS_VERIFIED"])
    pending_docs_count = sum(1 for a in user_apps if a.current_status in ["DOCUMENTS_PENDING", "APPLIED"])
    rejected_count = sum(1 for a in user_apps if a.current_status == "REJECTED")
    benefits_received_count = sum(1 for a in user_apps if a.current_status == "BENEFIT_DISBURSED")
    
    total_benefit_amount = sum(
        (a.benefit_amount or (a.scheme.benefit_amount if a.scheme and a.scheme.benefit_amount else 0.0))
        for a in user_apps if a.current_status == "BENEFIT_DISBURSED"
    )

    # Top recommendations
    recommendations = recommendation_engine.get_recommendations_for_worker(db, profile)[:5]

    # Recent notifications
    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(5)
        .all()
    )

    # Pending actions
    pending_actions = []
    if missing_fields:
        pending_actions.append({
            "title": "Complete Profile",
            "description": f"Add {missing_fields[0]} to improve recommendation accuracy.",
            "link": "/profile",
            "type": "profile"
        })
    for a in user_apps:
        if a.current_status == "DOCUMENTS_PENDING":
            pending_actions.append({
                "title": f"Upload Documents: {a.application_no}",
                "description": f"Supporting documents required for {a.scheme.scheme_name if a.scheme else 'Scheme'}.",
                "link": f"/track/{a.application_no}",
                "type": "documents"
            })

    return {
        "user": {
            "id": current_user.id,
            "full_name": current_user.full_name,
            "email": current_user.email,
            "phone": current_user.phone
        },
        "profile": {
            "occupation": profile.occupation or "Not specified",
            "monthly_income": profile.monthly_income or 0.0,
            "state": profile.state or "Not specified",
            "profile_completion": completion,
            "missing_fields": missing_fields
        },
        "stats": {
            "total_applications": total_apps,
            "approved": approved_count,
            "under_review": under_review_count,
            "pending_documents": pending_docs_count,
            "rejected": rejected_count,
            "benefits_received": benefits_received_count,
            "total_benefit_amount": total_benefit_amount
        },
        "top_recommendations": recommendations,
        "pending_actions": pending_actions,
        "recent_notifications": [
            {
                "id": n.id,
                "title": n.title,
                "message": n.message,
                "type": n.type,
                "related_id": n.related_id,
                "is_read": n.is_read,
                "created_at": n.created_at.isoformat()
            }
            for n in notifications
        ]
    }
