import io
import sys
from pathlib import Path
from fastapi.testclient import TestClient

backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.main import app
from app.core.security import create_access_token
from app.database.session import SessionLocal
from app.models.document import ApplicationDocument
from app.models.user import User

client = TestClient(app)


def test_document_view_and_download_endpoints():
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.role == "admin").first()
        doc = db.query(ApplicationDocument).first()
        assert admin is not None
        assert doc is not None

        admin_token = create_access_token(admin.id, "admin")
        worker_token = create_access_token(doc.worker_id, "worker")

        # 1. Admin can view document via Header
        res_view = client.get(
            f"/api/v1/documents/{doc.id}/view",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert res_view.status_code == 200
        assert "inline" in res_view.headers.get("content-disposition", "")

        # 2. Admin can download document via query parameter token
        res_dl = client.get(f"/api/v1/documents/{doc.id}/download?token={admin_token}")
        assert res_dl.status_code == 200
        assert "attachment" in res_dl.headers.get("content-disposition", "")

        # 3. Worker can download own document
        res_worker_dl = client.get(
            f"/api/v1/documents/{doc.id}/download",
            headers={"Authorization": f"Bearer {worker_token}"}
        )
        assert res_worker_dl.status_code == 200
        assert "attachment" in res_worker_dl.headers.get("content-disposition", "")

        # 4. Unauthenticated request rejected
        res_unauth = client.get(f"/api/v1/documents/{doc.id}/download")
        assert res_unauth.status_code == 401

    finally:
        db.close()


def test_worker_document_crud_and_duplicate_prevention():
    db = SessionLocal()
    try:
        worker = db.query(User).filter(User.role == "worker").first()
        assert worker is not None
        worker_token = create_access_token(worker.id, "worker")
        headers = {"Authorization": f"Bearer {worker_token}"}

        # 1. Fetch worker documents list
        res_list = client.get("/api/v1/documents/my", headers=headers)
        assert res_list.status_code == 200
        assert isinstance(res_list.json(), list)

        # 2. Upload a new test document
        dummy_file = ("income_proof.png", io.BytesIO(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR"), "image/png")
        res_upload = client.post(
            "/api/v1/documents/upload",
            data={"document_type": "Income Certificate Proof"},
            files={"file": dummy_file},
            headers=headers
        )
        assert res_upload.status_code == 200
        doc_data = res_upload.json()
        doc_id = doc_data["id"]
        assert doc_data["document_type"] == "Income Certificate Proof"

        # 3. Attempt duplicate upload of same document_type -> must be rejected
        dummy_file_dup = ("income_copy.png", io.BytesIO(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR"), "image/png")
        res_dup = client.post(
            "/api/v1/documents/upload",
            data={"document_type": "Income Certificate Proof"},
            files={"file": dummy_file_dup},
            headers=headers
        )
        assert res_dup.status_code == 400
        assert "Duplicate documents" in res_dup.json()["detail"] or "already uploaded" in res_dup.json()["detail"]

        # 4. Update the document: replace file and change type
        replacement_file = ("updated_income.png", io.BytesIO(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR"), "image/png")
        res_update = client.put(
            f"/api/v1/documents/{doc_id}",
            data={"document_type": "Income Certificate (Updated)"},
            files={"file": replacement_file},
            headers=headers
        )
        assert res_update.status_code == 200
        updated_data = res_update.json()
        assert updated_data["document_type"] == "Income Certificate (Updated)"
        assert updated_data["file_name"] == "updated_income.png"

        # 5. Delete the document
        res_del = client.delete(f"/api/v1/documents/{doc_id}", headers=headers)
        assert res_del.status_code == 200
        assert res_del.json()["message"] == "Document deleted successfully"

        # 6. Verify deleted document is gone
        res_check = client.get(f"/api/v1/documents/{doc_id}/view", headers=headers)
        assert res_check.status_code == 404

    finally:
        db.close()
