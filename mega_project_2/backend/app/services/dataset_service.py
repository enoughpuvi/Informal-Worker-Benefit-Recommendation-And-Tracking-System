import os
import uuid
import json
import pandas as pd
from typing import Dict, Any, List, Tuple
from sqlalchemy.orm import Session
from app.models.scheme import Scheme
from app.models.audit_log import AuditLog
from app.schemas.dataset import DatasetPreviewResponse, DatasetRowPreview, DatasetImportResponse

REQUIRED_COLUMNS = [
    "scheme_id",
    "scheme_name",
    "description",
    "category",
    "benefits"
]

OPTIONAL_COLUMNS = [
    "department",
    "government_level",
    "state",
    "target_occupation",
    "minimum_age",
    "maximum_age",
    "income_limit",
    "gender",
    "education",
    "disability_eligibility",
    "family_criteria",
    "required_documents",
    "benefit_amount",
    "application_process",
    "official_url",
    "status"
]

# In-memory preview cache for confirmation step
# token -> { "filename": str, "rows_data": List[dict], "update_ids": set, "new_ids": set }
PREVIEW_CACHE: Dict[str, Dict[str, Any]] = {}

def generate_sample_schemes_csv() -> str:
    columns = REQUIRED_COLUMNS + OPTIONAL_COLUMNS
    sample_rows = [
        {
            "scheme_id": "SCHEME-PMSYM-01",
            "scheme_name": "Pradhan Mantri Shram Yogi Maan-dhan (PM-SYM)",
            "description": "Voluntary and contributory pension scheme for unorganized workers to ensure old age financial protection.",
            "category": "Pension",
            "benefits": "Assured monthly pension of ₹3,000 after attaining the age of 60 years.",
            "department": "Ministry of Labour & Employment",
            "government_level": "Central",
            "state": "All India",
            "target_occupation": "Street Vendor, Domestic Worker, Construction Worker, Agricultural Laborer, Rickshaw Puller",
            "minimum_age": 18,
            "maximum_age": 40,
            "income_limit": 15000,
            "gender": "All",
            "education": "Any",
            "disability_eligibility": "Any",
            "family_criteria": "Not an existing member of EPFO/ESIC/NPS",
            "required_documents": '["Aadhaar Card", "Savings Bank Account / Jan Dhan Account Passbook"]',
            "benefit_amount": 3000,
            "application_process": "Enroll at nearest Common Service Centre (CSC) or online at maandhan.in",
            "official_url": "https://maandhan.in",
            "status": "active"
        },
        {
            "scheme_id": "SCHEME-PMJAY-02",
            "scheme_name": "Ayushman Bharat - PM Jan Arogya Yojana (PM-JAY)",
            "description": "World's largest government-funded health insurance scheme offering cashless treatment.",
            "category": "Health",
            "benefits": "Cashless hospitalization coverage up to ₹5,00,000 per family per year for secondary and tertiary care.",
            "department": "National Health Authority",
            "government_level": "Central",
            "state": "All India",
            "target_occupation": "All",
            "minimum_age": 0,
            "maximum_age": 100,
            "income_limit": 20000,
            "gender": "All",
            "education": "Any",
            "disability_eligibility": "Any",
            "family_criteria": "Identified by SECC 2011 deprivation criteria or state beneficiary database",
            "required_documents": '["Aadhaar Card", "Ration Card"]',
            "benefit_amount": 500000,
            "application_process": "Verify eligibility on mera.pmjay.gov.in and generate Golden Card at empaneled hospital",
            "official_url": "https://pmjay.gov.in",
            "status": "active"
        },
        {
            "scheme_id": "SCHEME-PMSVANIDHI-03",
            "scheme_name": "PM Street Vendor's AtmaNirbhar Nidhi (PM SVANidhi)",
            "description": "Special micro-credit facility providing collateral-free working capital loans for street vendors.",
            "category": "Financial Assistance",
            "benefits": "Collateral-free working capital loan starting at ₹10,000 with 7% interest subsidy on timely repayment.",
            "department": "Ministry of Housing and Urban Affairs",
            "government_level": "Central",
            "state": "All India",
            "target_occupation": "Street Vendor, Hawker, Thele-wala, Fruit/Vegetable Seller",
            "minimum_age": 18,
            "maximum_age": 65,
            "income_limit": 25000,
            "gender": "All",
            "education": "Any",
            "disability_eligibility": "Any",
            "family_criteria": "Urban street vendors vending on or before March 24, 2020",
            "required_documents": '["Aadhaar Card", "Vending Certificate / Urban Local Body ID Card", "Bank Account Details"]',
            "benefit_amount": 10000,
            "application_process": "Apply online at pmsvanidhi.mohua.gov.in or through Urban Local Bodies / CSC centers",
            "official_url": "https://pmsvanidhi.mohua.gov.in",
            "status": "active"
        }
    ]
    df = pd.DataFrame(sample_rows, columns=columns)
    return df.to_csv(index=False)

