from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    user_name = Column(String(255), nullable=True)
    action = Column(String(100), nullable=False)  # STATUS_CHANGE, DOCUMENT_VERIFY, SCHEME_CREATE, SCHEME_UPDATE, DATASET_IMPORT
    entity = Column(String(100), nullable=False)  # application, scheme, document, user
    entity_id = Column(String(100), nullable=True)
    previous_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationship
    user = relationship("User", back_populates="audit_logs")
