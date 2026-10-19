from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class UserBase(BaseModel):
    email: str
    full_name: str
    phone: Optional[str] = None
    role: str = "worker"

class UserCreate(BaseModel):
    email: str
    full_name: str
    phone: Optional[str] = None
    password: str = Field(..., min_length=6)
    confirm_password: Optional[str] = None
    role: str = "worker"
    # Optional initial profile fields on registration
    age: Optional[int] = None
    gender: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    city: Optional[str] = None
    occupation: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None

class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    phone: Optional[str] = None
    role: str
    is_active: bool
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