def parse_and_validate_dataset(file_path: str, db: Session) -> DatasetPreviewResponse:
    ext = os.path.splitext(file_path)[1].lower()
    filename = os.path.basename(file_path)

    if ext == ".csv":
        try:
            df = pd.read_csv(file_path, dtype=str)
        except Exception as e:
            raise ValueError(f"Could not read CSV file: {str(e)}")
    elif ext in [".xlsx", ".xls"]:
        try:
            df = pd.read_excel(file_path, dtype=str)
        except Exception as e:
            raise ValueError(f"Could not read Excel file: {str(e)}")
    else:
        raise ValueError(f"Unsupported file format '{ext}'. Only CSV and Excel (.xlsx, .xls) files are supported.")

    # Normalize column names: strip whitespace, lower
    df.columns = [c.strip().lower() for c in df.columns]

    # Intelligent column mapping for open government data exports
    alias_map = {
        "slug": "scheme_id",
        "scheme": "scheme_name",
        "title": "scheme_name",
        "level": "government_level",
        "benefit_type": "benefits",
        "benefit": "benefits",
        "desc": "description",
        "details": "description"
    }
    for old_col, new_col in alias_map.items():
        if old_col in df.columns and new_col not in df.columns:
            df[new_col] = df[old_col]

    # Smart auto-fill for descriptions, categories, occupations if omitted in portal dataset
    if "description" not in df.columns:
        df["description"] = df.apply(
            lambda r: f"{r.get('scheme_name', '')} is a {r.get('government_level', 'government')} welfare initiative administered by {r.get('department', r.get('ministry', 'the Government'))} for {r.get('target_beneficiaries', r.get('beneficiary_type', 'eligible citizens'))}.",
            axis=1
        )

    if "benefits" not in df.columns:
        df["benefits"] = df.apply(
            lambda r: f"Provides {r.get('benefits', 'welfare')} assistance and social protection under {r.get('scheme_name', '')}.",
            axis=1
        )

    if "category" not in df.columns:
        def _infer_cat(r):
            txt = (str(r.get("scheme_name", "")) + " " + str(r.get("department", ""))).lower()
            if any(w in txt for w in ["pension", "old age", "vridha", "senior citizen"]):
                return "Pension"
            if any(w in txt for w in ["health", "arogya", "medical", "hospital", "disease", "cancer", "ayush"]):
                return "Healthcare"
            if any(w in txt for w in ["insurance", "bima", "suraksha", "accident"]):
                return "Insurance"
            if any(w in txt for w in ["scholarship", "education", "shiksha", "fellowship", "student", "school", "college"]):
                return "Education"
            if any(w in txt for w in ["housing", "awas", "ghar", "shelter"]):
                return "Housing"
            if any(w in txt for w in ["farmer", "agriculture", "kisan", "krishi", "crop", "seed", "horticulture", "pashu"]):
                return "Agriculture"
            if any(w in txt for w in ["skill", "training", "kaushal", "employment", "rojgar"]):
                return "Skill Development"
            if any(w in txt for w in ["women", "mahila", "girl", "kanya", "beti", "widow", "maternity", "prasuti"]):
                return "Women & Child"
            if any(w in txt for w in ["artisan", "craft", "weaver", "bunkar", "handicraft", "handloom"]):
                return "Artisans & Crafts"
            if any(w in txt for w in ["loan", "subsidy", "credit", "grant", "financial"]):
                return "Financial Assistance"
            return "Social Welfare"
        df["category"] = df.apply(_infer_cat, axis=1)

    if "target_occupation" not in df.columns:
        def _infer_occ(r):
            txt = (str(r.get("scheme_name", "")) + " " + str(r.get("department", "")) + " " + str(r.get("target_beneficiaries", ""))).lower()
            if any(w in txt for w in ["construction", "bocw", "nirman", "building"]):
                return "Construction Worker"
            if any(w in txt for w in ["street vendor", "vendor", "hawker", "rehri", "thele"]):
                return "Street Vendor"
            if any(w in txt for w in ["domestic", "gharelu"]):
                return "Domestic Helper"
            if any(w in txt for w in ["auto", "rickshaw", "driver", "transport"]):
                return "Auto-Rickshaw Driver"
            if any(w in txt for w in ["farmer", "kisan", "krishi", "agriculture", "crop", "pashu"]):
                return "Agricultural Laborer"
            if any(w in txt for w in ["artisan", "craft", "weaver", "bunkar", "handicraft", "handloom", "pottery"]):
                return "Artisan / Handicrafts"
            if any(w in txt for w in ["fisher", "matsya", "aquaculture"]):
                return "Fishery Worker"
            if any(w in txt for w in ["sanitation", "safai", "scavenger"]):
                return "Sanitation Worker"
            if any(w in txt for w in ["carpenter"]):
                return "Carpenter"
            return "All"
        df["target_occupation"] = df.apply(_infer_occ, axis=1)

    missing_required = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing_required:
        return DatasetPreviewResponse(
            filename=filename,
            total_rows=len(df),
            valid_count=0,
            invalid_count=len(df),
            duplicate_count=0,
            update_count=0,
            new_count=0,
            columns_found=list(df.columns),
            missing_required_columns=missing_required,
            rows=[],
            is_valid_for_import=False,
            import_token=""
        )

    # Existing IDs in DB
    existing_db_schemes = {s.scheme_id: s for s in db.query(Scheme).all()}
    
    seen_ids_in_file = set()
    preview_rows: List[DatasetRowPreview] = []
    cleaned_records: List[dict] = []
    
    valid_count = 0
    invalid_count = 0
    duplicate_count = 0
    update_count = 0
    new_count = 0

    for idx, raw_row in df.iterrows():
        row = raw_row.to_dict()
        errors = []
        row_num = idx + 1

        scheme_id = str(row.get("scheme_id", "") or "").strip()
        scheme_name = str(row.get("scheme_name", "") or "").strip()
        category = str(row.get("category", "") or "").strip()
        description = str(row.get("description", "") or "").strip()
        benefits = str(row.get("benefits", "") or "").strip()

        # Check required
        if not scheme_id:
            errors.append("scheme_id is missing or blank")
        if not scheme_name:
            errors.append("scheme_name is missing or blank")
        if not category:
            errors.append("category is missing or blank")
        if not description:
            errors.append("description is missing or blank")
        if not benefits:
            errors.append("benefits description is missing or blank")

        # Type conversion & validation
        min_age = 18
        max_age = 60
        income_limit = None
        benefit_amount = None

        if "minimum_age" in row and pd.notna(row["minimum_age"]) and str(row["minimum_age"]).strip():
            try:
                min_age = int(float(str(row["minimum_age"]).strip()))
            except ValueError:
                errors.append(f"minimum_age '{row['minimum_age']}' is not a valid number")

        if "maximum_age" in row and pd.notna(row["maximum_age"]) and str(row["maximum_age"]).strip():
            try:
                max_age = int(float(str(row["maximum_age"]).strip()))
            except ValueError:
                errors.append(f"maximum_age '{row['maximum_age']}' is not a valid number")

        if "income_limit" in row and pd.notna(row["income_limit"]) and str(row["income_limit"]).strip():
            try:
                income_limit = float(str(row["income_limit"]).strip().replace(",", ""))
            except ValueError:
                errors.append(f"income_limit '{row['income_limit']}' is not a valid numeric amount")

        if "benefit_amount" in row and pd.notna(row["benefit_amount"]) and str(row["benefit_amount"]).strip():
            try:
                benefit_amount = float(str(row["benefit_amount"]).strip().replace(",", ""))
            except ValueError:
                pass  # Optional

        # Check file duplicate
        status = "VALID"
        if scheme_id in seen_ids_in_file:
            errors.append(f"Duplicate scheme_id '{scheme_id}' encountered inside the file")
            status = "DUPLICATE_IN_FILE"
            duplicate_count += 1
        elif errors:
            status = "INVALID"
            invalid_count += 1
        else:
            seen_ids_in_file.add(scheme_id)
            if scheme_id in existing_db_schemes:
                status = "EXISTS_WILL_UPDATE"
                update_count += 1
                valid_count += 1
            else:
                status = "NEW"
                new_count += 1
                valid_count += 1

        cleaned_data = {
            "scheme_id": scheme_id,
            "scheme_name": scheme_name,
            "description": description,
            "category": category,
            "department": str(row.get("department", "") or "").strip() or None,
            "government_level": str(row.get("government_level", "Central") or "Central").strip(),
            "state": str(row.get("state", "All India") or "All India").strip(),
            "target_occupation": str(row.get("target_occupation", "All") or "All").strip(),
            "minimum_age": min_age,
            "maximum_age": max_age,
            "income_limit": income_limit,
            "gender": str(row.get("gender", "All") or "All").strip(),
            "education": str(row.get("education", "Any") or "Any").strip(),
            "disability_eligibility": str(row.get("disability_eligibility", "Any") or "Any").strip(),
            "family_criteria": str(row.get("family_criteria", "") or "").strip() or None,
            "required_documents": str(row.get("required_documents", "[]") or "[]").strip(),
            "benefits": benefits,
            "benefit_amount": benefit_amount,
            "application_process": str(row.get("application_process", "") or "").strip() or None,
            "official_url": str(row.get("official_url", "") or "").strip() or None,
            "status": str(row.get("status", "active") or "active").strip().lower()
        }

        # Keep JSON document formatting clean
        if cleaned_data["required_documents"] and not cleaned_data["required_documents"].startswith("["):
            # Turn comma string to json list
            docs = [d.strip() for d in cleaned_data["required_documents"].split(",") if d.strip()]
            cleaned_data["required_documents"] = json.dumps(docs)

        cleaned_records.append(cleaned_data)

        preview_rows.append(
            DatasetRowPreview(
                row_index=row_num,
                scheme_id=scheme_id or f"ROW-{row_num}",
                scheme_name=scheme_name or "(Missing Name)",
                category=category or "(Missing Category)",
                target_occupation=cleaned_data["target_occupation"],
                income_limit=f"₹{int(income_limit):,}" if income_limit else "None",
                age_range=f"{min_age} - {max_age} yrs",
                status=status,
                errors=errors,
                data=cleaned_data
            )
        )

    token = str(uuid.uuid4())
    PREVIEW_CACHE[token] = {
        "filename": filename,
        "records": cleaned_records,
        "preview_rows": preview_rows
    }

    return DatasetPreviewResponse(
        filename=filename,
        total_rows=len(df),
        valid_count=valid_count,
        invalid_count=invalid_count,
        duplicate_count=duplicate_count,
        update_count=update_count,
        new_count=new_count,
        columns_found=list(df.columns),
        missing_required_columns=[],
        rows=preview_rows[:50],  # Return first 50 rows for preview
        is_valid_for_import=valid_count > 0,
        import_token=token
    )

