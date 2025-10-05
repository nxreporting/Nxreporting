@echo off
echo 🚀 Manual Vercel Deployment Script
echo ================================

echo.
echo 📦 Installing Vercel CLI...
npm install -g vercel

echo.
echo 🔐 Login to Vercel (this will open browser)...
vercel login

echo.
echo 📁 Navigating to frontend directory...
cd frontend

echo.
echo 🚀 Deploying to Vercel (Production)...
vercel --prod

echo.
echo ✅ Deployment complete!
echo Check your Vercel dashboard for the deployment status.
pause