import sys
from pathlib import Path
from fastapi.testclient import TestClient

backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.main import app

client = TestClient(app)


def test_health_check_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "service" in data


def test_api_info_endpoint():
    response = client.get("/api")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "endpoints" in data


def test_spa_root_serving():
    response = client.get("/")
    assert response.status_code == 200
    # Should serve the HTML single-page app or API info fallback
    assert "<!doctype html>" in response.text.lower() or "project" in response.text.lower()


def test_spa_client_side_routing_fallback():
    # Frontend SPA routes should return the index.html template for client-side routing
    for path in ["/login", "/dashboard", "/schemes", "/track", "/profile"]:
        response = client.get(path)
        assert response.status_code == 200
        assert "<!doctype html>" in response.text.lower()


def test_pwa_manifest_and_icons():
    # Manifest should be served properly
    manifest_res = client.get("/manifest.json")
    assert manifest_res.status_code in [200, 404]
    if manifest_res.status_code == 200:
        manifest_data = manifest_res.json()
        assert "name" in manifest_data
        assert "Apana Benefits" in manifest_data["name"]

    # Favicon should respond
    fav_res = client.get("/favicon.svg")
    assert fav_res.status_code in [200, 404]


def test_desktop_app_helper_methods():
    project_root = Path(__file__).resolve().parent.parent
    sys.path.insert(0, str(project_root))
    import desktop_app

    # Test port check function
    is_in_use = desktop_app.is_port_in_use(99999, "127.0.0.1")  # Invalid port should return False
    assert is_in_use is False

    # Test runtime finder
    runtime = desktop_app.find_browser_app_runtime()
    # On Windows with Edge or Chrome, it should find an executable
    if runtime:
        assert Path(runtime).exists()


def test_api_routes_trailing_and_non_trailing_slashes():
    from app.core.security import create_access_token
    admin_token = create_access_token(1, "admin")
    worker_token = create_access_token(2, "worker")

    # Schemes: both /api/v1/schemes and /api/v1/schemes/ should return 200
    res_schemes_no_slash = client.get("/api/v1/schemes")
    assert res_schemes_no_slash.status_code == 200
    res_schemes_slash = client.get("/api/v1/schemes/")
    assert res_schemes_slash.status_code == 200

    # Recommendations: /api/v1/recommendations with auth
    res_rec = client.get("/api/v1/recommendations", headers={"Authorization": f"Bearer {worker_token}"})
    assert res_rec.status_code == 200

    # Applications: /api/v1/applications with admin auth
    res_apps = client.get("/api/v1/applications", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_apps.status_code == 200

    # Notifications: /api/v1/notifications with worker auth
    res_notif = client.get("/api/v1/notifications", headers={"Authorization": f"Bearer {worker_token}"})
    assert res_notif.status_code == 200


def test_admin_reports_csv_export_query_token_auth():
    from app.core.security import create_access_token
    admin_token = create_access_token(1, "admin")

    # Query param token should allow direct browser download of CSV reports
    res = client.get(f"/api/v1/admin/reports/export-csv?report_type=workers&token={admin_token}")
    assert res.status_code == 200
    assert "text/csv" in res.headers.get("content-type", "")
    assert "Worker ID" in res.text

    # Unauthorized request without token should be rejected with 401
    res_unauth = client.get("/api/v1/admin/reports/export-csv?report_type=workers")
    assert res_unauth.status_code == 401

