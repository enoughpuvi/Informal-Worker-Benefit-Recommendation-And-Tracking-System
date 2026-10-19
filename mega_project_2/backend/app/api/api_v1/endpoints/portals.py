import copy
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api import deps
from app.models.user import User
from app.schemas.portal import PortalSchemeOut, TrustedPortalOut, VerificationReviewUpdate
from app.seed.trusted_portals_seed import PORTALS_DATA, PORTAL_SCHEMES_DATA

router = APIRouter()

# In-memory working store initialized with seed data
_PORTALS_STORE: List[dict] = copy.deepcopy(PORTALS_DATA)
_SCHEMES_STORE: List[dict] = copy.deepcopy(PORTAL_SCHEMES_DATA)


@router.get("", response_model=List[TrustedPortalOut])
def get_trusted_portals(
    level: Optional[str] = Query(None, description="Government level: Central or State"),
    state: Optional[str] = Query(None, description="State or UT name, or 'All India'"),
    category: Optional[str] = Query(None, description="Scheme category"),
    language: Optional[str] = Query(None, description="Supported language"),
    status: Optional[str] = Query(None, description="Verification status: Verified or Needs verification"),
    search: Optional[str] = Query(None, description="Keyword search query"),
):
    """
    Retrieve trusted government portals with comprehensive filtering by government level,
    state/UT, category, language, verification status, and keyword search.
    """
    results = _PORTALS_STORE

    if level and level != "All":
        results = [p for p in results if p.get("government_level", "").lower() == level.lower()]

    if state and state != "All States":
        state_lower = state.lower()
        results = [
            p for p in results
            if p.get("state", "").lower() == state_lower
            or (p.get("government_level") == "Central" and p.get("state", "").lower() == "all india")
        ]

    if category and category != "All":
        cat_lower = category.lower()
        results = [
            p for p in results
            if any(cat_lower in c.lower() for c in p.get("categories", []))
        ]

    if language and language != "All":
        lang_lower = language.lower()
        results = [
            p for p in results
            if any(lang_lower in l.lower() for l in p.get("supported_languages", []))
        ]

    if status and status != "All":
        results = [p for p in results if p.get("verification_status", "").lower() == status.lower()]

    if search:
        query = search.strip().lower()
        results = [
            p for p in results
            if query in p.get("name", "").lower()
            or query in p.get("hindi_name", "").lower()
            or query in p.get("description", "").lower()
            or query in p.get("responsible_department", "").lower()
            or query in p.get("state", "").lower()
            or any(query in c.lower() for c in p.get("categories", []))
        ]

    return results


@router.get("/schemes/directory", response_model=List[PortalSchemeOut])
def get_schemes_directory(
    category: Optional[str] = Query(None, description="Category filter"),
    state: Optional[str] = Query(None, description="State filter"),
    portal_id: Optional[str] = Query(None, description="Filter schemes linked to a specific portal"),
    search: Optional[str] = Query(None, description="Keyword search"),
):
    """
    Retrieve the linked government scheme directory containing verified official information URLs,
    direct application URLs, eligibility criteria, and required documents.
    """
    results = _SCHEMES_STORE

    if portal_id:
        results = [s for s in results if s.get("portal_id") == portal_id]

    if category and category != "All":
        cat_lower = category.lower()
        results = [s for s in results if cat_lower in s.get("category", "").lower()]

    if state and state != "All States":
        state_lower = state.lower()
        results = [
            s for s in results
            if s.get("state_applicability", "").lower() == state_lower
            or s.get("state_applicability", "").lower() == "all india"
        ]

    if search:
        query = search.strip().lower()
        results = [
            s for s in results
            if query in s.get("name", "").lower()
            or query in s.get("responsible_department", "").lower()
            or query in s.get("eligibility", "").lower()
            or query in s.get("benefits", "").lower()
            or query in s.get("target_occupation", "").lower()
        ]

    return results


@router.get("/{portal_id}", response_model=TrustedPortalOut)
def get_portal_by_id(portal_id: str):
    """
    Retrieve details for a single trusted government portal by ID.
    """
    portal = next((p for p in _PORTALS_STORE if p["id"] == portal_id), None)
    if not portal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Trusted government portal '{portal_id}' not found.",
        )
    return portal


@router.post("/{portal_id}/verify-review", response_model=TrustedPortalOut)
def record_verification_review(
    portal_id: str,
    update_data: VerificationReviewUpdate,
    current_user: User = Depends(deps.get_current_user),
):
    """
    Record an administrative verification review for a portal, updating its
    last_verified_date and status to ensure portal links and information remain accurate.
    """
    portal = next((p for p in _PORTALS_STORE if p["id"] == portal_id), None)
    if not portal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Trusted government portal '{portal_id}' not found.",
        )

    now_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    portal["last_verified_date"] = now_date
    if update_data.verification_status:
        portal["verification_status"] = update_data.verification_status
    if update_data.notes:
        existing_notes = portal.get("notes", "") or ""
        portal["notes"] = f"{existing_notes} [Reviewed by {current_user.email} on {now_date}: {update_data.notes}]".strip()

    return portal
