from datetime import datetime, timezone
import random
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base


def generate_ticket_number() -> str:
    rand = random.randint(100000, 999999)
    return f"TKT-2026-{rand}"


class IssueReport(Base):
    __tablename__ = "issue_reports"

    id = Column(Integer, primary_key=True, index=True)
    ticket_no = Column(String(50), unique=True, index=True, default=generate_ticket_number)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    user_name = Column(String(255), nullable=False)
    user_email = Column(String(255), nullable=False)
    user_role = Column(String(50), nullable=False, default="worker")  # 'worker' or 'admin'
    
    category = Column(String(100), nullable=False)  # 'Technical / Bug', 'Document Verification', 'Scheme Application', 'Disbursement / Benefit', 'Profile & Login', 'Other'
    priority = Column(String(50), default="Medium")  # 'Low', 'Medium', 'High', 'Urgent'
    subject = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    related_application_no = Column(String(100), nullable=True)
    
    status = Column(String(50), default="Open")  # 'Open', 'In Progress', 'Resolved', 'Closed'
    admin_response = Column(Text, nullable=True)
    resolved_by = Column(String(255), nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="issues")
