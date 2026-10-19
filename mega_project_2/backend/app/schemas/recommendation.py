from typing import List, Optional
from pydantic import BaseModel
from app.schemas.scheme import SchemeOut

class ScoreBreakdown(BaseModel):
    occupation: float
    income: float
    age: float
    location: float
    family: float
    disability: float
    education: float
    other: float

class RecommendedSchemeOut(BaseModel):
    scheme: SchemeOut
    match_score: int  # 0 to 100
    reasons: List[str] = []
    caveats: List[str] = []
    breakdown: ScoreBreakdown
    eligibility_status: str  # "Eligible", "Potentially Eligible", "Not Eligible"

class RecommendationResponse(BaseModel):
    worker_name: str
    total_schemes_evaluated: int
    recommendations: List[RecommendedSchemeOut]
    profile_completion: int
