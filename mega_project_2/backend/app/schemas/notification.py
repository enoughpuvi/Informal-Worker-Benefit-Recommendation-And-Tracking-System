from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class NotificationCreate(BaseModel):
    user_id: int
    title: str
    message: str
    type: Optional[str] = "general"
    related_id: Optional[str] = None

class NotificationOut(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    type: str
    related_id: Optional[str] = None
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