def execute_dataset_import(
    token: str,
    db: Session,
    admin_user_id: int,
    admin_user_name: str,
    overwrite_existing: bool = True
) -> DatasetImportResponse:
    cache = PREVIEW_CACHE.get(token)
    if not cache:
        raise ValueError("Invalid or expired import token. Please upload and preview the dataset again.")

    records = cache["records"]
    created_count = 0
    updated_count = 0
    skipped_count = 0
    errors = []

    for record in records:
        scheme_id = record.get("scheme_id")
        if not scheme_id or not record.get("scheme_name") or not record.get("category"):
            skipped_count += 1
            continue

        existing = db.query(Scheme).filter(Scheme.scheme_id == scheme_id).first()
        if existing:
            if overwrite_existing:
                for k, v in record.items():
                    setattr(existing, k, v)
                updated_count += 1
            else:
                skipped_count += 1
        else:
            new_scheme = Scheme(**record)
            db.add(new_scheme)
            created_count += 1

    # Record Audit Log
    audit = AuditLog(
        user_id=admin_user_id,
        user_name=admin_user_name,
        action="DATASET_IMPORT",
        entity="scheme",
        entity_id=cache["filename"],
        previous_value="",
        new_value=f"Created {created_count}, Updated {updated_count}, Skipped {skipped_count}"
    )
    db.add(audit)

    db.commit()
    del PREVIEW_CACHE[token]

    return DatasetImportResponse(
        message=f"Dataset '{cache['filename']}' imported successfully into the database.",
        total_processed=len(records),
        created_count=created_count,
        updated_count=updated_count,
        skipped_count=skipped_count,
        errors=errors
    )
