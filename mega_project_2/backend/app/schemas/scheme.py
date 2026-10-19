from typing import Optional, List, Union
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class SchemeBase(BaseModel):
    scheme_id: str
    scheme_name: str
    description: str
    category: str
    department: Optional[str] = None
    government_level: Optional[str] = "Central"
    state: Optional[str] = "All India"
    
    target_occupation: Optional[str] = "All"
    minimum_age: Optional[int] = 18
    maximum_age: Optional[int] = 60
    income_limit: Optional[float] = None
    gender: Optional[str] = "All"
    education: Optional[str] = "Any"
    disability_eligibility: Optional[str] = "Any"
    family_criteria: Optional[str] = None
    
    required_documents: Optional[str] = "[]"
    benefits: str
    benefit_amount: Optional[float] = None
    application_process: Optional[str] = None
    official_url: Optional[str] = None
    status: Optional[str] = "active"

class SchemeCreate(SchemeBase):
    pass

class SchemeUpdate(BaseModel):
    scheme_name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    department: Optional[str] = None
    government_level: Optional[str] = None
    state: Optional[str] = None
    target_occupation: Optional[str] = None
    minimum_age: Optional[int] = None
    maximum_age: Optional[int] = None
    income_limit: Optional[float] = None
    gender: Optional[str] = None
    education: Optional[str] = None
    disability_eligibility: Optional[str] = None
    family_criteria: Optional[str] = None
    required_documents: Optional[str] = None
    benefits: Optional[str] = None
    benefit_amount: Optional[float] = None
    application_process: Optional[str] = None
    official_url: Optional[str] = None
    status: Optional[str] = None

class SchemeOut(SchemeBase):
    last_updated: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class SchemeFilter(BaseModel):
    category: Optional[str] = None
    state: Optional[str] = None
    occupation: Optional[str] = None
    search: Optional[str] = None
    status: Optional[str] = "active"
