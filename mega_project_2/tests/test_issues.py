import pytest
import sys
from pathlib import Path
from fastapi.testclient import TestClient

backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.main import app

client = TestClient(app)


@pytest.fixture
def worker_auth_header():
    res = client.post("/api/v1/auth/login", json={
        "email": "ramesh.worker@demo.in",
        "password": "Worker@12345"
    })
    assert res.status_code == 200
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_auth_header():
    res = client.post("/api/v1/auth/login", json={
        "email": "admin@welfare.gov.in",
        "password": "Admin@12345"
    })
    assert res.status_code == 200
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_submit_issue_worker(worker_auth_header):
    payload = {
        "category": "Scheme Application",
        "priority": "High",
        "subject": "Delayed approval for PM-SVANidhi loan",
        "description": "I submitted my street vendor verification documents 2 weeks ago but status has not moved.",
        "related_application_no": "APP-2026-001"
    }
    res = client.post("/api/v1/issues", json=payload, headers=worker_auth_header)
    assert res.status_code == 200
    data = res.json()
    assert data["ticket_no"].startswith("TKT-2026-")
    assert data["subject"] == payload["subject"]
    assert data["status"] == "Open"
    assert data["user_role"] == "worker"


def test_get_my_issues_worker(worker_auth_header):
    res = client.get("/api/v1/issues/my", headers=worker_auth_header)
    assert res.status_code == 200
    issues = res.json()
    assert isinstance(issues, list)
    assert len(issues) >= 1


def test_admin_view_and_update_issue(worker_auth_header, admin_auth_header):
    # 1. Worker creates issue
    res = client.post("/api/v1/issues", json={
        "category": "Technical / Bug",
        "priority": "Urgent",
        "subject": "Document preview fails for voter ID",
        "description": "Preview modal showed a blank screen on Firefox."
    }, headers=worker_auth_header)
    assert res.status_code == 200
    issue_id = res.json()["id"]

    # 2. Admin retrieves issues list
    admin_list_res = client.get("/api/v1/issues?status_filter=Open", headers=admin_auth_header)
    assert admin_list_res.status_code == 200
    all_open = admin_list_res.json()
    assert any(item["id"] == issue_id for item in all_open)

    # 3. Admin updates status and adds resolution note
    update_res = client.put(f"/api/v1/issues/{issue_id}/status", json={
        "status": "Resolved",
        "admin_response": "We updated the document viewer to support Firefox blob preview."
    }, headers=admin_auth_header)
    assert update_res.status_code == 200
    updated = update_res.json()
    assert updated["status"] == "Resolved"
    assert "Firefox blob preview" in updated["admin_response"]
