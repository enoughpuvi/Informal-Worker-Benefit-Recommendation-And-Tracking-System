from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base

class ApplicationDocument(Base):
    __tablename__ = "application_documents"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"), nullable=True, index=True)
    worker_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    document_type = Column(String(100), nullable=False)  # Identity Proof, Income Certificate, Ration Card, etc.
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, default=0)
    upload_date = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    status = Column(String(50), default="Uploaded", nullable=False)  # Uploaded, Under Verification, Verified, Rejected
    admin_remarks = Column(Text, nullable=True)
    verified_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    application = relationship("Application", back_populates="documents")
    worker = relationship("User", foreign_keys=[worker_id])
    verified_by = relationship("User", foreign_keys=[verified_by_id])

    @property
    def application_no(self):
        return self.application.application_no if self.application else None

    @property
    def scheme_name(self):
        if self.application and self.application.scheme:
            return self.application.scheme.scheme_name
        return None

