import sys
import os
import time
import subprocess
import webbrowser
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = ROOT_DIR / "frontend"

print("=" * 65)
print(" STARTING APANA BENEFITS SYSTEM (FULL STACK) ")
print(" Running Backend (FastAPI :8000) and Frontend (React :5173) together ")
print("=" * 65)

# Determine platform-specific npm executable
npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"

# 1. Start FastAPI Backend
print("\n[1/3] Starting FastAPI Backend on port 8000...")
backend_process = subprocess.Popen(
    [sys.executable, "run_backend.py"],
    cwd=str(ROOT_DIR)
)

# Wait for backend to be healthy before starting frontend
print("Waiting for backend initialization and RAG indexing...")
backend_ready = False
for _ in range(30):
    if backend_process.poll() is not None:
        print(f"[!] Backend process failed to start (exit code {backend_process.poll()}).")
        sys.exit(1)
    try:
        import urllib.request
        req = urllib.request.Request("http://127.0.0.1:8000/health", headers={"User-Agent": "RunAll-Launcher"})
        with urllib.request.urlopen(req, timeout=1.0) as resp:
            if resp.status == 200:
                backend_ready = True
                break
    except Exception:
        pass
    time.sleep(0.5)

if not backend_ready:
    print("[!] Warning: Backend health check timed out. Proceeding with frontend launch...")
else:
    print("Backend is healthy and ready.")

# 2. Start React Frontend (Vite)
print("\n[2/3] Starting React Frontend on port 5173...")
frontend_process = subprocess.Popen(
    [npm_cmd, "run", "dev"],
    cwd=str(FRONTEND_DIR)
)

# Wait for Vite dev server to respond
print("Waiting for frontend dev server...")
for _ in range(15):
    if frontend_process.poll() is not None:
        print(f"[!] Frontend process failed to start (exit code {frontend_process.poll()}).")
        backend_process.terminate()
        sys.exit(1)
    try:
        import urllib.request
        req = urllib.request.Request("http://127.0.0.1:5173", headers={"User-Agent": "RunAll-Launcher"})
        with urllib.request.urlopen(req, timeout=1.0) as resp:
            if resp.status == 200:
                break
    except Exception:
        pass
    time.sleep(0.5)

# 3. Open browser
print("\n[3/3] Opening application in browser...")
print("=" * 65)
print(" -> Frontend: http://localhost:5173")
print(" -> Backend:  http://localhost:8000")
print(" -> API Docs: http://localhost:8000/docs")
print("=" * 65)
print("Both servers are now active. Press CTRL+C at any time to stop both.\n")

try:
    webbrowser.open("http://localhost:5173")
    while True:
        b_poll = backend_process.poll()
        f_poll = frontend_process.poll()
        if b_poll is not None:
            print(f"Backend process exited with code {b_poll}")
            break
        if f_poll is not None:
            print(f"Frontend process exited with code {f_poll}")
            break
        time.sleep(1)
except KeyboardInterrupt:
    print("\nStopping both servers...")
finally:
    if backend_process.poll() is None:
        backend_process.terminate()
    if frontend_process.poll() is None:
        frontend_process.terminate()
    print("Both servers have been stopped cleanly.")
