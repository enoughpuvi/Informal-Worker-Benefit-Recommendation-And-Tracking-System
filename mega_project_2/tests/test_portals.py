import pytest
import sys
from pathlib import Path
from fastapi.testclient import TestClient

backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.main import app

client = TestClient(app)


@pytest.fixture
def admin_auth_header():
    res = client.post("/api/v1/auth/login", json={
        "email": "admin@welfare.gov.in",
        "password": "Admin@12345"
    })
    assert res.status_code == 200
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_get_all_portals():
    res = client.get("/api/v1/portals")
    assert res.status_code == 200
    portals = res.json()
    assert isinstance(portals, list)
    assert len(portals) >= 10

    # Ensure required authentic portals are present
    portal_ids = [p["id"] for p in portals]
    assert "myscheme" in portal_ids
    assert "national-portal-india" in portal_ids
    assert "services-india" in portal_ids
    assert "mahadbt" in portal_ids

    # Validate portal structure
    myscheme = next(p for p in portals if p["id"] == "myscheme")
    assert myscheme["official_url"] == "https://www.myscheme.gov.in/"
    assert myscheme["verification_status"] == "Verified"
    assert "Labour and Employment" in myscheme["categories"]
    assert "Hindi" in myscheme["supported_languages"]


def test_filter_portals_by_level():
    res_central = client.get("/api/v1/portals?level=Central")
    assert res_central.status_code == 200
    central_portals = res_central.json()
    assert len(central_portals) >= 3
    for p in central_portals:
        assert p["government_level"] == "Central"

    res_state = client.get("/api/v1/portals?level=State")
    assert res_state.status_code == 200
    state_portals = res_state.json()
    assert len(state_portals) >= 3
    for p in state_portals:
        assert p["government_level"] == "State"


def test_filter_portals_by_state():
    res = client.get("/api/v1/portals?state=Maharashtra")
    assert res.status_code == 200
    maharashtra_portals = res.json()
    assert any(p["id"] == "mahadbt" for p in maharashtra_portals)


def test_filter_portals_by_category():
    res = client.get("/api/v1/portals?category=Pension and Social Security")
    assert res.status_code == 200
    portals = res.json()
    assert len(portals) >= 1
    for p in portals:
        assert any("pension" in c.lower() for c in p["categories"])


def test_search_portals():
    res = client.get("/api/v1/portals?search=e-Shram")
    assert res.status_code == 200
    results = res.json()
    assert len(results) >= 1
    assert any("eshram" in p["id"] or "e-shram" in p["name"].lower() for p in results)


def test_get_portal_by_id():
    res = client.get("/api/v1/portals/mahadbt")
    assert res.status_code == 200
    portal = res.json()
    assert portal["id"] == "mahadbt"
    assert portal["state"] == "Maharashtra"
    assert "https://mahadbt.maharashtra.gov.in/" in portal["official_url"]

    # 404 test
    res_404 = client.get("/api/v1/portals/non-existent-portal-xyz")
    assert res_404.status_code == 404


def test_get_schemes_directory():
    res = client.get("/api/v1/portals/schemes/directory")
    assert res.status_code == 200
    schemes = res.json()
    assert isinstance(schemes, list)
    assert len(schemes) >= 5

    # Check structure
    scheme = schemes[0]
    assert "name" in scheme
    assert "responsible_department" in scheme
    assert "eligibility" in scheme
    assert "benefits" in scheme
    assert "required_documents" in scheme
    assert "official_information_url" in scheme
    assert "application_url" in scheme
    assert "verification_status" in scheme


def test_filter_schemes_directory():
    # Filter by portal
    res = client.get("/api/v1/portals/schemes/directory?portal_id=myscheme")
    assert res.status_code == 200
    schemes = res.json()
    assert len(schemes) >= 1
    for s in schemes:
        assert s["portal_id"] == "myscheme"

    # Filter by category
    res_cat = client.get("/api/v1/portals/schemes/directory?category=Financial Assistance")
    assert res_cat.status_code == 200
    cat_schemes = res_cat.json()
    assert len(cat_schemes) >= 1
    assert any(s["id"] == "myscheme-svanidhi" for s in cat_schemes)


def test_admin_portal_verification_review(admin_auth_header):
    payload = {
        "verification_status": "Verified",
        "notes": "Verified portal URL responsiveness and SSL certificate validity."
    }
    res = client.post("/api/v1/portals/karnataka-sevasindhu/verify-review", json=payload, headers=admin_auth_header)
    assert res.status_code == 200
    updated = res.json()
    assert updated["id"] == "karnataka-sevasindhu"
    assert updated["verification_status"] == "Verified"
    assert "Verified portal URL responsiveness" in updated["notes"]
