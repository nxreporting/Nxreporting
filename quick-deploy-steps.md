# 🚀 Quick Manual Deployment Guide

Since auto-deployment isn't working, let's deploy manually:

## Option 1: Using Vercel CLI (Recommended)

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```
This will open your browser to authenticate.

### Step 3: Deploy from Frontend Directory
```bash
cd frontend
vercel --prod
```

## Option 2: Using Vercel Dashboard

### Step 1: Go to Vercel Dashboard
- Visit: https://vercel.com/dashboard
- Click on your `nxreporting` project

### Step 2: Manual Import
- Click **"Import Git Repository"** 
- Or click **"Create Deployment"**
- Select your GitHub repository
- Choose the `main` branch
- Click **"Deploy"**

## Option 3: Fix GitHub Integration

### Check GitHub Integration:
1. In Vercel Dashboard → Settings → Git
2. Make sure repository is connected
3. Enable "Auto-deploy" for main branch
4. Check if webhooks are properly configured

### Check GitHub Secrets:
Your GitHub repository needs these secrets for the workflow:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID` 
- `VERCEL_PROJECT_ID`

## 🎯 Expected Result

After manual deployment:
- New deployment should appear in Vercel dashboard
- PDF extraction should work with OCR.space
- Environment variables will be available
- Live site should be updated

## 🔍 Troubleshooting

If deployment fails:
1. Check Vercel function logs
2. Verify all environment variables are set
3. Make sure `vercel.json` is properly configured
4. Check for any build errors in the logs

Run the `manual-deploy.bat` script or follow the CLI steps above!