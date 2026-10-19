from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class ProcessingTimeStats(BaseModel):
    average_days: float
    min_days: float
    max_days: float
    total_completed_cases: int

class ChartItem(BaseModel):
    name: str
    value: int
    secondary: Optional[float] = None

class AdminAnalyticsOut(BaseModel):
    total_workers: int
    total_schemes: int
    active_schemes: int
    total_applications: int
    pending_applications: int
    approved_applications: int
    rejected_applications: int
    disbursed_applications: int
    total_benefits_disbursed_amount: float
    approval_rate: float
    rejection_rate: float
    
    processing_time: ProcessingTimeStats
    
    applications_by_status: List[ChartItem]
    applications_by_occupation: List[ChartItem]
    applications_by_scheme: List[ChartItem]
    monthly_trends: List[Dict[str, Any]]

class AuditLogOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    user_name: Optional[str] = None
    action: str
    entity: str
    entity_id: Optional[str] = None
    previous_value: Optional[str] = None
    new_value: Optional[str] = None
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)
