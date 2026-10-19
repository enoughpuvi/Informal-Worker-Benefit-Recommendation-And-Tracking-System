"""
Installer Script: Creates a 1-Click Desktop Shortcut for WelfareTrack AI
"""

import os
import sys
import shutil
import subprocess
from pathlib import Path


def get_desktop_dir() -> Path:
    """Retrieve the current user's desktop path reliably across Windows configurations."""
    # Try Windows user profile environment variable
    user_profile = os.environ.get("USERPROFILE")
    if user_profile:
        desktop = Path(user_profile) / "Desktop"
        if desktop.exists():
            return desktop

    # Try OneDrive Desktop if folder redirection is active
    if user_profile:
        onedrive_desktop = Path(user_profile) / "OneDrive" / "Desktop"
        if onedrive_desktop.exists():
            return onedrive_desktop

    # Fallback to home expansion
    home_desktop = Path.home() / "Desktop"
    if home_desktop.exists():
        return home_desktop

    return Path.home()


def create_shortcut():
    project_dir = Path(__file__).resolve().parent
    desktop_dir = get_desktop_dir()

    # Clean up old shortcut if present
    old_shortcut = desktop_dir / "WelfareTrack AI.lnk"
    if old_shortcut.exists():
        try:
            old_shortcut.unlink()
        except Exception:
            pass

    shortcut_path = desktop_dir / "Apana Benefits.lnk"

    # Identify pythonw.exe or python.exe
    python_dir = Path(sys.executable).parent
    pythonw_candidate = python_dir / "pythonw.exe"
    if pythonw_candidate.exists():
        python_exe = str(pythonw_candidate)
    else:
        python_exe = sys.executable

    desktop_script = project_dir / "desktop_app.py"
    icon_file = project_dir / "app_icon.ico"

    print("======================================================================")
    print("  Apana Benefits - Desktop Application Installer")
    print("======================================================================")
    print(f"[*] Project Directory:   {project_dir}")
    print(f"[*] Target Launcher:     {desktop_script}")
    print(f"[*] Python Runtime:      {python_exe}")
    print(f"[*] Application Icon:    {icon_file}")
    print(f"[*] Target Shortcut:     {shortcut_path}")
    print("----------------------------------------------------------------------")

    # PowerShell script to create the Windows Shell Shortcut (.lnk)
    ps_script = f"""
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut('{shortcut_path}')
$Shortcut.TargetPath = '{python_exe}'
$Shortcut.Arguments = '"{desktop_script}"'
$Shortcut.WorkingDirectory = '{project_dir}'
$Shortcut.Description = 'Apana Benefits - Social Welfare & Benefit Intelligence System'
$Shortcut.IconLocation = '{icon_file},0'
$Shortcut.WindowStyle = 1
$Shortcut.Save()
"""

    try:
        proc = subprocess.run(
            ["powershell", "-NoProfile", "-NonInteractive", "-Command", ps_script],
            capture_output=True,
            text=True,
            check=True
        )
        if shortcut_path.exists():
            print(f"[+] SUCCESS! Desktop shortcut created at:")
            print(f"    {shortcut_path}")
            print("\nYou can now launch Apana Benefits directly from your Windows Desktop!")
        else:
            print("[!] Warning: PowerShell completed but shortcut file was not found.")
    except Exception as e:
        print(f"[!] Error creating shortcut via PowerShell: {e}")
        print("[*] Creating fallback batch launcher instead...")
        batch_shortcut = desktop_dir / "Apana Benefits.bat"
        with open(batch_shortcut, "w", encoding="utf-8") as f:
            f.write(f'@echo off\ncd /d "{project_dir}"\nstart pythonw.exe desktop_app.py\n')
        print(f"[+] Fallback launcher created at: {batch_shortcut}")

    print("======================================================================")


if __name__ == "__main__":
    create_shortcut()
