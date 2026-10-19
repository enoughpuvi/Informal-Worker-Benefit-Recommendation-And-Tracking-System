import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from pathlib import Path

from app.core.config import settings, BASE_DIR
from app.database.session import engine, Base, SessionLocal
from app.api.api_v1.api import api_router
from app.seed.seed_data import seed_database
from app.services.rag_service import rag_service

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure tables exist and database is seeded
    Base.metadata.create_all(bind=engine)
    try:
        seed_database()
    except Exception as e:
        print(f"[!] Warning during database seed: {e}")

    # Initialize RAG search index
    db = SessionLocal()
    try:
        rag_service.index_schemes(db)
        print("[*] RAG Knowledge Base indexed with database schemes.")
    finally:
        db.close()

    yield
    # Shutdown logic if any

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Production-style Social Welfare Platform for Informal Workers: Explainable AI Recommendations, Government Scheme Dataset Management, and Lifecycle Application Tracking.",
    version="2.0.0",
    lifespan=lifespan
)

# Ensure database tables exist across test runners and server processes
Base.metadata.create_all(bind=engine)

def ensure_db_migrations():
    try:
        with engine.connect() as conn:
            cols = conn.exec_driver_sql("PRAGMA table_info(application_documents)").fetchall()
            for col in cols:
                # col schema: (cid, name, type, notnull, dflt_value, pk)
                if col[1] == "application_id" and col[3] == 1:
                    conn.exec_driver_sql("PRAGMA foreign_keys = OFF;")
                    conn.exec_driver_sql("""
                        CREATE TABLE IF NOT EXISTS application_documents_migrated (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            application_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
                            worker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                            document_type VARCHAR(100) NOT NULL,
                            file_name VARCHAR(255) NOT NULL,
                            file_path VARCHAR(500) NOT NULL,
                            file_size INTEGER DEFAULT 0,
                            upload_date DATETIME,
                            status VARCHAR(50) NOT NULL DEFAULT 'Uploaded',
                            admin_remarks TEXT,
                            verified_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                            verified_at DATETIME
                        );
                    """)
                    conn.exec_driver_sql("""
                        INSERT INTO application_documents_migrated 
                        (id, application_id, worker_id, document_type, file_name, file_path, file_size, upload_date, status, admin_remarks, verified_by_id, verified_at)
                        SELECT id, application_id, worker_id, document_type, file_name, file_path, file_size, upload_date, status, admin_remarks, verified_by_id, verified_at
                        FROM application_documents;
                    """)
                    conn.exec_driver_sql("DROP TABLE application_documents;")
                    conn.exec_driver_sql("ALTER TABLE application_documents_migrated RENAME TO application_documents;")
                    conn.exec_driver_sql("PRAGMA foreign_keys = ON;")
                    conn.commit()
                    break
    except Exception as e:
        print(f"[!] Migration check notice: {e}")

ensure_db_migrations()


# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploaded files directory
uploads_dir = settings.UPLOAD_PATH
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# Include main API router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Frontend static assets
frontend_dist = BASE_DIR.parent / "frontend" / "dist"
assets_dir = frontend_dist / "assets"
if assets_dir.exists():
    app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": settings.PROJECT_NAME}

@app.get("/api")
def api_info():
    return {
        "project": settings.PROJECT_NAME,
        "status": "online",
        "api_docs": "/docs",
        "api_version": "v1",
        "endpoints": {
            "auth": f"{settings.API_V1_STR}/auth",
            "schemes": f"{settings.API_V1_STR}/schemes",
            "dataset": f"{settings.API_V1_STR}/dataset",
            "recommendations": f"{settings.API_V1_STR}/recommendations",
            "applications": f"{settings.API_V1_STR}/applications",
            "analytics": f"{settings.API_V1_STR}/admin/analytics"
        }
    }

@app.get("/")
def serve_index():
    index_file = frontend_dist / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return api_info()

@app.get("/{full_path:path}")
def serve_spa(full_path: str):
    # Guard against API, docs, or upload paths
    if full_path.startswith(("api", "docs", "redoc", "openapi.json", "uploads")):
        return JSONResponse(status_code=404, content={"detail": "Not Found"})
    
    # Check if a static file directly in frontend/dist exists (e.g. manifest.json, favicon.svg)
    file_path = frontend_dist / full_path
    if full_path and file_path.is_file():
        return FileResponse(file_path)
    
    # Otherwise fallback to index.html for client-side routing
    index_file = frontend_dist / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    
    return JSONResponse(status_code=404, content={"detail": "Not Found"})

# Global exception handler for clean error responses without stack trace exposure
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Log internal error safely on server
    print(f"[ERROR] Internal server error on {request.method} {request.url.path}: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please try again or contact system support."}
    )
