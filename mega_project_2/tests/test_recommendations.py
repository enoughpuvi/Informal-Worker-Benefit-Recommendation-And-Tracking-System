import pytest
import sys
from pathlib import Path
from fastapi.testclient import TestClient

backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.main import app
from app.database.session import SessionLocal
from app.models.scheme import Scheme
from app.models.worker_profile import WorkerProfile
from app.services.recommendation_service import recommendation_engine
from app.services.eligibility_service import evaluate_worker_eligibility

client = TestClient(app)

def test_explainable_recommendation_scoring():
    db = SessionLocal()
    try:
        scheme = db.query(Scheme).filter(Scheme.scheme_id == "SCHEME-PMSYM-01").first()
        assert scheme is not None

        # Construction worker earning 12000, age 35
        profile = WorkerProfile(
            occupation="Construction Worker",
            monthly_income=12000.0,
            age=35,
            state="Delhi",
            gender="Male",
            family_members=4,
            dependents_count=2,
            education_level="Primary School",
            disability_status=False
        )

        score, breakdown, reasons, caveats = recommendation_engine.compute_scheme_score(scheme, profile)
        assert 0 <= score <= 100
        assert score >= 75  # Should have very high match score
        assert breakdown.occupation > 0
        assert breakdown.income > 0
        assert len(reasons) > 0
    finally:
        db.close()

def test_eligibility_evaluation_categories():
    db = SessionLocal()
    try:
        scheme = db.query(Scheme).filter(Scheme.scheme_id == "SCHEME-PMSYM-01").first()
        assert scheme is not None

        # Eligible profile
        eligible_profile = WorkerProfile(
            occupation="Street Vendor",
            monthly_income=11000.0,
            age=30,
            state="All India",
            gender="Male"
        )
        res1 = evaluate_worker_eligibility(scheme, eligible_profile)
        assert res1["status"] in ["Eligible", "Potentially Eligible"]
        assert res1["is_eligible"] is True

        # Ineligible profile (Age 65 exceeds max age 40, income 50000 exceeds limit 15000)
        ineligible_profile = WorkerProfile(
            occupation="Street Vendor",
            monthly_income=50000.0,
            age=65,
            state="All India",
            gender="Male"
        )
        res2 = evaluate_worker_eligibility(scheme, ineligible_profile)
        assert res2["status"] == "Not Eligible"
        assert res2["is_eligible"] is False
        assert len(res2["failed_criteria"]) > 0
    finally:
        db.close()
