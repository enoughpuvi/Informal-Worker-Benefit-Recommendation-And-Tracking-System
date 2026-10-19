from typing import Any, List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from app.api import deps
from app.database.session import get_db
from app.models.user import User
from app.models.issue_report import IssueReport, generate_ticket_number
from app.models.notification import Notification
from app.models.audit_log import AuditLog
from app.schemas.issue_report import (
    IssueReportCreate,
    IssueReportUpdateStatus,
    IssueReportOut
)

router = APIRouter()


@router.post("", response_model=IssueReportOut)
@router.post("/", response_model=IssueReportOut)
def submit_issue(
    issue_in: IssueReportCreate,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Submit a new grievance or issue report (Workers and Administrators)."""
    ticket_no = generate_ticket_number()
    # Ensure ticket_no uniqueness
    while db.query(IssueReport).filter(IssueReport.ticket_no == ticket_no).first():
        ticket_no = generate_ticket_number()

    issue = IssueReport(
        ticket_no=ticket_no,
        user_id=current_user.id,
        user_name=current_user.full_name,
        user_email=current_user.email,
        user_role=current_user.role,
        category=issue_in.category,
        priority=issue_in.priority or "Medium",
        subject=issue_in.subject.strip(),
        description=issue_in.description.strip(),
        related_application_no=issue_in.related_application_no.strip() if issue_in.related_application_no else None,
        status="Open"
    )
    db.add(issue)

    # In-app notification to the reporting user
    notification = Notification(
        user_id=current_user.id,
        title=f"Report Registered: {ticket_no}",
        message=f"Your issue regarding '{issue_in.subject}' has been submitted. Our support team is investigating.",
        type="issue_alert",
        related_id=ticket_no
    )
    db.add(notification)

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        user_name=current_user.full_name,
        action="ISSUE_REPORTED",
        entity="issue_report",
        entity_id=ticket_no,
        previous_value=None,
        new_value=f"{issue_in.category} [{issue_in.priority}]: {issue_in.subject}"
    )
    db.add(audit)

    db.commit()
    db.refresh(issue)
    return issue


@router.get("/my", response_model=List[IssueReportOut])
def get_my_issues(
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Retrieve all issues and reports submitted by the logged-in user."""
    issues = (
        db.query(IssueReport)
        .filter(IssueReport.user_id == current_user.id)
        .order_by(desc(IssueReport.created_at))
        .all()
    )
    return issues


@router.get("", response_model=List[IssueReportOut])
@router.get("/", response_model=List[IssueReportOut])
def get_all_issues_admin(
    status_filter: Optional[str] = Query(None, description="Filter by status (Open, In Progress, Resolved, Closed, all)"),
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search subject, ticket, worker name"),
    current_user: User = Depends(deps.get_current_active_admin),
    db: Session = Depends(get_db)
) -> Any:
    """Administrator access to view all submitted issues and grievances with search/filters."""
    query = db.query(IssueReport)

    if status_filter and status_filter.lower() != "all":
        query = query.filter(IssueReport.status.ilike(status_filter))

    if category and category.lower() != "all":
        query = query.filter(IssueReport.category == category)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                IssueReport.ticket_no.ilike(s),
                IssueReport.subject.ilike(s),
                IssueReport.user_name.ilike(s),
                IssueReport.user_email.ilike(s),
                IssueReport.description.ilike(s),
                IssueReport.related_application_no.ilike(s)
            )
        )

    return query.order_by(desc(IssueReport.created_at)).all()


@router.get("/{issue_id}", response_model=IssueReportOut)
def get_issue_detail(
    issue_id: int,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """View details of a specific issue report."""
    issue = db.query(IssueReport).filter(IssueReport.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue report not found.")

    if current_user.role != "admin" and issue.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this ticket.")

    return issue


@router.put("/{issue_id}/status", response_model=IssueReportOut)
def update_issue_status(
    issue_id: int,
    update_in: IssueReportUpdateStatus,
    current_user: User = Depends(deps.get_current_active_admin),
    db: Session = Depends(get_db)
) -> Any:
    """Administrator update for issue resolution status and remarks."""
    issue = db.query(IssueReport).filter(IssueReport.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue report not found.")

    old_status = issue.status
    issue.status = update_in.status
    if update_in.admin_response:
        issue.admin_response = update_in.admin_response.strip()
    issue.resolved_by = current_user.full_name
    issue.updated_at = datetime.now(timezone.utc)

    # In-app notification to the original reporter
    notification = Notification(
        user_id=issue.user_id,
        title=f"Ticket {issue.ticket_no} Updated: {issue.status}",
        message=f"Your issue '{issue.subject}' status was updated to {issue.status}. Note: {update_in.admin_response or 'Updated by administrative authority.'}",
        type="issue_alert",
        related_id=issue.ticket_no
    )
    db.add(notification)

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        user_name=current_user.full_name,
        action="ISSUE_STATUS_UPDATED",
        entity="issue_report",
        entity_id=issue.ticket_no,
        previous_value=old_status,
        new_value=f"Status: {issue.status} | Response: {update_in.admin_response or ''}"
    )
    db.add(audit)

    db.commit()
    db.refresh(issue)
    return issue
