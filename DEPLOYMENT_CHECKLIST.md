# OCR Service Deployment Checklist

## ✅ Pre-Deployment Verification

### 1. Code Changes
- [x] New service created: `frontend/lib/services/multiProviderOCRService.ts`
- [x] API routes updated: `frontend/pages/api/extract.ts`
- [x] API routes updated: `frontend/pages/api/extract-simple.ts`
- [x] Environment template created: `frontend/.env.example`
- [x] Documentation created (5 files)

### 2. Security
- [ ] Remove API keys from `.env.local` if committed to git
- [ ] Verify `.env.local` is in `.gitignore`
- [ ] Generate new JWT secret
- [ ] Update Vercel environment variables
- [ ] Rotate exposed API keys

### 3. Environment Variables
- [ ] Copy `.env.example` to `.env.local`
- [ ] Add OCR.space API key
- [ ] Add Nanonets API key (optional)
- [ ] Add Nanonets model ID (optional)
- [ ] Generate strong JWT secret
- [ ] Verify all required variables are set

### 4. Testing
- [ ] Test with small PDF (<5MB)
- [ ] Test with large PDF (>5MB)
- [ ] Test with invalid file
- [ ] Verify OCR.space works
- [ ] Verify Nanonets works (if configured)
- [ ] Test fallback mechanism
- [ ] Check logs for errors
- [ ] Verify analytics tracking

---

## 🚀 Deployment Steps

### Step 1: Local Testing
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Test extraction
# Upload a PDF at http://localhost:3000/upload
```

### Step 2: Update Environment Variables

**Vercel Dashboard:**
1. Go to your project settings
2. Navigate to Environment Variables
3. Add/Update:
   ```
   OCR_SPACE_API_KEY=your-key
   NANONETS_API_KEY=your-key (optional)
   NANONETS_MODEL_ID=your-model-id (optional)
   JWT_SECRET=your-new-secret
   ```

### Step 3: Deploy to Staging
```bash
git checkout staging
git merge main
git push origin staging
```

**Verify on Staging:**
- [ ] Upload test PDF
- [ ] Check extraction works
- [ ] Verify correct provider is used
- [ ] Check logs in Vercel dashboard
- [ ] Monitor error rates

### Step 4: Deploy to Production
```bash
git checkout main
git push origin main
# Vercel auto-deploys
```

**Verify on Production:**
- [ ] Upload test PDF
- [ ] Check extraction works
- [ ] Monitor error rates
- [ ] Check analytics
- [ ] Verify performance

---

## 🔒 Security Verification

### API Key Security
```bash
# 1. Check git history for exposed keys
git log -p | grep -i "api.*key"

# 2. If keys found, rotate them immediately
# - Generate new keys from provider dashboards
# - Update environment variables
# - Revoke old keys

# 3. Verify .gitignore
cat .gitignore | grep ".env.local"

# 4. Check current .env.local is not tracked
git status | grep ".env.local"
# Should show: nothing (not tracked)
```

### JWT Secret
```bash
# Generate new strong secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Update in .env.local and Vercel
```

---

## 📊 Monitoring Setup

### 1. Vercel Analytics
```typescript
// Already integrated in the service
// Verify events are being tracked
```

### 2. Error Monitoring
```bash
# Check Vercel logs
vercel logs --follow

# Look for:
# - "✅ OCR.space: Success"
# - "❌ Provider: Failed"
# - Error messages
```

### 3. Performance Monitoring
```bash
# Monitor these metrics:
# - Average extraction time
# - Success rate per provider
# - Retry attempt frequency
# - File size distribution
```

---

## 🧪 Post-Deployment Testing

### Test Cases

#### 1. Small PDF (<5MB)
```bash
# Expected:
# - Uses base64 encoding
# - Completes in 2-3 seconds
# - Success rate >95%
```

#### 2. Large PDF (>5MB)
```bash
# Expected:
# - Uses multipart upload
# - Completes in 4-8 seconds
# - Success rate >90%
```

#### 3. Invalid File
```bash
# Expected:
# - Returns validation error
# - No provider called
# - Clear error message
```

#### 4. Provider Fallback
```bash
# Test by temporarily removing API keys
# Expected:
# - Tries Nanonets (fails)
# - Falls back to OCR.space
# - Or uses Fallback if all fail
```

#### 5. Retry Logic
```bash
# Simulate by causing temporary failures
# Expected:
# - 3 attempts with exponential backoff
# - Logs show retry attempts
# - Eventually succeeds or moves to next provider
```

---

## 📈 Success Metrics

### Performance Targets
- [ ] Average extraction time: <5 seconds
- [ ] Success rate: >95%
- [ ] P95 latency: <10 seconds
- [ ] Memory usage: <512MB per request

### Provider Usage
- [ ] OCR.space: Primary provider (>80% of requests)
- [ ] Nanonets: Secondary (if configured)
- [ ] Fallback: <1% of requests

### Error Rates
- [ ] Overall error rate: <5%
- [ ] Timeout rate: <2%
- [ ] Provider failure rate: <3%

---

## 🐛 Troubleshooting

### Issue: Extraction Always Fails

**Check:**
```bash
# 1. Verify API keys
echo $OCR_SPACE_API_KEY

