cd "C:\Users\Arnab\NX Reporting\backend"cd "C:\Users\Arnab\NX Reporting\backend"cd "C:\Users\Arnab\NX Reporting\backend"@echo off
TITLE NX Reporting Application
COLOR 0A

echo ========================================
echo   NX Reporting Application Startup
echo ========================================
echo.

echo Setting up environment...
cd /d "C:\Users\Arnab\NX Reporting"

echo.
echo Starting Backend Server on port 5000...
echo =======================================
cd /d "C:\Users\Arnab\NX Reporting\backend"
start "Backend Server" /D "C:\Users\Arnab\NX Reporting\backend" cmd /k "npm install && npm run dev"

echo.
echo Waiting 10 seconds for backend to start...
timeout /t 10 /nobreak >nul

echo.
echo Starting Frontend Server on port 3000...
echo =========================================
cd /d "C:\Users\Arnab\NX Reporting\frontend"
start "Frontend Server" /D "C:\Users\Arnab\NX Reporting\frontend" cmd /k "npm install && npm run dev"

echo.
echo ========================================
echo   Startup Complete!
echo ========================================
echo.
echo Backend API:    http://localhost:5000
echo Frontend App:   http://localhost:3000
echo.
echo NOTE: Check the new command windows for server output
echo.
pause