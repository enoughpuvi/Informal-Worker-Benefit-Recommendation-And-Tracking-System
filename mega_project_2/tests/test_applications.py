import pytest
import sys
from pathlib import Path
from fastapi.testclient import TestClient

backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.main import app
from app.database.session import SessionLocal
from app.models.user import User
from app.models.application import Application
from app.services.tracking_service import validate_transition, update_application_status

client = TestClient(app)

def test_status_transition_rules():
    # Valid transitions
    assert validate_transition("DRAFT", "APPLIED")[0] is True
    assert validate_transition("APPLIED", "DOCUMENTS_VERIFIED")[0] is True
    assert validate_transition("DOCUMENTS_VERIFIED", "UNDER_REVIEW")[0] is True
    assert validate_transition("UNDER_REVIEW", "APPROVED")[0] is True
    assert validate_transition("APPROVED", "BENEFIT_DISBURSED")[0] is True

    # Invalid transitions
    assert validate_transition("DRAFT", "APPROVED")[0] is False
    assert validate_transition("APPLIED", "BENEFIT_DISBURSED")[0] is False
    assert validate_transition("BENEFIT_DISBURSED", "APPLIED")[0] is False

def test_application_tracking_by_id():
    db = SessionLocal()
    try:
        app_record = db.query(Application).first()
        assert app_record is not None

        res = client.get(f"/api/v1/applications/track/{app_record.application_no}")
        assert res.status_code == 200
        data = res.json()
        assert data["application_no"] == app_record.application_no
        assert "timeline_steps" in data
        assert len(data["timeline_steps"]) > 0
    finally:
        db.close()
