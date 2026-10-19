import sys
from pathlib import Path
import uvicorn

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent / "backend"
sys.path.insert(0, str(backend_dir))

if __name__ == "__main__":
    print("\n=======================================================")
    print("STARTING APANA BENEFITS BACKEND")
    print("API Documentation: http://localhost:8000/docs")
    print("Admin Email:      admin@welfare.gov.in")
    print("Admin Password:   Admin@12345")
    print("=======================================================\n")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=False, app_dir=str(backend_dir))
