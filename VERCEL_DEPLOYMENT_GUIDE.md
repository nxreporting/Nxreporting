# Vercel Deployment Configuration Guide

This guide covers the complete setup for deploying the PDF Data Extraction & Reporting System on Vercel with Supabase.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Supabase Project**: Create a project at [supabase.com](https://supabase.com)
3. **Git Repository**: Code should be in a Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Supabase Database Setup

1. Create a new Supabase project
2. Go to Settings > Database and copy the connection string
3. Run database migrations:
   ```bash
   cd frontend
   npx prisma migrate deploy
   ```

## Step 2: Vercel Project Setup

### Import Project
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your Git repository
4. Set **Root Directory** to `frontend`
5. **Framework Preset** should auto-detect as "Next.js"

### Build Configuration
- **Build Command**: `npm run build` (automatically uses our enhanced build script)
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install` (default)

## Step 3: Environment Variables Configuration

Go to your Vercel project > Settings > Environment Variables and add:

### Database & Supabase
```
DATABASE_URL = postgresql://postgres:[password]@[project-ref].supabase.co:5432/postgres
NEXT_PUBLIC_SUPABASE_URL = https://[project-ref].supabase.co
SUPABASE_SERVICE_ROLE_KEY = [service-role-key]
```

### Authentication
```
JWT_SECRET = [generate-secure-32-char-string]
JWT_EXPIRES_IN = 7d
```

### External APIs
```
NANONETS_API_KEY = [your-nanonets-api-key]
OPENAI_API_KEY = [your-openai-api-key]
```

### File Storage
```
BLOB_READ_WRITE_TOKEN = [vercel-blob-token]
```

**Important**: Set all variables for "Production", "Preview", and "Development" environments.

## Step 4: Git Integration Setup

### Automatic Deployments
1. In Vercel dashboard, go to Settings > Git
2. Ensure "Production Branch" is set to `main`
3. Enable "Preview Deployments" for pull requests
4. Configure branch patterns if needed

### Deployment Triggers
- **Production**: Push to `main` branch
- **Preview**: Push to any other branch or create pull request
- **Manual**: Use Vercel CLI or dashboard

## Step 5: Function Configuration

The `vercel.json` file is already configured with:
- **Extract API**: 50-second timeout for PDF processing
- **File APIs**: 30-second timeout for file operations
- **Other APIs**: 10-second timeout for standard operations

## Step 6: Domain Configuration

### Custom Domain (Optional)
1. Go to Settings > Domains
2. Add your custom domain
3. Configure DNS records as instructed
4. SSL certificates are automatically provisioned

## Step 7: Monitoring and Logs

### Access Logs
- **Real-time**: Vercel dashboard > Functions tab
- **Analytics**: Built-in Vercel Analytics
- **Errors**: Automatic error tracking and alerts

### Performance Monitoring
- Function execution times
- Memory usage
- Cold start metrics
- Error rates

## Step 8: Database Migrations

### Production Migrations
Migrations run automatically during build via `postbuild` script:
```json
"postbuild": "prisma migrate deploy"
```

### Manual Migration (if needed)
```bash
vercel env pull .env.local
npx prisma migrate deploy
```

## Step 9: Testing Deployment

### Verify Functionality
1. **Authentication**: Test login/register
2. **File Upload**: Upload and process a PDF
3. **Data Extraction**: Verify extraction results
4. **API Endpoints**: Test all API routes
5. **Database**: Confirm data persistence

### Performance Testing
- Test with various file sizes
- Monitor function execution times
- Verify timeout handling

## Troubleshooting

### Common Issues

**Build Failures**
- Check environment variables are set
- Verify DATABASE_URL is accessible during build
- Ensure Prisma schema is valid

**Function Timeouts**
- Large files may exceed timeout limits
- Consider implementing background processing
- Monitor function execution times

**Database Connection Issues**
- Verify Supabase connection string
- Check connection pooling settings
- Ensure database is accessible from Vercel

**Environment Variable Issues**
- Variables must be set for all environments
- Restart deployment after adding variables
- Check variable names match exactly

### Support Resources
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Supabase Documentation](https://supabase.com/docs)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)

## Security Considerations

1. **Environment Variables**: Never commit secrets to Git
2. **API Keys**: Rotate keys regularly
3. **Database Access**: Use service role key only for server-side operations
4. **CORS**: Configure appropriate CORS policies
5. **Rate Limiting**: Implement rate limiting for public APIs

## Maintenance

### Regular Tasks
- Monitor function performance
- Update dependencies
- Review error logs
- Backup database regularly
- Test disaster recovery procedures

### Scaling Considerations
- Monitor function concurrency limits
- Consider upgrading Vercel plan for higher limits
- Implement caching strategies
- Optimize database queries