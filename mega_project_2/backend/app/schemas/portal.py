from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class TrustedPortalOut(BaseModel):
    id: str
    name: str
    hindi_name: Optional[str] = None
    description: str
    government_level: str  # Central or State
    state: str
    responsible_department: str
    categories: List[str]
    information_available: List[str]
    supported_languages: List[str]
    official_url: str
    application_url: Optional[str] = None
    portal_type: str
    verification_status: str  # Verified or Needs verification
    last_verified_date: str
    review_frequency_days: int
    schemes_count: int
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class PortalSchemeOut(BaseModel):
    id: str
    portal_id: str
    portal_name: str
    name: str
    category: str
    responsible_department: str
    state_applicability: str
    target_occupation: str
    eligibility: str
    benefits: str
    required_documents: List[str]
    official_information_url: str
    application_url: str
    last_verified_date: str
    verification_status: str

    model_config = ConfigDict(from_attributes=True)


class VerificationReviewUpdate(BaseModel):
    verification_status: Optional[str] = "Verified"
    notes: Optional[str] = None
