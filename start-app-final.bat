@echo off
TITLE NX Reporting Application Starter
COLOR 0A

echo ==========================================================
echo                NX Reporting Application
echo ==========================================================
echo.

REM Navigate to the project root directory
cd /d "%~dp0"

echo Current Directory: %CD%
echo.

REM Check if Node.js is installed
echo Checking system requirements...
echo ==============================
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please download and install Node.js from https://nodejs.org/
    echo Then run this script again.
    echo.
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo [OK] Node.js %NODE_VERSION% found
)

npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm is not available
    echo.
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo [OK] npm %NPM_VERSION% found
)
echo.

REM Check required directories
echo Checking project structure...
echo ==========================
if not exist "backend" (
    echo [ERROR] Backend directory not found
    echo Make sure you're running this script from the project root
    pause
    exit /b 1
) else (
    echo [OK] Backend directory found
)

if not exist "frontend" (
    echo [ERROR] Frontend directory not found
    echo Make sure you're running this script from the project root
    pause
    exit /b 1
) else (
    echo [OK] Frontend directory found
)
echo.

REM Setup Backend
echo Setting up Backend Server (Port 5000)
echo ====================================
cd /d "%~dp0backend"

REM Check if package.json exists
if not exist "package.json" (
    echo [ERROR] backend/package.json not found
    pause
    exit /b 1
)

REM Install backend dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing backend dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install backend dependencies
        pause
        exit /b 1
    )
    echo [OK] Backend dependencies installed
) else (
    echo [OK] Backend dependencies already installed
)

REM Check if Prisma schema exists
if exist "prisma\schema.prisma" (
    echo [OK] Prisma schema found
    echo Generating Prisma client...
    npx prisma generate --schema=prisma/schema.prisma
    if %errorlevel% neq 0 (
        echo [WARNING] Prisma client generation failed
        echo This might be OK if it was generated before
    ) else (
        echo [OK] Prisma client generated
    )
) else (
    echo [WARNING] Prisma schema not found
)

echo.
echo Starting Backend Server...
start "NX Reporting - Backend Server" cmd /k "cd /d "%~dp0backend" && echo Backend Server Starting... && npm run dev"
echo [OK] Backend server start command issued
echo.

REM Wait for backend to start
echo Waiting 15 seconds for backend to initialize...
timeout /t 15 /nobreak >nul

echo.
echo Setting up Frontend Server (Port 3000)
echo ======================================
cd /d "%~dp0frontend"

REM Check if package.json exists
if not exist "package.json" (
    echo [ERROR] frontend/package.json not found
    pause
    exit /b 1
)

REM Install frontend dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing frontend dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install frontend dependencies
        pause
        exit /b 1
    )
    echo [OK] Frontend dependencies installed
) else (
    echo [OK] Frontend dependencies already installed
)
echo.

echo Starting Frontend Server...
start "NX Reporting - Frontend Server" cmd /k "cd /d "%~dp0frontend" && echo Frontend Server Starting... && npm run dev"
echo [OK] Frontend server start command issued
echo.

REM Final instructions
echo ==========================================================
echo                Startup Process Complete
echo ==========================================================
echo.
echo The application servers are now starting in separate windows.
echo.
echo Backend API:    http://localhost:5000
echo Frontend App:   http://localhost:3000
echo.
echo Look for these messages in the new command windows:
echo   - Backend: "🚀 Server running on port 5000"
echo   - Frontend: "ready - started server on 0.0.0.0:3000"
echo.
echo If you don't see these messages, check the command windows
echo for error messages.
echo.
echo Press any key to close this window...
pause >nul
exit /b 0