from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api import deps
from app.core.security import get_password_hash, verify_password, create_access_token
from app.database.session import get_db
from app.models.user import User
from app.models.worker_profile import WorkerProfile
from app.models.notification import Notification
from app.schemas.user import UserCreate, UserLogin, UserOut, Token

router = APIRouter()

@router.post("/register", response_model=Token)
def register_worker(user_in: UserCreate, db: Session = Depends(get_db)) -> Any:
    # Check if user with this email already exists
    existing_user = db.query(User).filter(User.email == user_in.email.lower().strip()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please login instead."
        )

    if user_in.confirm_password and user_in.password != user_in.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password and confirmation password do not match."
        )

    # Create new User
    user = User(
        email=user_in.email.lower().strip(),
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name.strip(),
        phone=user_in.phone.strip() if user_in.phone else None,
        role="worker",
        is_active=True
    )
    db.add(user)
    db.flush()

    # Create initial Worker Profile
    profile = WorkerProfile(
        user_id=user.id,
        age=user_in.age,
        gender=user_in.gender,
        state=user_in.state,
        district=user_in.district,
        city=user_in.city,
        occupation=user_in.occupation
    )
    profile.calculate_completion()
    db.add(profile)

    # Welcome notification
    welcome_notif = Notification(
        user_id=user.id,
        title="Welcome to Informal Worker Welfare Portal!",
        message="Your account has been created. Please complete your profile to unlock personalized welfare scheme recommendations.",
        type="profile_reminder"
    )
    db.add(welcome_notif)

    db.commit()
    db.refresh(user)

    token = create_access_token(subject=user.id, role=user.role)
    return Token(access_token=token, token_type="bearer", user=UserOut.model_validate(user))

@router.post("/login", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)) -> Any:
    identifier = user_in.email.strip()
    identifier_lower = identifier.lower()

    # 1. Direct email lookup
    user = db.query(User).filter(User.email == identifier_lower).first()

    # 2. Administrator ID lookup (e.g., ADMIN-001, ADMIN, admin, welfare-admin)
    if not user and identifier_lower in ["admin", "admin-001", "admin001", "admin_001", "welfare-admin", "admin@welfare"]:
        user = db.query(User).filter(User.role == "admin").first()

    # 3. Worker phone lookup (e.g. 9876543210 or +91 98765 43210)
    if not user:
        clean_digits = "".join(c for c in identifier if c.isdigit())
        if len(clean_digits) >= 10:
            user = db.query(User).filter(User.phone.like(f"%{clean_digits[-10:]}%")).first()

    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Please verify your email / ID and password."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact welfare support."
        )

    token = create_access_token(subject=user.id, role=user.role)
    return Token(access_token=token, token_type="bearer", user=UserOut.model_validate(user))

@router.get("/me", response_model=UserOut)
def read_current_user(current_user: User = Depends(deps.get_current_user)) -> Any:
    return UserOut.model_validate(current_user)

@router.post("/logout")
def logout() -> Any:
    return {"message": "Logged out successfully."}
