@echo off
TITLE NX Reporting - Application Startup
COLOR 0F

echo ====================================================
echo        NX Reporting Application Startup
echo ====================================================
echo.

REM Check if we're in the right directory
cd /d "%~dp0"

echo Current directory: %CD%
echo.

REM Check if Node.js is installed
echo Checking for Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js is installed.
echo.

REM Check if npm is available
echo Checking for npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not available
    pause
    exit /b 1
)

echo npm is available.
echo.

REM Setup Backend
echo Setting up Backend...
echo ==================
cd /d "%~dp0backend"

if not exist "node_modules" (
    echo Installing backend dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install backend dependencies
        pause
        exit /b 1
    )
) else (
    echo Backend dependencies already installed.
)

echo.
echo Starting backend server in new window...
start "NX Reporting - Backend" cmd /k "cd /d "%~dp0backend" && npm run dev"

echo.
echo Waiting 15 seconds for backend to start...
timeout /t 15 /nobreak >nul

echo.
echo Setting up Frontend...
echo ===================
cd /d "%~dp0frontend"

if not exist "node_modules" (
    echo Installing frontend dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install frontend dependencies
        pause
        exit /b 1
    )
) else (
    echo Frontend dependencies already installed.
)

echo.
echo Starting frontend server in new window...
start "NX Reporting - Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ====================================================
echo        Startup Process Complete
echo ====================================================
echo.
echo Backend API:    http://localhost:5000
echo Frontend App:   http://localhost:3000
echo.
echo Check the new command windows for server status.
echo Look for "Server running on port 5000" and "ready on port 3000"
echo.
echo Press any key to close this window...
pause >nul