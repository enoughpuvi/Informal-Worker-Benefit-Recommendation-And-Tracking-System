from typing import Any, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api import deps
from app.database.session import get_db
from app.models.user import User
from app.models.worker_profile import WorkerProfile
from app.services.rag_service import rag_service

router = APIRouter()

class ChatQueryRequest(BaseModel):
    query: str

class ChatQueryResponse(BaseModel):
    answer: str
    retrieved_schemes: list
    model: str

@router.post("/query", response_model=ChatQueryResponse)
def query_chatbot(
    chat_req: ChatQueryRequest,
    current_user: Optional[User] = Depends(deps.get_optional_current_user),
    db: Session = Depends(get_db)
) -> Any:
    user_context = None
    if current_user and current_user.role == "worker":
        profile = db.query(WorkerProfile).filter(WorkerProfile.user_id == current_user.id).first()
        if profile:
            user_context = {
                "occupation": profile.occupation,
                "age": profile.age,
                "monthly_income": profile.monthly_income,
                "state": profile.state
            }

    result = rag_service.answer_query(
        query=chat_req.query,
        db=db,
        user_context=user_context
    )
    return ChatQueryResponse(
        answer=result["answer"],
        retrieved_schemes=result["retrieved_schemes"],
        model=result["model"]
    )
