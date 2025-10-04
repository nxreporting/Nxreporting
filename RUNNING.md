# NX Reporting - Running the Application (Vercel + Supabase Architecture)

## Prerequisites
1. **Node.js** (v18+ recommended)
2. **npm** package manager
3. **Supabase account** (database already configured)

## Quick Start

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Environment Setup
The application uses environment files in the `frontend/` directory:
- `.env.development` - Development defaults
- `.env.local` - Local overrides (already configured with Supabase)

### 3. Database Setup
```bash
cd frontend
npm run db:setup
```

### 4. Start Development Server

#### Option 1: Using the provided scripts
- **Windows**: Double-click `start-app.bat`
- **PowerShell**: Run `./start-servers.ps1`
- **Cross-platform**: Run `npm run dev` from project root

#### Option 2: Manual start
```bash
cd frontend
npm run dev
```

### 5. Accessing the Application
- **Application**: http://localhost:3000
- **API Routes**: http://localhost:3000/api/*
- **Health Check**: http://localhost:3000/api/health
- **Database Studio**: `npm run prisma:studio` (from frontend directory)

## Architecture Changes

### New Unified Architecture
- ✅ **Frontend + Backend**: Single Next.js application
- ✅ **API Routes**: Serverless functions in `/pages/api/`
- ✅ **Database**: Supabase PostgreSQL
- ✅ **Storage**: Vercel Blob or Supabase Storage
- ✅ **Deployment**: Vercel with Git integration

### What Changed
- ❌ **Old**: Separate Express.js backend on Railway
- ❌ **Old**: PlanetScale MySQL database
- ❌ **Old**: Manual deployment process
- ✅ **New**: Next.js API routes (serverless)
- ✅ **New**: Supabase PostgreSQL
- ✅ **New**: Automatic Vercel deployment

## Development Features

### Hot Reloading
The development server supports hot reloading for:
- React components and pages
- Next.js API routes
- TypeScript files
- CSS and Tailwind changes

### Available Scripts
```bash
# Development
npm run dev              # Start development server
npm run dev:debug        # Start with Node.js debugger

# Database
npm run db:setup         # Setup database (generate + migrate)
npm run prisma:studio    # Open database browser
npm run prisma:migrate:dev  # Create new migration

# Testing
npm run test:api         # Test API utilities
npm run health:check     # Check API health

# Building
npm run build           # Build for production
npm run start           # Start production server
```

## Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
npx kill-port 3000
# Or use different port
npm run dev -- -p 3001
```

#### 2. Database Connection Issues
- Check `DATABASE_URL` in `frontend/.env.local`
- Verify Supabase project is active
- Run `npm run prisma:generate`

#### 3. API Routes Not Working
- Ensure files are in `frontend/pages/api/`
- Check browser network tab for errors
- Verify API route exports default function

#### 4. Environment Variables
- Check `frontend/.env.local` exists
- Verify all required variables are set
- Restart development server after changes

### Health Checks
```bash
# Check if application is running
curl http://localhost:3000/api/health

# Check database connection
cd frontend && npm run prisma:studio
```

### Getting Help
1. Check browser console for frontend errors
2. Check terminal output for server errors
3. Use health check endpoint to verify API
4. Check Prisma Studio for database issues

## Migration Notes

This application was migrated from Railway + PlanetScale to Vercel + Supabase:

### Benefits of New Architecture
- **Simplified Development**: Single server for frontend and API
- **Better Performance**: Serverless functions scale automatically
- **Easier Deployment**: Git-based automatic deployments
- **Cost Effective**: Pay-per-use serverless model
- **Better DX**: Hot reloading for both frontend and API

### Compatibility
All existing functionality is preserved:
- User authentication and management
- PDF upload and extraction
- Data processing and reporting
- Brand management features

For detailed development information, see `DEVELOPMENT.md`.