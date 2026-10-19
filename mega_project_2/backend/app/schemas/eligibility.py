from typing import List, Optional
from pydantic import BaseModel

class EligibilityCheckRequest(BaseModel):
    scheme_id: str

class EligibilityResultOut(BaseModel):
    scheme_id: str
    scheme_name: str
    status: str  # "Eligible", "Potentially Eligible", "Not Eligible"
    is_eligible: bool
    match_percentage: int
    satisfied_criteria: List[str] = []
    missing_criteria: List[str] = []
    failed_criteria: List[str] = []
    remarks: Optional[str] = None
