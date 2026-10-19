from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base

class ApplicationStatusHistory(Base):
    __tablename__ = "application_status_history"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    previous_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=False)
    changed_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    changed_by_name = Column(String(255), nullable=True)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    remarks = Column(Text, nullable=True)

    # Relationships
    application = relationship("Application", back_populates="status_history")
    changed_by = relationship("User")
