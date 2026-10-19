from sqlalchemy import Column, Integer, String, Float, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base

class WorkerProfile(Base):
    __tablename__ = "worker_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    
    # Personal & Location
    date_of_birth = Column(String(50), nullable=True)
    age = Column(Integer, nullable=True)
    gender = Column(String(50), nullable=True)  # Male, Female, Other
    address = Column(Text, nullable=True)
    state = Column(String(100), nullable=True)
    district = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    pincode = Column(String(20), nullable=True)

    # Employment Details
    occupation = Column(String(150), nullable=True)
    employment_type = Column(String(100), nullable=True)  # Daily Wage, Piece-rate, Contract, Self-Employed, Part-Time
    experience_years = Column(Integer, default=0)
    employer_status = Column(String(100), nullable=True)  # Unorganized, Contractor, Self-Employed
    monthly_income = Column(Float, default=0.0)
    working_days_month = Column(Integer, default=25)

    # Family Details
    marital_status = Column(String(50), nullable=True)
    family_members = Column(Integer, default=1)
    dependents_count = Column(Integer, default=0)
    children_count = Column(Integer, default=0)
    elderly_count = Column(Integer, default=0)

    # Additional & Vulnerability
    education_level = Column(String(100), nullable=True)  # No Formal Education, Primary, Middle, Secondary, Higher Secondary, Graduate
    disability_status = Column(Boolean, default=False)
    disability_type = Column(String(150), nullable=True)
    existing_benefits = Column(Text, nullable=True, default="[]")  # JSON encoded list of strings
    bank_account = Column(Boolean, default=True)
    identity_proof_type = Column(String(100), nullable=True)  # Aadhaar, Voter ID, Ration Card, e-Shram Card

    profile_completion = Column(Integer, default=20)  # Calculated percentage

    # Relationship
    user = relationship("User", back_populates="profile")

    def calculate_completion(self) -> int:
        fields = [
            self.date_of_birth or self.age,
            self.gender,
            self.state,
            self.district or self.city,
            self.occupation,
            self.employment_type,
            self.monthly_income is not None and self.monthly_income > 0,
            self.marital_status,
            self.family_members,
            self.education_level,
            self.identity_proof_type,
            self.bank_account is not None
        ]
        filled = sum(1 for f in fields if f)
        pct = int((filled / len(fields)) * 100)
        self.profile_completion = pct
        return pct
