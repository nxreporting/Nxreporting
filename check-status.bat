@echo off
TITLE NX Reporting - Server Status Checker
COLOR 0F

echo ====================================================
echo        NX Reporting Server Status Checker
echo ====================================================
echo.

REM Check if backend is running
echo Checking Backend Server (Port 5000):
echo ================================
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:5000/health' -UseBasicParsing -TimeoutSec 5; Write-Output '[OK] Backend server is running'; Write-Output ('Status: ' + $response.StatusCode); } catch { Write-Output '[INFO] Backend server may not be running or health check endpoint not available'; }"
echo.

REM Check if frontend is running
echo Checking Frontend Server (Port 3000):
echo =================================
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 5; Write-Output '[OK] Frontend server is running'; Write-Output ('Status: ' + $response.StatusCode); } catch { Write-Output '[INFO] Frontend server may not be running'; }"
echo.

REM Check port usage
echo Checking Port Usage:
echo =================
echo Port 5000:
netstat -an | findstr ":5000 " >nul
if %errorlevel% equ 0 (
    echo    Port 5000 is in use
) else (
    echo    Port 5000 is available
)

echo Port 3000:
netstat -an | findstr ":3000 " >nul
if %errorlevel% equ 0 (
    echo    Port 3000 is in use
) else (
    echo    Port 3000 is available
)
echo.

echo ====================================================
echo              Status Check Complete
echo ====================================================
echo.
echo If servers are not running:
echo 1. Run 'start-app-final.bat' to start the application
echo 2. Wait for both servers to initialize
echo 3. Run this script again to verify
echo.
pause