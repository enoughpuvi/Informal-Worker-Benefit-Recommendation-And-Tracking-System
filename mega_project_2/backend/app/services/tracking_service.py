from datetime import datetime, timezone
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.models.application import Application
from app.models.application_history import ApplicationStatusHistory
from app.models.notification import Notification
from app.models.audit_log import AuditLog
from app.models.user import User

VALID_STATUSES = [
    "DRAFT",
    "APPLIED",
    "DOCUMENTS_PENDING",
    "DOCUMENTS_VERIFIED",
    "UNDER_REVIEW",
    "APPROVED",
    "BENEFIT_DISBURSED",
    "REJECTED"
]

# Allowed next transitions from any given status
ALLOWED_TRANSITIONS = {
    "DRAFT": ["APPLIED"],
    "APPLIED": ["DOCUMENTS_PENDING", "DOCUMENTS_VERIFIED", "UNDER_REVIEW", "REJECTED"],
    "DOCUMENTS_PENDING": ["DOCUMENTS_VERIFIED", "UNDER_REVIEW", "REJECTED"],
    "DOCUMENTS_VERIFIED": ["UNDER_REVIEW", "APPROVED", "REJECTED"],
    "UNDER_REVIEW": ["APPROVED", "REJECTED", "DOCUMENTS_PENDING"],
    "APPROVED": ["BENEFIT_DISBURSED"],
    "BENEFIT_DISBURSED": [],  # Terminal
    "REJECTED": ["UNDER_REVIEW"]  # Allow reopening on appeal if needed
}

def validate_transition(current_status: str, new_status: str) -> Tuple[bool, str]:
    if new_status not in VALID_STATUSES:
        return False, f"Invalid status '{new_status}'. Allowed statuses: {', '.join(VALID_STATUSES)}"
    
    if current_status == new_status:
        return False, f"Application is already in status '{current_status}'"

    allowed = ALLOWED_TRANSITIONS.get(current_status, [])
    if new_status not in allowed:
        return False, f"Cannot transition from '{current_status}' to '{new_status}'. Allowed transitions: {', '.join(allowed) if allowed else 'None (Terminal state)'}"
    
    return True, ""

def update_application_status(
    db: Session,
    application: Application,
    new_status: str,
    changed_by: User,
    remarks: str = None,
    benefit_amount: float = None
) -> Application:
    valid, err_msg = validate_transition(application.current_status, new_status)
    if not valid:
        raise ValueError(err_msg)

    if new_status == "REJECTED" and not (remarks and remarks.strip()):
        raise ValueError("Rejection requires an administrative remark/reason.")

    prev_status = application.current_status
    application.current_status = new_status
    application.admin_remarks = remarks or application.admin_remarks
    application.last_updated = datetime.now(timezone.utc)
    
    if new_status == "BENEFIT_DISBURSED":
        application.benefit_disbursed_date = datetime.now(timezone.utc)
        if benefit_amount is not None:
            application.benefit_amount = benefit_amount
    elif benefit_amount is not None:
        application.benefit_amount = benefit_amount

    # Add History record
    history = ApplicationStatusHistory(
        application_id=application.id,
        previous_status=prev_status,
        new_status=new_status,
        changed_by_id=changed_by.id,
        changed_by_name=changed_by.full_name,
        timestamp=datetime.now(timezone.utc),
        remarks=remarks
    )
    db.add(history)

    # Add Notification to worker
    notif_msg = f"Your application {application.application_no} for scheme '{application.scheme.scheme_name if application.scheme else application.scheme_id}' status updated to {new_status.replace('_', ' ').title()}."
    if remarks:
        notif_msg += f" Note: {remarks}"

    notif = Notification(
        user_id=application.worker_id,
        title=f"Application Status: {new_status.replace('_', ' ').title()}",
        message=notif_msg,
        type="application_status",
        related_id=application.application_no
    )
    db.add(notif)

    # Add Audit log
    audit = AuditLog(
        user_id=changed_by.id,
        user_name=changed_by.full_name,
        action="APPLICATION_STATUS_UPDATE",
        entity="application",
        entity_id=application.application_no,
        previous_value=prev_status,
        new_value=new_status
    )
    db.add(audit)

    db.commit()
    db.refresh(application)
    return application

def get_application_timeline(application: Application) -> List[Dict[str, Any]]:
    # Linear standard pipeline stages
    PIPELINE_STAGES = [
        {"id": "APPLIED", "label": "Application Submitted", "desc": "Worker submitted the application"},
        {"id": "DOCUMENTS_VERIFIED", "label": "Documents Verified", "desc": "All uploaded documents checked"},
        {"id": "UNDER_REVIEW", "label": "Under Review", "desc": "Application reviewed by welfare officer"},
        {"id": "APPROVED", "label": "Application Approved", "desc": "Eligibility confirmed and approved"},
        {"id": "BENEFIT_DISBURSED", "label": "Benefit Disbursed", "desc": "Welfare benefit transferred"}
    ]
    
    current_status = application.current_status
    history_by_status = {}
    for h in application.status_history:
        history_by_status[h.new_status] = h

    timeline = []
    
    if current_status == "REJECTED":
        # Special terminal display for rejection
        for stage in PIPELINE_STAGES:
            stage_id = stage["id"]
            h = history_by_status.get(stage_id)
            if h:
                timeline.append({
                    "stage_id": stage_id,
                    "title": stage["label"],
                    "description": stage["desc"],
                    "state": "COMPLETED",
                    "timestamp": h.timestamp.isoformat(),
                    "admin_remarks": h.remarks
                })
            else:
                break
        
        rej_h = history_by_status.get("REJECTED")
        timeline.append({
            "stage_id": "REJECTED",
            "title": "Application Rejected",
            "description": rej_h.remarks if rej_h and rej_h.remarks else "Application does not meet required criteria",
            "state": "REJECTED",
            "timestamp": rej_h.timestamp.isoformat() if rej_h else None,
            "admin_remarks": rej_h.remarks if rej_h else application.admin_remarks
        })
        return timeline

    stage_order = [s["id"] for s in PIPELINE_STAGES]
    
    # Map intermediate states:
    effective_current = current_status
    if current_status == "DOCUMENTS_PENDING":
        effective_current = "APPLIED"
    elif current_status == "DRAFT":
        effective_current = "DRAFT"

    current_idx = -1
    for i, s in enumerate(stage_order):
        if s == effective_current:
            current_idx = i
            break

    for i, stage in enumerate(PIPELINE_STAGES):
        stage_id = stage["id"]
        h = history_by_status.get(stage_id)
        
        if i < current_idx:
            state = "COMPLETED"
        elif i == current_idx:
            state = "CURRENT"
        else:
            state = "PENDING"

        timeline.append({
            "stage_id": stage_id,
            "title": stage["label"],
            "description": stage["desc"],
            "state": state,
            "timestamp": h.timestamp.isoformat() if h else None,
            "admin_remarks": h.remarks if h else None
        })

    return timeline
