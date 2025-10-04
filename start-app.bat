@echo off
echo Starting NX Reporting Application (Vercel + Supabase Architecture)...
echo.

echo ℹ️  Note: Backend is now integrated as Next.js API routes
echo ℹ️  No separate backend server needed!
echo.

echo Setting up database...
cd frontend
call npm run db:setup
if %errorlevel% neq 0 (
    echo ❌ Database setup failed. Please check your environment configuration.
    pause
    exit /b 1
)

echo.
echo Starting Next.js Development Server (Frontend + API)...
start "NX Reporting - Full Stack" cmd /k "npm run dev"

echo Waiting for server to start...
timeout /t 8 /nobreak >nul

echo Opening application in browser...
start http://localhost:3000

echo.
echo ✅ NX Reporting Application Started!
echo 🌐 Application: http://localhost:3000
echo 🔧 API Routes: http://localhost:3000/api/*
echo 📊 Health Check: http://localhost:3000/api/health
echo 🗄️  Database: Supabase (configured in .env.local)
echo.
echo Press any key to close this window...
pause