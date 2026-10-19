from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.api import deps
from app.database.session import get_db
from app.models.user import User
from app.models.notification import Notification
from app.schemas.notification import NotificationOut

router = APIRouter()

@router.get("", response_model=List[NotificationOut])
@router.get("/", response_model=List[NotificationOut])
def get_notifications(
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    notifs = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(desc(Notification.created_at))
        .limit(50)
        .all()
    )
    return [NotificationOut.model_validate(n) for n in notifs]

@router.patch("/{id}/read", response_model=NotificationOut)
def mark_notification_read(
    id: int,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    notif = db.query(Notification).filter(Notification.id == id, Notification.user_id == current_user.id).first()
    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found.")

    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return NotificationOut.model_validate(notif)

@router.post("/read-all")
def mark_all_notifications_read(
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    db.query(Notification).filter(Notification.user_id == current_user.id, Notification.is_read == False).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read."}
