from typing import List, Optional, Any, Dict
from pydantic import BaseModel

class DatasetRowPreview(BaseModel):
    row_index: int
    scheme_id: str
    scheme_name: str
    category: str
    target_occupation: str
    income_limit: Optional[str] = None
    age_range: str
    status: str  # "VALID", "INVALID", "DUPLICATE_IN_FILE", "EXISTS_WILL_UPDATE", "NEW"
    errors: List[str] = []
    data: Dict[str, Any]

class DatasetPreviewResponse(BaseModel):
    filename: str
    total_rows: int
    valid_count: int
    invalid_count: int
    duplicate_count: int
    update_count: int
    new_count: int
    columns_found: List[str]
    missing_required_columns: List[str] = []
    rows: List[DatasetRowPreview]
    is_valid_for_import: bool
    import_token: str  # Cache or token to safely confirm and proceed

class DatasetImportRequest(BaseModel):
    import_token: str
    overwrite_existing: bool = True

class DatasetImportResponse(BaseModel):
    message: str
    total_processed: int
    created_count: int
    updated_count: int
    skipped_count: int
    errors: List[str] = []
