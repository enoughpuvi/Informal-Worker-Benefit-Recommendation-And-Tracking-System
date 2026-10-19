"""
Apana Benefits - Standalone Desktop Application Launcher
Unified Single-Port Host & Dedicated Desktop App Window
"""

import os
import sys
import time
import socket
import argparse
import threading
import subprocess
import urllib.request
from pathlib import Path

# Setup project directories
PROJECT_ROOT = Path(__file__).resolve().parent
BACKEND_DIR = PROJECT_ROOT / "backend"
sys.path.insert(0, str(BACKEND_DIR))

try:
    import uvicorn
    from app.main import app
    from app.core.config import settings
except ImportError as e:
    print(f"[!] Failed to import backend dependencies: {e}")
    sys.exit(1)


def is_port_in_use(port: int, host: str = "127.0.0.1") -> bool:
    """Check if the given port is already accepting connections."""
    if not (0 <= port <= 65535):
        return False
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(0.5)
            return s.connect_ex((host, port)) == 0
    except Exception:
        return False


def is_welfare_server_running(url: str) -> bool:
    """Check if Apana Benefits backend is already responding healthy on the given URL."""
    try:
        req = urllib.request.Request(f"{url}/health", headers={"User-Agent": "ApanaBenefits-Launcher"})
        with urllib.request.urlopen(req, timeout=1.5) as resp:
            return resp.status == 200
    except Exception:
        return False


def find_browser_app_runtime():
    """Locate Microsoft Edge or Google Chrome executable for native desktop window mode."""
    candidates = [
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    ]
    for path in candidates:
        if os.path.exists(path):
            return path
    return None


def run_server(server_instance):
    """Run uvicorn server in a background thread."""
    try:
        server_instance.run()
    except Exception as e:
        print(f"[!] Server error: {e}")


def main():
    parser = argparse.ArgumentParser(description="Apana Benefits Desktop Application")
    parser.add_argument("--port", type=int, default=8000, help="Server port (default: 8000)")
    parser.add_argument("--mode", choices=["app", "webview", "browser"], default="app",
                        help="Window mode: 'app' (Edge/Chrome native window), 'webview' (pywebview), or 'browser'")
    parser.add_argument("--no-window", action="store_true", help="Start unified server only without opening UI window")
    args = parser.parse_args()

    port = args.port
    host = "127.0.0.1"
    base_url = f"http://{host}:{port}"

    server_thread = None
    server = None

    # Check if our server is already running on this port
    if is_port_in_use(port, host):
        if is_welfare_server_running(base_url):
            print(f"[*] Apana Benefits server is already running on {base_url}.")
        else:
            # Port is occupied by something else, find next free port
            print(f"[!] Port {port} is occupied by another process. Searching for free port...")
            for p in range(8001, 8020):
                if not is_port_in_use(p, host):
                    port = p
                    base_url = f"http://{host}:{port}"
                    break
            print(f"[*] Switching to port {port} ({base_url})")

    # Start backend server if not already running
    if not is_welfare_server_running(base_url):
        print(f"[*] Starting unified Apana Benefits server on {base_url}...")
        config = uvicorn.Config(
            app=app,
            host=host,
            port=port,
            log_level="warning",
            access_log=False
        )
        server = uvicorn.Server(config)
        server_thread = threading.Thread(target=run_server, args=(server,), daemon=True)
        server_thread.start()

        # Wait for server to become healthy
        ready = False
        for _ in range(80):
            if is_welfare_server_running(base_url):
                ready = True
                break
            time.sleep(0.25)

        if not ready:
            print("[!] Server startup timed out. Please check logs.")
            if server:
                server.should_exit = True
            sys.exit(1)

        print(f"[+] Apana Benefits server ready at {base_url}")

    if args.no_window:
        print("[*] Running in server-only mode. Press Ctrl+C to terminate.")
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n[*] Shutting down server...")
            if server:
                server.should_exit = True
            sys.exit(0)

    # Launch desktop application window
    print(f"[*] Opening desktop application window ({args.mode} mode)...")
    app_proc = None

    try:
        if args.mode == "app":
            browser_path = find_browser_app_runtime()
            if browser_path:
                # Isolated profile directory to maintain user session without browser tab clutter
                local_app_data = os.environ.get("LOCALAPPDATA", str(PROJECT_ROOT / ".app_profile"))
                profile_dir = os.path.join(local_app_data, "ApanaBenefits_Profile")
                os.makedirs(profile_dir, exist_ok=True)

                cmd = [
                    browser_path,
                    f"--app={base_url}",
                    "--window-size=1280,820",
                    f"--user-data-dir={profile_dir}",
                    "--app-id=ApanaBenefits",
                    "--disable-extensions",
                    "--no-first-run",
                    "--no-default-browser-check"
                ]
                app_proc = subprocess.Popen(cmd)
                app_proc.wait()
            else:
                print("[!] Edge/Chrome runtime not found. Falling back to pywebview...")
                args.mode = "webview"

        if args.mode == "webview":
            try:
                import webview
                window = webview.create_window(
                    title="Apana Benefits - Social Welfare & Benefit Intelligence",
                    url=base_url,
                    width=1280,
                    height=820,
                    resizable=True,
                    min_size=(960, 640)
                )
                webview.start()
            except Exception as wve:
                print(f"[!] pywebview error: {wve}. Falling back to default browser...")
                args.mode = "browser"

        if args.mode == "browser":
            import webbrowser
            webbrowser.open(base_url)
            print("[*] Web application opened in default browser.")
            print("[*] Press Ctrl+C to terminate the application.")
            while True:
                time.sleep(1)

    except KeyboardInterrupt:
        print("\n[*] Application closed by user.")
    finally:
        # Graceful cleanup
        if server:
            print("[*] Stopping background Apana Benefits server...")
            server.should_exit = True
            if server_thread:
                server_thread.join(timeout=3)
        print("[+] Application session finished cleanly.")


if __name__ == "__main__":
    main()
