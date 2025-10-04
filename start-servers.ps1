# NX Reporting Start Script (Vercel + Supabase Architecture)
# This script will start the unified Next.js development server

Write-Host "NX Reporting Application Start Script" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "New Architecture: Vercel + Supabase" -ForegroundColor Green
Write-Host ""

# Get the current directory (should be project root)
$projectRoot = Get-Location
Write-Host "Project root: $projectRoot" -ForegroundColor Gray

# Navigate to frontend directory (where the unified app now lives)
$frontendPath = Join-Path $projectRoot "frontend"
if (Test-Path $frontendPath) {
    Set-Location $frontendPath
    Write-Host "Navigated to: $frontendPath" -ForegroundColor Gray
} else {
    Write-Host "Error: Frontend directory not found at $frontendPath" -ForegroundColor Red
    exit 1
}

# Install dependencies if needed
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

# Set up database (generate Prisma client and run migrations)
Write-Host "Setting up database..." -ForegroundColor Yellow
npm run db:setup

if ($LASTEXITCODE -ne 0) {
    Write-Host "Database setup failed. Please check your environment configuration." -ForegroundColor Red
    Write-Host "Make sure your .env.local file has the correct DATABASE_URL" -ForegroundColor Yellow
    pause
    exit 1
}

# Start the unified development server
Write-Host "Starting Next.js Development Server (Frontend + API Routes)..." -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Application will be available at: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔧 API Routes will be available at: http://localhost:3000/api/*" -ForegroundColor Cyan
Write-Host "📊 Health Check: http://localhost:3000/api/health" -ForegroundColor Cyan
Write-Host "🗄️  Database: Supabase (configured in .env.local)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the development server
npm run dev