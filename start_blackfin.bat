@echo off
echo ======================================================================
echo   BLACKFIN — Intelligent Adaptive Sonar Transmitter for AUVs
echo   Smart India Hackathon 2026 · Problem Statement ID: 26058
echo ======================================================================
echo.

echo [1/2] Starting Blackfin FastAPI Backend on http://localhost:8000 ...
start "BLACKFIN Backend" cmd /k "cd /d %~dp0backend && C:\Python314\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000"

echo [2/2] Starting Blackfin Vite React Frontend on http://localhost:5173 ...
start "BLACKFIN Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ======================================================================
echo   BLACKFIN mission control is launching!
echo   Frontend: http://localhost:5173
echo   Backend API: http://localhost:8000/api
echo   WebSocket Stream: ws://localhost:8000/ws/dashboard
echo ======================================================================
echo.
pause
