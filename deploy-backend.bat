@echo off
echo 🚀 Deploying Backend to Railway...
echo.

cd backend

echo 📦 Installing Railway CLI...
npm install -g @railway/cli

echo 🔧 Building backend...
npm run build

echo 🚂 Deploying to Railway...
railway login
railway link
railway up

echo.
echo ✅ Backend deployment completed!
echo 🌍 Your API will be available at: https://your-backend.railway.app
echo.
pause