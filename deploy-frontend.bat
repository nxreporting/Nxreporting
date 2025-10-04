@echo off
echo 🚀 Deploying Frontend to Vercel...
echo.

cd frontend

echo 📦 Installing Vercel CLI...
npm install -g vercel

echo 🔧 Building frontend...
npm run build

echo 🌐 Deploying to Vercel...
vercel --prod

echo.
echo ✅ Frontend deployment completed!
echo 🌍 Your app will be available at: https://your-app.vercel.app
echo.
pause