import os
import shutil
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response, status
from sqlalchemy.orm import Session

from app.api import deps
from app.core.config import settings
from app.database.session import get_db
from app.models.user import User
from app.schemas.dataset import DatasetPreviewResponse, DatasetImportRequest, DatasetImportResponse
from app.services.dataset_service import parse_and_validate_dataset, execute_dataset_import, generate_sample_schemes_csv
from app.services.rag_service import rag_service

router = APIRouter()

@router.post("/upload-preview", response_model=DatasetPreviewResponse)
async def upload_scheme_dataset_preview(
    file: UploadFile = File(...),
    current_admin: User = Depends(deps.get_current_active_admin),
    db: Session = Depends(get_db)
) -> Any:
    filename = file.filename or "dataset.csv"
    ext = os.path.splitext(filename)[1].lower()

    if ext not in [".csv", ".xlsx", ".xls"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension '{ext}'. Only .csv, .xlsx, and .xls are supported."
        )

    temp_path = os.path.join(settings.UPLOAD_PATH, f"temp_{filename}")
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        preview_result = parse_and_validate_dataset(temp_path, db)
        return preview_result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Dataset processing error: {str(e)}"
        )
    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass

@router.post("/confirm-import", response_model=DatasetImportResponse)
def confirm_scheme_dataset_import(
    request_in: DatasetImportRequest,
    current_admin: User = Depends(deps.get_current_active_admin),
    db: Session = Depends(get_db)
) -> Any:
    try:
        res = execute_dataset_import(
            token=request_in.import_token,
            db=db,
            admin_user_id=current_admin.id,
            admin_user_name=current_admin.full_name,
            overwrite_existing=request_in.overwrite_existing
        )

        # Dynamic Recommendation + RAG Auto-sync
        # Refresh RAG vector/TF-IDF matrix immediately!
        rag_service.index_schemes(db)

        return res
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Import failed: {str(e)}")

@router.get("/template-csv")
def download_sample_csv_template() -> Any:
    csv_content = generate_sample_schemes_csv()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=government_schemes_template.csv"
        }
    )
