# Development Guide - Vercel + Supabase Architecture

This guide covers local development for the PDF Data Extraction & Reporting System after migration to the Vercel + Supabase architecture.

## Architecture Overview

The application now uses a unified Next.js architecture:
- **Frontend**: Next.js React application
- **Backend**: Next.js API routes (serverless functions)
- **Database**: Supabase PostgreSQL
- **Storage**: Vercel Blob Storage or Supabase Storage
- **Deployment**: Vercel with Git integration

## Prerequisites

1. **Node.js** (v18+ recommended)
2. **npm** package manager
3. **Git** for version control
4. **Supabase account** (database is already configured)

## Quick Start

### 1. Clone and Install
```bash
git clone <repository-url>
cd pdf-extraction-system
npm run install:all
```

### 2. Environment Setup
The application uses environment files in the `frontend/` directory:
- `.env.development` - Development defaults
- `.env.local` - Local overrides (already configured)

### 3. Database Setup
```bash
cd frontend
npm run db:setup
```
This will:
- Generate Prisma client
- Run database migrations
- Connect to Supabase

### 4. Start Development Server
```bash
# Option 1: Use the root script
npm run dev

# Option 2: Use the batch file (Windows)
start-app.bat

# Option 3: Use PowerShell script
./start-servers.ps1

# Option 4: Manual start
cd frontend
npm run dev
```

### 5. Access the Application
- **Application**: http://localhost:3000
- **API Routes**: http://localhost:3000/api/*
- **Health Check**: http://localhost:3000/api/health

## Development Features

### Hot Reloading
The development server supports hot reloading for:
- ✅ Frontend React components
- ✅ Next.js API routes
- ✅ TypeScript files
- ✅ CSS/Tailwind changes

### API Routes Structure
```
frontend/pages/api/
├── auth/
│   ├── login.ts
│   ├── register.ts
│   └── me.ts
├── files/
│   ├── index.ts
│   └── [id].ts
├── data/
│   └── [...data].ts
├── reports/
│   └── [...reports].ts
├── brands/
│   ├── divisions/
│   ├── search.ts
│   ├── identify.ts
│   └── stats.ts
├── extract.ts
└── health.ts
```

### Database Management

#### Prisma Commands
```bash
cd frontend

# Generate Prisma client
npm run prisma:generate

# Run migrations (development)
npm run prisma:migrate:dev

# Deploy migrations (production-like)
npm run prisma:migrate

# Open Prisma Studio
npm run prisma:studio

# Reset database (careful!)
npm run prisma:reset
```

#### Database Connection
The application connects to Supabase PostgreSQL using the `DATABASE_URL` in your `.env.local` file.

### Environment Variables

#### Required Variables
```bash
# Database
DATABASE_URL="postgresql://postgres:password@host:5432/postgres"

# Authentication
JWT_SECRET="your-secure-secret"
JWT_EXPIRES_IN="7d"

# External APIs
NANONETS_API_KEY="your-nanonets-key"
OPENAI_API_KEY="your-openai-key"

# Supabase (if using Supabase storage)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

#### Optional Variables
```bash
# Storage
STORAGE_PROVIDER="vercel"  # or "supabase"
BLOB_READ_WRITE_TOKEN="vercel-blob-token"

# Development
LOG_LEVEL="debug"
NODE_ENV="development"
```

## Development Workflow

### 1. Making Changes
- Frontend changes: Edit files in `frontend/src/`
- API changes: Edit files in `frontend/pages/api/`
- Database changes: Create migrations with `npm run prisma:migrate:dev`

### 2. Testing
```bash
cd frontend

# Test API utilities
npm run test:api

# Health check
npm run health:check

# Manual API testing
curl http://localhost:3000/api/health
```

### 3. Debugging
```bash
# Start with Node.js debugger
npm run dev:debug

# Then attach your debugger to localhost:9229
```

## Common Development Tasks

### Adding New API Routes
1. Create file in `frontend/pages/api/`
2. Use Next.js API route format:
```typescript
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Your API logic here
}
```

### Database Schema Changes
1. Edit `frontend/prisma/schema.prisma`
2. Create migration: `npm run prisma:migrate:dev`
3. Generate client: `npm run prisma:generate`

### Adding Environment Variables
1. Add to `frontend/.env.development` (defaults)
2. Add to `frontend/.env.local` (local overrides)
3. Add to `frontend/.env.example` (documentation)

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
npm run dev -- -p 3001
```

#### Database Connection Issues
1. Check `DATABASE_URL` in `.env.local`
2. Verify Supabase project is active
3. Run `npm run prisma:generate`

#### API Routes Not Working
1. Check file is in `frontend/pages/api/`
2. Verify export default function
3. Check browser network tab for errors

#### Hot Reloading Not Working
1. Restart development server
2. Clear Next.js cache: `rm -rf frontend/.next`
3. Check file watchers aren't at limit

### Getting Help
1. Check browser console for errors
2. Check terminal output for server errors
3. Use `npm run health:check` to verify API
4. Check Prisma Studio for database issues

## Production Deployment

The application automatically deploys to Vercel when you push to the main branch. See `VERCEL_DEPLOYMENT_GUIDE.md` for details.

## Migration Notes

This application was migrated from a separate Express.js backend to Next.js API routes. Key changes:
- Backend routes → API routes in `frontend/pages/api/`
- PlanetScale → Supabase PostgreSQL
- Railway deployment → Vercel deployment
- Separate servers → Unified Next.js server

The migration maintains all existing functionality while simplifying the development and deployment process.