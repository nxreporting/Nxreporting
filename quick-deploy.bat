@echo off
echo 🚀 NX Reporting - Quick Production Deploy
echo ==========================================
echo.

echo 📋 This script will help you deploy your app to production
echo.
echo 🎯 Deployment targets:
echo    Frontend: Vercel (https://vercel.com)
echo    Backend:  Railway (https://railway.app)  
echo    Database: PlanetScale (https://planetscale.com)
echo.

set /p choice="Do you want to continue? (y/n): "
if /i "%choice%" neq "y" goto :end

echo.
echo 📦 Step 1: Installing CLI tools...
npm install -g vercel @railway/cli @planetscale/cli

echo.
echo 🗄️ Step 2: Database setup...
echo Please create your PlanetScale database manually at: https://planetscale.com
echo Then update the DATABASE_URL in backend/.env.production
pause

echo.
echo 🚂 Step 3: Deploying backend to Railway...
cd backend
call railway login
call railway init
call railway up
cd ..

echo.
echo 🌐 Step 4: Deploying frontend to Vercel...
cd frontend
call vercel --prod
cd ..

echo.
echo ✅ Deployment completed!
echo.
echo 📋 Next steps:
echo 1. Update environment variables in Railway dashboard
echo 2. Update environment variables in Vercel dashboard  
echo 3. Test your production app
echo 4. Configure custom domain (optional)
echo.
echo 📖 See PRODUCTION-SETUP.md for detailed instructions
echo.

:end
pause