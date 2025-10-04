# Development Environment Checklist

Use this checklist to verify your development environment is properly configured for the new Vercel + Supabase architecture.

## ✅ Pre-Development Setup

### 1. Dependencies
- [ ] Node.js v18+ installed
- [ ] npm package manager available
- [ ] Git configured for version control

### 2. Project Setup
- [ ] Repository cloned
- [ ] Dependencies installed (`npm run install:all`)
- [ ] Environment files configured

### 3. Environment Configuration
- [ ] `frontend/.env.local` exists with correct values
- [ ] `frontend/.env.development` exists
- [ ] `DATABASE_URL` points to Supabase
- [ ] `JWT_SECRET` is configured
- [ ] External API keys are set (NANONETS_API_KEY, OPENAI_API_KEY)

### 4. Database Setup
- [ ] Prisma client generated (`npm run prisma:generate`)
- [ ] Database migrations applied (`npm run prisma:migrate`)
- [ ] Database connection verified

## ✅ Development Server

### 1. Server Startup
- [ ] Development server starts without errors (`npm run dev`)
- [ ] Application accessible at http://localhost:3000
- [ ] No console errors in terminal
- [ ] No browser console errors

### 2. API Routes Testing
- [ ] Health check works: http://localhost:3000/api/health
- [ ] Dev test endpoint works: http://localhost:3000/api/dev-test
- [ ] Authentication routes accessible
- [ ] File upload routes accessible

### 3. Hot Reloading Verification
- [ ] Frontend changes reload automatically
- [ ] API route changes reload automatically
- [ ] TypeScript compilation works
- [ ] CSS/Tailwind changes apply instantly

## ✅ Feature Testing

### 1. Core Functionality
- [ ] User registration works
- [ ] User login works
- [ ] File upload interface loads
- [ ] PDF extraction API responds
- [ ] Database operations work

### 2. Development Tools
- [ ] Prisma Studio opens (`npm run prisma:studio`)
- [ ] Development test script runs (`npm run test:dev`)
- [ ] Health check script works (`npm run health:check`)

## ✅ Troubleshooting Checks

### Common Issues Resolution
- [ ] Port 3000 is available (or alternative port configured)
- [ ] Database connection string is correct
- [ ] Environment variables are loaded
- [ ] File permissions are correct
- [ ] Node modules are properly installed

### Performance Checks
- [ ] Server starts in reasonable time (< 30 seconds)
- [ ] Hot reload responds quickly (< 3 seconds)
- [ ] API responses are fast (< 2 seconds for simple requests)
- [ ] No memory leaks during development

## ✅ Development Workflow

### Daily Development
- [ ] Start server with `npm run dev` or `start-app.bat`
- [ ] Verify health check before starting work
- [ ] Test hot reloading after major changes
- [ ] Check browser console for errors
- [ ] Monitor terminal for warnings

### Code Changes
- [ ] Frontend changes: Edit files in `frontend/src/`
- [ ] API changes: Edit files in `frontend/pages/api/`
- [ ] Database changes: Create migrations with Prisma
- [ ] Environment changes: Update `.env.local`

### Testing Changes
- [ ] Use browser dev tools for frontend debugging
- [ ] Use API endpoints directly for backend testing
- [ ] Use Prisma Studio for database inspection
- [ ] Use development test component for integration testing

## 🚀 Ready for Development

When all items above are checked, your development environment is ready!

### Quick Start Commands
```bash
# Start development
npm run dev

# Test environment
npm run test:dev

# Database management
cd frontend && npm run prisma:studio

# Health check
npm run health:check
```

### Useful URLs
- **Application**: http://localhost:3000
- **API Health**: http://localhost:3000/api/health
- **Dev Test**: http://localhost:3000/api/dev-test
- **Prisma Studio**: http://localhost:5555 (when running)

### Getting Help
- Check `DEVELOPMENT.md` for detailed information
- Check `RUNNING.md` for troubleshooting
- Use `npm run test:dev` to diagnose issues
- Check browser and terminal console for errors