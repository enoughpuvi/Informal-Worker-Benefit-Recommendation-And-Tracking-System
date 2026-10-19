from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class IssueReportCreate(BaseModel):
    category: str
    subject: str
    description: str
    priority: Optional[str] = "Medium"
    related_application_no: Optional[str] = None


class IssueReportUpdateStatus(BaseModel):
    status: str
    admin_response: Optional[str] = None


class IssueReportOut(BaseModel):
    id: int
    ticket_no: str
    user_id: int
    user_name: str
    user_email: str
    user_role: str
    category: str
    priority: str
    subject: str
    description: str
    related_application_no: Optional[str] = None
    status: str
    admin_response: Optional[str] = None
    resolved_by: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
