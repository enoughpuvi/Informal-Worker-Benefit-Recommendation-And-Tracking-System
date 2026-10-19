from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Text, DateTime
from sqlalchemy.orm import relationship
from app.database.session import Base

class Scheme(Base):
    __tablename__ = "schemes"

    scheme_id = Column(String(100), primary_key=True, index=True)
    scheme_name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=False)
    category = Column(String(100), nullable=False, index=True)  # Health, Pension, Insurance, Financial Assistance, etc.
    department = Column(String(255), nullable=True)
    government_level = Column(String(50), default="Central")  # Central, State
    state = Column(String(100), default="All India")  # "All India" or specific State name
    
    # Eligibility rules
    target_occupation = Column(Text, nullable=True, default="All")  # Comma-separated or JSON list
    minimum_age = Column(Integer, default=18)
    maximum_age = Column(Integer, default=60)
    income_limit = Column(Float, nullable=True)  # Monthly income limit in INR (e.g. 15000.0)
    gender = Column(String(50), default="All")  # All, Female, Male, Transgender
    education = Column(String(100), default="Any")  # Any, Primary, Secondary, etc.
    disability_eligibility = Column(String(50), default="Any")  # Any, Yes, No
    family_criteria = Column(Text, nullable=True)

    # Benefits & Requirements
    required_documents = Column(Text, nullable=True, default="[]")  # JSON list of document strings
    benefits = Column(Text, nullable=False)  # Description of benefit
    benefit_amount = Column(Float, nullable=True)  # If direct cash or lump sum
    application_process = Column(Text, nullable=True)
    official_url = Column(String(500), nullable=True)
    status = Column(String(50), default="active", index=True)  # active, inactive
    last_updated = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    applications = relationship("Application", back_populates="scheme", cascade="all, delete-orphan")
