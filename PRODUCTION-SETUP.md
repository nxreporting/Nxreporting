# 🚀 Production Deployment Guide

## Overview
This guide will help you deploy your NX Reporting app to production using:
- **Frontend**: Vercel (Next.js hosting)
- **Backend**: Railway (Node.js hosting)
- **Database**: PlanetScale (MySQL)

## 📋 Prerequisites

1. **Accounts needed:**
   - [Vercel Account](https://vercel.com) (Free tier available)
   - [Railway Account](https://railway.app) (Free tier available)
   - [PlanetScale Account](https://planetscale.com) (Free tier available)

2. **CLI tools:**
   - Node.js 18+ installed
   - Git installed

## 🗄️ Step 1: Setup Database (PlanetScale)

1. **Create PlanetScale database:**
   ```bash
   # Install PlanetScale CLI
   npm install -g @planetscale/cli
   
   # Login to PlanetScale
   pscale auth login
   
   # Create database
   pscale database create nx-reporting
   
   # Create branch
   pscale branch create nx-reporting main
   
   # Get connection string
   pscale connect nx-reporting main --port 3309
   ```

2. **Update DATABASE_URL in backend/.env.production**

## 🚂 Step 2: Deploy Backend (Railway)

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Deploy backend:**
   ```bash
   cd backend
   railway login
   railway init
   railway up
   ```

3. **Set environment variables in Railway dashboard:**
   - `NODE_ENV=production`
   - `DATABASE_URL=your-planetscale-connection-string`
   - `NANONETS_API_KEY=a0a55141-94a6-11f0-8959-2e22c9bcfacb`
   - `JWT_SECRET=your-secure-jwt-secret`
   - `FRONTEND_URL=https://your-app.vercel.app`

4. **Note your Railway URL:** `https://your-backend.railway.app`

## 🌐 Step 3: Deploy Frontend (Vercel)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Update frontend/.env.production:**
   ```
   NEXT_PUBLIC_BACKEND_URL=https://your-backend.railway.app
   ```

3. **Deploy frontend:**
   ```bash
   cd frontend
   vercel --prod
   ```

4. **Set environment variables in Vercel dashboard:**
   - `NEXT_PUBLIC_BACKEND_URL=https://your-backend.railway.app`

## 🔧 Step 4: Configure Domain & SSL

1. **Custom domain (optional):**
   - Add your domain in Vercel dashboard
   - Update CORS settings in backend

2. **SSL certificates:**
   - Automatically handled by Vercel and Railway

## 🧪 Step 5: Test Production App

1. **Test endpoints:**
   - Frontend: `https://your-app.vercel.app`
   - Backend API: `https://your-backend.railway.app/health`
   - PDF extraction: Upload a test PDF

2. **Monitor logs:**
   - Vercel: Check function logs
   - Railway: Check deployment logs

## 📊 Step 6: Database Migration

```bash
# Run database migrations
cd backend
npx prisma migrate deploy
npx prisma generate
```

## 🔐 Security Checklist

- [ ] JWT_SECRET is secure and unique
- [ ] Database credentials are secure
- [ ] CORS origins are properly configured
- [ ] API keys are stored as environment variables
- [ ] File upload limits are set
- [ ] Rate limiting is configured (optional)

## 📈 Monitoring & Maintenance

1. **Vercel Analytics:** Enable in dashboard
2. **Railway Metrics:** Monitor CPU/Memory usage
3. **PlanetScale Insights:** Monitor database performance
4. **Error Tracking:** Consider adding Sentry

## 💰 Cost Estimation (Free Tiers)

- **Vercel**: Free (100GB bandwidth, 1000 serverless functions)
- **Railway**: Free ($5 credit monthly, ~500 hours)
- **PlanetScale**: Free (1 database, 1GB storage, 1 billion reads)

**Total monthly cost: $0-5** (depending on usage)

## 🆘 Troubleshooting

### Common Issues:

1. **CORS errors:**
   - Check FRONTEND_URL in backend env
   - Verify CORS_ORIGINS includes your Vercel domain

2. **Database connection:**
   - Verify DATABASE_URL format
   - Check PlanetScale connection status

3. **File uploads not working:**
   - Railway has ephemeral storage
   - Consider adding Cloudinary for file storage

4. **Build failures:**
   - Check Node.js version compatibility
   - Verify all dependencies are in package.json

## 🔄 Updates & Redeployment

```bash
# Update backend
cd backend
git push  # Auto-deploys on Railway

# Update frontend  
cd frontend
vercel --prod  # Or auto-deploy via Git integration
```

## 📞 Support

- **Vercel**: [Documentation](https://vercel.com/docs)
- **Railway**: [Documentation](https://docs.railway.app)
- **PlanetScale**: [Documentation](https://planetscale.com/docs)