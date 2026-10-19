from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api import deps
from app.database.session import get_db
from app.models.user import User
from app.models.scheme import Scheme
from app.models.worker_profile import WorkerProfile
from app.schemas.eligibility import EligibilityCheckRequest, EligibilityResultOut
from app.services.eligibility_service import evaluate_worker_eligibility

router = APIRouter()

@router.post("/check", response_model=EligibilityResultOut)
def check_scheme_eligibility(
    request_in: EligibilityCheckRequest,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    scheme = db.query(Scheme).filter(Scheme.scheme_id == request_in.scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scheme not found.")

    profile = db.query(WorkerProfile).filter(WorkerProfile.user_id == current_user.id).first()
    result = evaluate_worker_eligibility(scheme, profile)
    return EligibilityResultOut(**result)

@router.get("/check/{scheme_id}", response_model=EligibilityResultOut)
def check_scheme_eligibility_get(
    scheme_id: str,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    scheme = db.query(Scheme).filter(Scheme.scheme_id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scheme not found.")

    profile = db.query(WorkerProfile).filter(WorkerProfile.user_id == current_user.id).first()
    result = evaluate_worker_eligibility(scheme, profile)
    return EligibilityResultOut(**result)
