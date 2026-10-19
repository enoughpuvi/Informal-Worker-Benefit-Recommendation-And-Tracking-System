from fastapi import APIRouter

from app.api.api_v1.endpoints import (
    auth,
    workers,
    schemes,
    dataset,
    recommendations,
    eligibility,
    applications,
    documents,
    notifications,
    admin,
    chatbot,
    issues,
    portals
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(workers.router, prefix="/workers", tags=["Workers & Profiles"])
api_router.include_router(schemes.router, prefix="/schemes", tags=["Welfare Schemes"])
api_router.include_router(dataset.router, prefix="/dataset", tags=["Dataset Management"])
api_router.include_router(recommendations.router, prefix="/recommendations", tags=["Explainable Recommendations"])
api_router.include_router(eligibility.router, prefix="/eligibility", tags=["Eligibility Checker"])
api_router.include_router(applications.router, prefix="/applications", tags=["Applications & Tracking"])
api_router.include_router(documents.router, prefix="/documents", tags=["Document Management"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["In-App Notifications"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin Operations & Analytics"])
api_router.include_router(chatbot.router, prefix="/chatbot", tags=["RAG Chatbot"])
api_router.include_router(issues.router, prefix="/issues", tags=["Issue & Grievance Reporting"])
api_router.include_router(portals.router, prefix="/portals", tags=["Trusted Government Portals"])

