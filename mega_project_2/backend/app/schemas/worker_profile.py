from typing import Optional, List
from pydantic import BaseModel, ConfigDict

class WorkerProfileBase(BaseModel):
    date_of_birth: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    city: Optional[str] = None
    pincode: Optional[str] = None
    
    occupation: Optional[str] = None
    employment_type: Optional[str] = None
    experience_years: Optional[int] = 0
    employer_status: Optional[str] = None
    monthly_income: Optional[float] = 0.0
    working_days_month: Optional[int] = 25
    
    marital_status: Optional[str] = None
    family_members: Optional[int] = 1
    dependents_count: Optional[int] = 0
    children_count: Optional[int] = 0
    elderly_count: Optional[int] = 0
    
    education_level: Optional[str] = None
    disability_status: Optional[bool] = False
    disability_type: Optional[str] = None
    existing_benefits: Optional[str] = "[]"
    bank_account: Optional[bool] = True
    identity_proof_type: Optional[str] = None

class WorkerProfileCreate(WorkerProfileBase):
    pass

class WorkerProfileUpdate(WorkerProfileBase):
    pass

class WorkerProfileOut(WorkerProfileBase):
    id: int
    user_id: int
    profile_completion: int = 0
    missing_fields: Optional[List[str]] = []

    model_config = ConfigDict(from_attributes=True)
