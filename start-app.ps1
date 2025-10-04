Write-Host "🚀 Starting NX Reporting Application..." -ForegroundColor Green
Write-Host ""

# Kill any existing Node processes
Write-Host "🔄 Cleaning up existing processes..." -ForegroundColor Yellow
try {
    Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 3
} catch {}

# Start Backend Server
Write-Host "🔧 Starting Backend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; Write-Host 'Backend Server Starting...' -ForegroundColor Green; npm run dev"

# Wait for backend to start
Write-Host "⏳ Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# Verify backend is running
$backendRunning = $false
try {
    $backendProcess = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
    if ($backendProcess) {
        Write-Host "✅ Backend server is running on port 5000" -ForegroundColor Green
        $backendRunning = $true
    }
} catch {}

if (-not $backendRunning) {
    Write-Host "❌ Backend failed to start. Please check the backend terminal." -ForegroundColor Red
    pause
    exit
}

# Start Frontend Server  
Write-Host "🌐 Starting Frontend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; Write-Host 'Frontend Server Starting...' -ForegroundColor Green; npm run dev"

# Wait for frontend to start
Write-Host "⏳ Waiting for frontend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Verify frontend is running
$frontendRunning = $false
try {
    $frontendProcess = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
    if ($frontendProcess) {
        Write-Host "✅ Frontend server is running on port 3000" -ForegroundColor Green
        $frontendRunning = $true
    }
} catch {}

if (-not $frontendRunning) {
    Write-Host "❌ Frontend failed to start. Please check the frontend terminal." -ForegroundColor Red
    pause
    exit
}

# Open browser
Write-Host "🌍 Opening application in browser..." -ForegroundColor Magenta
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "✅ NX Reporting Application Started Successfully!" -ForegroundColor Green
Write-Host "📊 Backend API: http://localhost:5000" -ForegroundColor White
Write-Host "🖥️  Frontend App: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Both servers are running in separate terminal windows." -ForegroundColor Cyan
Write-Host "Press any key to exit this launcher..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")