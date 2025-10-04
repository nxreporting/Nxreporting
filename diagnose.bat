@echo off
TITLE NX Reporting - Diagnostics
COLOR 0F

echo ====================================================
echo        NX Reporting Diagnostics Tool
echo ====================================================
echo.

REM Check current directory
echo 1. Current Directory Check:
echo    ----------------------
cd /d "%~dp0"
echo    Current path: %CD%
echo.

REM Check if required directories exist
echo 2. Directory Structure Check:
echo    ------------------------
if exist "backend" (
    echo    [OK] Backend directory found
) else (
    echo    [ERROR] Backend directory NOT found
)

if exist "frontend" (
    echo    [OK] Frontend directory found
) else (
    echo    [ERROR] Frontend directory NOT FOUND
)

if exist "backend\src\index.ts" (
    echo    [OK] Backend entry point found
) else (
    echo    [ERROR] Backend entry point (index.ts) NOT found
)

if exist "frontend\src\app\page.tsx" (
    echo    [OK] Frontend entry point found
) else (
    echo    [ERROR] Frontend entry point (page.tsx) NOT found
)
echo.

REM Check Node.js and npm
echo 3. Node.js and npm Check:
echo    ---------------------
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo    [OK] Node.js: %ERRORLEVEL%
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo         Version: %NODE_VERSION%
) else (
    echo    [ERROR] Node.js is NOT installed or not in PATH
)

npm --version >nul 2>&1
if %errorlevel% equ 0 (
    echo    [OK] npm: %ERRORLEVEL%
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo         Version: %NPM_VERSION%
) else (
    echo    [ERROR] npm is NOT available
)
echo.

REM Check if ports are available
echo 4. Port Availability Check:
echo    ----------------------
netstat -an | findstr ":5000 " >nul
if %errorlevel% equ 0 (
    echo    [WARNING] Port 5000 appears to be in use
) else (
    echo    [OK] Port 5000 is available
)

netstat -an | findstr ":3000 " >nul
if %errorlevel% equ 0 (
    echo    [WARNING] Port 3000 appears to be in use
) else (
    echo    [OK] Port 3000 is available
)
echo.

REM Check backend package.json
echo 5. Backend Dependencies Check:
echo    --------------------------
if exist "backend\package.json" (
    echo    [OK] Backend package.json found
    cd /d "%~dp0backend"
    echo    Checking for missing dependencies...
    npm ls --depth=0 >nul 2>&1
    if %errorlevel% equ 0 (
        echo    [OK] All backend dependencies satisfied
    ) else (
        echo    [WARNING] Some backend dependencies may be missing
        echo             Run 'npm install' in the backend directory
    )
) else (
    echo    [ERROR] Backend package.json NOT found
)
echo.

REM Check frontend package.json
echo 6. Frontend Dependencies Check:
echo    ---------------------------
if exist "frontend\package.json" (
    echo    [OK] Frontend package.json found
    cd /d "%~dp0frontend"
    echo    Checking for missing dependencies...
    npm ls --depth=0 >nul 2>&1
    if %errorlevel% equ 0 (
        echo    [OK] All frontend dependencies satisfied
    ) else (
        echo    [WARNING] Some frontend dependencies may be missing
        echo             Run 'npm install' in the frontend directory
    )
) else (
    echo    [ERROR] Frontend package.json NOT found
)
echo.

REM Check database connectivity (basic)
echo 7. Database Environment Check:
echo    --------------------------
cd /d "%~dp0backend"
if exist ".env" (
    echo    [OK] Backend .env file found
    echo    Checking for DATABASE_URL...
    findstr "DATABASE_URL" .env >nul
    if %errorlevel% equ 0 (
        echo    [OK] DATABASE_URL found in .env
        for /f "tokens=*" %%i in ('findstr "DATABASE_URL" .env') do set DB_URL=%%i
        echo         %DB_URL%
    ) else (
        echo    [WARNING] DATABASE_URL not found in .env
    )
) else (
    echo    [WARNING] Backend .env file NOT found
    echo             You need to create one with database configuration
)
echo.

echo ====================================================
echo        Diagnostics Complete
echo ====================================================
echo.
echo Next steps:
echo 1. If any ERRORs were found, address them first
echo 2. Run 'run-application.bat' to start the app
echo 3. Check new command windows for server output
echo.
pause