# Vercel Deployment Checklist

Use this checklist to ensure proper deployment configuration for the PDF Data Extraction & Reporting System.

## Pre-Deployment Setup

### ✅ Supabase Configuration
- [ ] Supabase project created
- [ ] Database connection string obtained
- [ ] Service role key generated
- [ ] Database migrations applied (`npx prisma migrate deploy`)
- [ ] Database seeded (if applicable)

### ✅ Vercel Project Setup
- [ ] Vercel account created/accessed
- [ ] Git repository connected to Vercel
- [ ] Root directory set to `frontend`
- [ ] Framework preset detected as Next.js

### ✅ Environment Variables
- [ ] `DATABASE_URL` - Supabase connection string
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Service role key
- [ ] `JWT_SECRET` - Secure random string (32+ chars)
- [ ] `JWT_EXPIRES_IN` - Token expiration (e.g., "7d")
- [ ] `NANONETS_API_KEY` - PDF extraction service key
- [ ] `OPENAI_API_KEY` - AI service key (optional)
- [ ] `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage token

### ✅ Build Configuration
- [ ] `vercel.json` configured with function timeouts
- [ ] `package.json` build scripts updated with Prisma generation
- [ ] Environment variables mapped in `vercel.json`

## Deployment Process

### ✅ Initial Deployment
- [ ] Push code to main branch
- [ ] Verify automatic deployment triggers
- [ ] Check build logs for errors
- [ ] Confirm successful deployment

### ✅ Function Configuration
- [ ] Extract API timeout set to 50 seconds
- [ ] File operation APIs timeout set to 30 seconds
- [ ] Standard APIs timeout set to 10 seconds
- [ ] Function regions configured (iad1)

### ✅ Git Integration
- [ ] Production branch set to `main`
- [ ] Preview deployments enabled for PRs
- [ ] Automatic deployments working
- [ ] Branch protection rules configured (optional)

## Post-Deployment Verification

### ✅ Functionality Testing
- [ ] Homepage loads correctly
- [ ] User registration works
- [ ] User login works
- [ ] File upload functionality
- [ ] PDF extraction processing
- [ ] Data retrieval and display
- [ ] Report generation
- [ ] Brand management features

### ✅ API Endpoints Testing
- [ ] `GET /api/auth/me` - User profile
- [ ] `POST /api/auth/login` - Authentication
- [ ] `POST /api/auth/register` - User registration
- [ ] `POST /api/extract` - PDF processing
- [ ] `GET /api/files` - File listing
- [ ] `POST /api/files` - File upload
- [ ] `GET /api/data/*` - Data retrieval
- [ ] `GET /api/reports/*` - Report generation
- [ ] `GET /api/brands/*` - Brand management

### ✅ Performance Verification
- [ ] Page load times acceptable
- [ ] API response times within limits
- [ ] File upload/processing works for various sizes
- [ ] No timeout errors for normal operations
- [ ] Memory usage within limits

### ✅ Error Handling
- [ ] 404 pages display correctly
- [ ] API errors return proper status codes
- [ ] Database connection errors handled
- [ ] File upload errors handled gracefully
- [ ] Function timeout errors handled

## Monitoring Setup

### ✅ Vercel Analytics
- [ ] Analytics enabled in Vercel dashboard
- [ ] Performance metrics being collected
- [ ] Error tracking active
- [ ] Function logs accessible

### ✅ Database Monitoring
- [ ] Supabase dashboard access confirmed
- [ ] Database performance metrics available
- [ ] Connection pooling configured
- [ ] Backup strategy in place

## Security Verification

### ✅ Environment Security
- [ ] No secrets committed to Git
- [ ] Environment variables properly scoped
- [ ] API keys rotated and secure
- [ ] Database access restricted

### ✅ Application Security
- [ ] JWT tokens working correctly
- [ ] User authentication enforced
- [ ] File upload restrictions in place
- [ ] CORS policies configured
- [ ] Rate limiting considered

## Maintenance Setup

### ✅ Documentation
- [ ] Deployment guide accessible
- [ ] Environment variables documented
- [ ] Troubleshooting guide available
- [ ] API documentation updated

### ✅ Backup and Recovery
- [ ] Database backup strategy
- [ ] File storage backup plan
- [ ] Disaster recovery procedures
- [ ] Rollback procedures documented

## Troubleshooting Common Issues

### Build Failures
- Check environment variables are set for build environment
- Verify DATABASE_URL is accessible during build
- Ensure all dependencies are properly installed
- Check Prisma schema validity

### Function Timeouts
- Monitor function execution times
- Optimize slow operations
- Consider background processing for large files
- Implement proper timeout handling

### Database Issues
- Verify connection string format
- Check Supabase project status
- Monitor connection pool usage
- Validate migration status

### File Upload Problems
- Check Vercel Blob configuration
- Verify file size limits
- Monitor storage usage
- Test with various file types

## Success Criteria

✅ **Deployment Complete When:**
- [ ] All checklist items completed
- [ ] Application fully functional
- [ ] No critical errors in logs
- [ ] Performance meets requirements
- [ ] Security measures in place
- [ ] Monitoring active
- [ ] Documentation updated

---

**Last Updated:** $(date)
**Deployment Environment:** Production
**Vercel Project:** [Your Project Name]
**Supabase Project:** [Your Project Name]