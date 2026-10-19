from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.schemas.scheme import SchemeOut
from app.schemas.user import UserOut

class ApplicationCreate(BaseModel):
    scheme_id: str
    remarks: Optional[str] = None

class ApplicationStatusUpdate(BaseModel):
    new_status: str  # DRAFT, APPLIED, DOCUMENTS_PENDING, DOCUMENTS_VERIFIED, UNDER_REVIEW, APPROVED, BENEFIT_DISBURSED, REJECTED
    remarks: Optional[str] = None
    benefit_amount: Optional[float] = None

class ApplicationHistoryOut(BaseModel):
    id: int
    application_id: int
    previous_status: Optional[str] = None
    new_status: str
    changed_by_name: Optional[str] = None
    timestamp: datetime
    remarks: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class ApplicationDocumentOut(BaseModel):
    id: int
    application_id: int
    document_type: str
    file_name: str
    file_path: str
    file_size: int
    upload_date: datetime
    status: str
    admin_remarks: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class ApplicationOut(BaseModel):
    id: int
    application_no: str
    worker_id: int
    scheme_id: str
    application_date: datetime
    current_status: str
    benefit_amount: Optional[float] = None
    benefit_disbursed_date: Optional[datetime] = None
    admin_remarks: Optional[str] = None
    last_updated: Optional[datetime] = None
    
    scheme: Optional[SchemeOut] = None
    worker: Optional[UserOut] = None

    model_config = ConfigDict(from_attributes=True)

class ApplicationDetailOut(ApplicationOut):
    status_history: List[ApplicationHistoryOut] = []
    documents: List[ApplicationDocumentOut] = []
    timeline_steps: Optional[List[dict]] = []

    model_config = ConfigDict(from_attributes=True)