# 2. Test API manually
curl -X POST https://api.ocr.space/parse/image \
  -F "apikey=$OCR_SPACE_API_KEY" \
  -F "file=@test.pdf"

# 3. Check logs
vercel logs --follow | grep "OCR"
```

### Issue: Wrong Provider Used

**Check:**
```bash
# 1. Check provider configuration
# In multiProviderOCRService.ts, verify provider order

# 2. Check API key configuration
# Nanonets should be tried first if configured

# 3. Check logs for provider attempts
# Should see: "🔄 Nanonets: Attempting..."
```

### Issue: Slow Extraction

**Check:**
```bash
# 1. Check file size
ls -lh uploaded-file.pdf

# 2. Check network latency
ping api.ocr.space

# 3. Check retry attempts
# Look for: "⏳ Retry attempt X/3"

# 4. Consider increasing timeout
# In extract.ts, increase timeout value
```

---

## 📚 Documentation Checklist

### Created Files
- [x] `multiProviderOCRService.ts` - New service
- [x] `.env.example` - Environment template
- [x] `MIGRATION_GUIDE_OCR_SERVICE.md` - Migration guide
- [x] `README_OCR_SERVICE.md` - API documentation
- [x] `OCR_SERVICE_IMPROVEMENTS_SUMMARY.md` - Summary
- [x] `OCR_SERVICE_QUICK_REFERENCE.md` - Quick reference
- [x] `DEPLOYMENT_CHECKLIST.md` - This file

### Updated Files
- [x] `frontend/pages/api/extract.ts`
- [x] `frontend/pages/api/extract-simple.ts`

### Documentation Review
- [ ] All documentation is accurate
- [ ] Code examples work
- [ ] Links are correct
- [ ] Troubleshooting covers common issues

---

## 🔄 Rollback Plan

### If Issues Occur

#### Option 1: Quick Rollback (Vercel)
```bash
# Rollback to previous deployment
vercel rollback
```

#### Option 2: Code Revert
```bash
# Revert the changes
git revert HEAD
git push origin main
```

#### Option 3: Restore Old Service
```bash
# Keep old nanonetsExtractionService.ts as backup
# Can quickly switch imports back if needed
```

---

## ✅ Final Verification

### Before Marking Complete

- [ ] All code changes deployed
- [ ] Environment variables updated
- [ ] API keys rotated (if exposed)
- [ ] Testing completed successfully
- [ ] Monitoring configured
- [ ] Documentation reviewed
- [ ] Team notified of changes
- [ ] Rollback plan documented

### Success Criteria

- [ ] Extraction works in production
- [ ] Correct provider is used
- [ ] Performance meets targets
- [ ] Error rates are acceptable
- [ ] Logs are clear and helpful
- [ ] Analytics tracking works
- [ ] Security audit passed

---

## 📞 Support Contacts

### If You Need Help

1. **Check Documentation:**
   - Migration Guide
   - API Documentation
   - Troubleshooting Guide

2. **Check Logs:**
   ```bash
   vercel logs --follow
   ```

3. **Test Providers:**
   ```bash
   # OCR.space
   curl -X POST https://api.ocr.space/parse/image \
     -F "apikey=$OCR_SPACE_API_KEY" \
     -F "file=@test.pdf"
   
   # Nanonets
   curl -X POST https://app.nanonets.com/api/v2/OCR/Model/$MODEL_ID/LabelFile/ \
     -H "Authorization: Basic $(echo -n '$API_KEY:' | base64)" \
     -F "file=@test.pdf"
   ```

4. **Provider Status:**
   - OCR.space: https://status.ocr.space/
   - Nanonets: https://status.nanonets.com/

---

## 🎉 Completion

Once all items are checked:

1. Mark deployment as complete
2. Monitor for 24 hours
3. Review metrics and logs
4. Document any issues found
5. Plan next improvements

---

**Deployment Date**: _____________
**Deployed By**: _____________
**Status**: ⬜ In Progress | ⬜ Complete | ⬜ Rolled Back
**Notes**: _____________________________________________

---

**Version**: 2.0.0
**Last Updated**: January 2025
