@echo off
title Apana Benefits - System Launcher
cd /d "%~dp0"

echo ======================================================================
echo           APANA BENEFITS - SOCIAL WELFARE INTELLIGENCE
echo ======================================================================
echo.
echo Choose launch mode:
echo   [1] Desktop Application Mode (Recommended - 1-Click Native Window)
echo   [2] Web Browser Mode (Unified Single-Port http://localhost:8000)
echo   [3] Developer Mode (Vite Port 5173 + FastAPI Port 8000 Hot Reload)
echo   [4] Install / Reinstall Desktop Shortcut
echo.
set /p mode="Enter choice [1-4, Default=1]: "

if "%mode%"=="" set mode=1
if "%mode%"=="1" goto desktop_app
if "%mode%"=="2" goto browser_app
if "%mode%"=="3" goto dev_mode
if "%mode%"=="4" goto install_shortcut
goto desktop_app

:desktop_app
echo.
echo [*] Launching Apana Benefits in Desktop Application Mode...
python desktop_app.py
goto end

:browser_app
echo.
echo [*] Launching Apana Benefits in Browser Mode (Port 8000)...
python desktop_app.py --mode browser
goto end

:dev_mode
echo.
echo [*] Starting FastAPI Backend on Port 8000...
start "Apana Benefits Backend" cmd /k "python run_backend.py"
timeout /t 3 /nobreak >nul
echo [*] Starting Vite Frontend on Port 5173...
start "Apana Benefits Frontend" cmd /k "cd frontend & npm run dev"
timeout /t 2 /nobreak >nul
start http://localhost:5173
echo [!] Developer servers running in background.
goto end

:install_shortcut
python create_desktop_shortcut.py
pause
goto end

:end