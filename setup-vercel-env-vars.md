# 🚀 Vercel Environment Variables Setup

## Quick Fix for Deployment Issues

Your Vercel deployment is failing because environment variables are not set. Here's how to fix it:

### 1. Go to Vercel Dashboard
- Visit: https://vercel.com/dashboard
- Select your project: `nxreporting`
- Go to **Settings** → **Environment Variables**

### 2. Add These Environment Variables

Add each of these as **Production**, **Preview**, and **Development**:

```bash
# Database Configuration
DATABASE_URL = your_database_url_here

# JWT Configuration  
JWT_SECRET = your_secure_jwt_secret_key_here_make_it_long_and_random_12345

# API Keys
NANONETS_API_KEY = your_nanonets_api_key_here
OCR_SPACE_API_KEY = K82877653688957
OPENAI_API_KEY = your_openai_api_key_here
HUGGINGFACE_API_TOKEN = your_huggingface_token_here

# Supabase Configuration (if needed)
NEXT_PUBLIC_SUPABASE_URL = your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY = your_service_role_key_here

# Application Configuration
NODE_ENV = production
MAX_FILE_SIZE_MB = 50
```

### 3. Alternative: Use Vercel CLI

If you have Vercel CLI installed:

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login to Vercel
vercel login

# Set environment variables
vercel env add DATABASE_URL
vercel env add JWT_SECRET  
vercel env add NANONETS_API_KEY
vercel env add OPENAI_API_KEY
vercel env add HUGGINGFACE_API_TOKEN
```

### 4. Redeploy

After setting the environment variables:
- Go back to your Vercel dashboard
- Click **"Redeploy"** on the latest deployment
- Or push a new commit to trigger auto-deployment

## 🎯 Expected Result

After setting these environment variables, your deployment should succeed and the PDF extraction will work on the live site.

## 🔍 Troubleshooting

If deployment still fails:
1. Check Vercel function logs
2. Verify all environment variables are set for all environments (Production, Preview, Development)
3. Make sure there are no typos in variable names
4. Ensure the DATABASE_URL is properly URL-encoded