import pytest
import sys
import uuid
from pathlib import Path
from fastapi.testclient import TestClient

backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.main import app
from app.core.security import get_password_hash, verify_password

client = TestClient(app)

def test_password_hashing():
    pw = "Secret@12345"
    hashed = get_password_hash(pw)
    assert hashed != pw
    assert verify_password(pw, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

def test_admin_login_success():
    res = client.post("/api/v1/auth/login", json={
        "email": "admin@welfare.gov.in",
        "password": "Admin@12345"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["role"] == "admin"

def test_worker_login_success():
    res = client.post("/api/v1/auth/login", json={
        "email": "ramesh.worker@demo.in",
        "password": "Worker@12345"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["role"] == "worker"

def test_invalid_login_error_message():
    res = client.post("/api/v1/auth/login", json={
        "email": "ramesh.worker@demo.in",
        "password": "WrongPassword999"
    })
    assert res.status_code == 401
    assert "Invalid credentials" in res.json()["detail"] or "Invalid" in res.json()["detail"]

def test_admin_login_with_admin_id_shortcut():
    for admin_id in ["ADMIN-001", "admin", "welfare-admin"]:
        res = client.post("/api/v1/auth/login", json={
            "email": admin_id,
            "password": "Admin@12345"
        })
        assert res.status_code == 200
        assert res.json()["user"]["role"] == "admin"


def test_worker_registration_flow():
    test_email = f"test.worker.{uuid.uuid4().hex[:10]}@test.com"
    res = client.post("/api/v1/auth/register", json={
        "full_name": "Test Artisan",
        "email": test_email,
        "phone": "+91 99999 88888",
        "password": "TestPassword@123",
        "confirm_password": "TestPassword@123",
        "age": 32,
        "gender": "Male",
        "state": "Maharashtra",
        "district": "Pune",
        "occupation": "Carpenter"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == test_email
