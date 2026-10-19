from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class DocumentVerify(BaseModel):
    status: str  # Verified, Rejected, Under Verification
    admin_remarks: Optional[str] = None

class DocumentOut(BaseModel):
    id: int
    application_id: Optional[int] = None
    application_no: Optional[str] = None
    scheme_name: Optional[str] = None
    worker_id: int
    document_type: str
    file_name: str
    file_path: str
    file_size: int
    upload_date: datetime
    status: str
    admin_remarks: Optional[str] = None
    verified_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
