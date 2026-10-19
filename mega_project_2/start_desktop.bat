@echo off
title Apana Benefits - Application Launcher
cd /d "%~dp0"

echo ======================================================================
echo Launching Apana Benefits Desktop Application
echo ======================================================================
echo Starting server and launching native window...
echo.

python desktop_app.py

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [!] Application exited with error code %ERRORLEVEL%.
    pause
)
