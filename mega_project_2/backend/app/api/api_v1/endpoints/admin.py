import io
import csv
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from app.api import deps
from app.database.session import get_db
from app.models.user import User
from app.models.worker_profile import WorkerProfile
from app.models.scheme import Scheme
from app.models.application import Application
from app.models.audit_log import AuditLog
from app.schemas.admin import AdminAnalyticsOut, AuditLogOut
from app.services.analytics_service import calculate_admin_analytics

router = APIRouter()

@router.get("/analytics", response_model=AdminAnalyticsOut)
def get_analytics(
    current_admin: User = Depends(deps.get_current_active_admin),
    db: Session = Depends(get_db)
) -> Any:
    return calculate_admin_analytics(db)

@router.get("/workers")
def list_workers(
    occupation: Optional[str] = None,
    state: Optional[str] = None,
    search: Optional[str] = None,
    current_admin: User = Depends(deps.get_current_active_admin),
    db: Session = Depends(get_db)
) -> Any:
    query = db.query(User).filter(User.role == "worker")

    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                User.full_name.ilike(term),
                User.email.ilike(term),
                User.phone.ilike(term)
            )
        )

    users = query.order_by(desc(User.created_at)).all()
    results = []
    for u in users:
        p = u.profile
        if occupation and p and occupation.lower() not in (p.occupation or "").lower():
            continue
        if state and p and state.lower() not in (p.state or "").lower():
            continue

        results.append({
            "id": u.id,
            "full_name": u.full_name,
            "email": u.email,
            "phone": u.phone,
            "is_active": u.is_active,
            "created_at": u.created_at.isoformat() if u.created_at else None,
            "occupation": p.occupation if p else None,
            "monthly_income": p.monthly_income if p else 0,
            "state": p.state if p else None,
            "district": p.district if p else None,
            "profile_completion": p.profile_completion if p else 0,
            "applications_count": len(u.applications)
        })

    return results

@router.get("/reports/export-csv")
def export_report_csv(
    report_type: str = Query(..., pattern="^(workers|applications|schemes)$"),
    token: Optional[str] = Query(None),
    current_admin: User = Depends(deps.get_current_active_admin_allow_query_token),
    db: Session = Depends(get_db)
) -> Any:
    output = io.StringIO()
    writer = csv.writer(output)

    if report_type == "workers":
        writer.writerow(["Worker ID", "Name", "Email", "Phone", "Occupation", "Monthly Income", "State", "Profile Completion %", "Created At"])
        users = db.query(User).filter(User.role == "worker").all()
        for u in users:
            p = u.profile
            writer.writerow([
                u.id,
                u.full_name,
                u.email,
                u.phone or "",
                p.occupation if p else "",
                p.monthly_income if p else 0,
                p.state if p else "",
                f"{p.profile_completion}%" if p else "0%",
                u.created_at.strftime("%Y-%m-%d %H:%M") if u.created_at else ""
            ])
        filename = "workers_welfare_report.csv"

    elif report_type == "applications":
        writer.writerow(["Application No", "Worker Name", "Worker Phone", "Scheme ID", "Scheme Name", "Status", "Applied Date", "Benefit Amount", "Admin Remarks"])
        apps = db.query(Application).all()
        for a in apps:
            writer.writerow([
                a.application_no,
                a.worker.full_name if a.worker else "",
                a.worker.phone if a.worker else "",
                a.scheme_id,
                a.scheme.scheme_name if a.scheme else "",
                a.current_status,
                a.application_date.strftime("%Y-%m-%d %H:%M") if a.application_date else "",
                f"₹{a.benefit_amount:,.2f}" if a.benefit_amount else "N/A",
                a.admin_remarks or ""
            ])
        filename = "welfare_applications_report.csv"

    else:  # schemes
        writer.writerow(["Scheme ID", "Scheme Name", "Category", "Department", "Government Level", "State", "Target Occupation", "Income Limit", "Benefits", "Status"])
        schemes = db.query(Scheme).all()
        for s in schemes:
            writer.writerow([
                s.scheme_id,
                s.scheme_name,
                s.category,
                s.department or "",
                s.government_level,
                s.state,
                s.target_occupation or "All",
                f"₹{s.income_limit:,.2f}" if s.income_limit else "None",
                s.benefits,
                s.status
            ])
        filename = "schemes_catalog_report.csv"

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/audit-logs", response_model=List[AuditLogOut])
def get_audit_logs(
    limit: int = 100,
    current_admin: User = Depends(deps.get_current_active_admin),
    db: Session = Depends(get_db)
) -> Any:
    logs = db.query(AuditLog).order_by(desc(AuditLog.timestamp)).limit(limit).all()
    return [AuditLogOut.model_validate(l) for l in logs]
