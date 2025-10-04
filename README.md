# PDF Data Extraction & Reporting System

A full-stack application for uploading PDFs, extracting structured data, and generating analytics reports. Now powered by Vercel + Supabase architecture for seamless development and deployment.

## 🏗️ Architecture (Updated)

- **Frontend + Backend**: Next.js with API Routes (Unified)
- **Database**: Supabase PostgreSQL with Prisma ORM
- **Storage**: Vercel Blob Storage or Supabase Storage
- **Authentication**: JWT-based auth with role management
- **Deployment**: Vercel with Git integration
- **Data Extraction**: Nanonets API with AI-powered options

## 📁 Project Structure

```
├── frontend/         # Next.js application (Frontend + API Routes)
│   ├── pages/api/    # Serverless API routes
│   ├── src/          # React components and utilities
│   └── prisma/       # Database schema and migrations
├── scripts/          # Development and deployment scripts
├── docs/            # Documentation
└── backend/         # Legacy backend (deprecated)
```

## ✨ Features

- 📄 PDF upload with drag & drop interface
- 🔍 Intelligent data extraction (text, tables, numbers)
- 📊 Analytics dashboard with visualizations
- 📈 Report generation (CSV, Excel, PDF)
- 🔐 User authentication and role management
- 🎯 Real-time data preview and validation
- 🔥 Hot reloading for both frontend and API
- 🚀 Serverless deployment with auto-scaling

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Environment Setup
Environment files are pre-configured in `frontend/`:
- `.env.development` - Development defaults
- `.env.local` - Local overrides (Supabase configured)

### 3. Database Setup
```bash
cd frontend
npm run db:setup
```

### 4. Start Development Server
```bash
# Option 1: Root command
npm run dev

# Option 2: Windows batch file
start-app.bat

# Option 3: PowerShell script
./start-servers.ps1
```

### 5. Access Application
- **Application**: http://localhost:3000
- **API Routes**: http://localhost:3000/api/*
- **Health Check**: http://localhost:3000/api/health

## 🛠️ Development

### Hot Reloading
The development server supports hot reloading for:
- ✅ React components and pages
- ✅ Next.js API routes (serverless functions)
- ✅ TypeScript compilation
- ✅ CSS and Tailwind changes

### Development Scripts
```bash
npm run dev              # Start development server
npm run dev:debug        # Start with Node.js debugger
npm run test:dev         # Test development environment
npm run verify:hotreload # Verify hot reload setup
npm run health:check     # Check API health
```

### Database Management
```bash
cd frontend
npm run prisma:studio    # Open database browser
npm run prisma:migrate:dev  # Create new migration
npm run db:setup         # Setup database (generate + migrate)
```

## 📚 Documentation

- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Detailed development guide
- **[RUNNING.md](RUNNING.md)** - Running the application
- **[DEVELOPMENT_CHECKLIST.md](DEVELOPMENT_CHECKLIST.md)** - Setup verification
- **[VERCEL_DEPLOYMENT_GUIDE.md](VERCEL_DEPLOYMENT_GUIDE.md)** - Deployment guide

## 🔧 Environment Variables

Key environment variables (configured in `frontend/.env.local`):
```bash
DATABASE_URL="postgresql://..."           # Supabase database
JWT_SECRET="your-secure-secret"          # Authentication
NANONETS_API_KEY="your-nanonets-key"     # PDF extraction
OPENAI_API_KEY="your-openai-key"         # AI features
```

## 🚀 Deployment

The application automatically deploys to Vercel when you push to the main branch:
- **Production**: Automatic deployment from `main` branch
- **Preview**: Automatic deployment from feature branches
- **Environment**: Configured via Vercel dashboard

## 🔄 Migration Notes

This application was migrated from Railway + PlanetScale to Vercel + Supabase:

### ✅ Benefits
- **Unified Development**: Single server for frontend and API
- **Better Performance**: Serverless functions with auto-scaling
- **Simplified Deployment**: Git-based automatic deployments
- **Cost Effective**: Pay-per-use serverless model
- **Enhanced DX**: Hot reloading for both frontend and API

### 🔄 What Changed
- Express.js backend → Next.js API routes
- PlanetScale MySQL → Supabase PostgreSQL
- Railway deployment → Vercel deployment
- Separate servers → Unified Next.js server

All existing functionality is preserved with improved performance and developer experience.