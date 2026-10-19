import pytest
import sys
import io
from pathlib import Path
from fastapi.testclient import TestClient

backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.main import app
from app.database.session import SessionLocal
from app.models.scheme import Scheme
from app.services.dataset_service import generate_sample_schemes_csv, parse_and_validate_dataset

client = TestClient(app)

def test_sample_csv_template_generation():
    csv_str = generate_sample_schemes_csv()
    assert "scheme_id" in csv_str
    assert "scheme_name" in csv_str
    assert "category" in csv_str
    assert "benefits" in csv_str

def test_dataset_upload_preview_and_validation():
    # Login as admin to get token
    login_res = client.post("/api/v1/auth/login", json={
        "email": "admin@welfare.gov.in",
        "password": "Admin@12345"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    sample_csv = generate_sample_schemes_csv()
    files = {
        "file": ("test_schemes.csv", io.BytesIO(sample_csv.encode("utf-8")), "text/csv")
    }

    res = client.post("/api/v1/dataset/upload-preview", files=files, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total_rows"] > 0
    assert data["is_valid_for_import"] is True
    assert "import_token" in data
    assert len(data["rows"]) > 0
