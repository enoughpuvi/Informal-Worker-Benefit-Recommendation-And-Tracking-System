from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base

class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    application_no = Column(String(100), unique=True, index=True, nullable=False)
    worker_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    scheme_id = Column(String(100), ForeignKey("schemes.scheme_id", ondelete="CASCADE"), nullable=False, index=True)
    
    application_date = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    current_status = Column(String(50), default="APPLIED", nullable=False, index=True)
    # Valid Statuses: DRAFT, APPLIED, DOCUMENTS_PENDING, DOCUMENTS_VERIFIED, UNDER_REVIEW, APPROVED, BENEFIT_DISBURSED, REJECTED
    
    benefit_amount = Column(Float, nullable=True)
    benefit_disbursed_date = Column(DateTime(timezone=True), nullable=True)
    assigned_admin_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    admin_remarks = Column(Text, nullable=True)
    last_updated = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    worker = relationship("User", back_populates="applications", foreign_keys=[worker_id])
    scheme = relationship("Scheme", back_populates="applications")
    assigned_admin = relationship("User", foreign_keys=[assigned_admin_id])
    status_history = relationship("ApplicationStatusHistory", back_populates="application", cascade="all, delete-orphan", order_by="ApplicationStatusHistory.timestamp.asc()")
    documents = relationship("ApplicationDocument", back_populates="application", cascade="all, delete-orphan")
