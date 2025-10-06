# 🚨 CRITICAL SECURITY ALERT

## ⚠️ EXPOSED API KEYS DETECTED

### What Was Found

Your `.env.local` file contains **REAL API KEYS** that have been committed to git:

1. **Nanonets API Key**: `a0a55141-****-****-****-************` (REDACTED)
2. **OCR.space API Key**: `K828776*********` (REDACTED)
3. **OpenAI API Key**: `sk-proj-****...` (REDACTED)
4. **Hugging Face Token**: `hf_BYskc*****...` (REDACTED)
5. **Supabase Service Role Key**: (JWT token exposed - REDACTED)
6. **Database Password**: `Nxreport****` (REDACTED)

### Risk Level: 🔴 CRITICAL

These keys are visible in:
- Git history
- GitHub repository (if pushed)
- Any clones of the repository
- Code review tools

### Immediate Actions Required

## Step 1: Stop Using These Keys Immediately ⚠️

**DO NOT DEPLOY** until all keys are rotated!

## Step 2: Rotate All API Keys

### Nanonets
1. Go to https://app.nanonets.com/
2. Navigate to Settings → API Keys
3. Revoke the exposed key (starts with `a0a55141...`)
4. Generate new API key
5. Update environment variables

### OCR.space
1. Go to https://ocr.space/ocrapi
2. Navigate to your account settings
3. Revoke the exposed key (starts with `K828776...`)
4. Generate new API key
5. Update environment variables

### OpenAI
1. Go to https://platform.openai.com/api-keys
2. Find and revoke the exposed key (starts with `sk-proj-...`)
3. Generate new API key
4. Update environment variables
5. **IMPORTANT**: Check your usage/billing for unauthorized access

### Hugging Face
1. Go to https://huggingface.co/settings/tokens
2. Revoke the exposed token (starts with `hf_BYskc...`)
3. Generate new token
4. Update environment variables

### Supabase
1. Go to your Supabase project settings
2. Navigate to API settings
3. Rotate the service role key
4. Update environment variables
5. Consider changing database password

## Step 3: Remove Keys from Git History

```bash
# WARNING: This rewrites git history!
# Coordinate with your team before running

# Option 1: Use BFG Repo-Cleaner (Recommended)
# Download from: https://rtyley.github.io/bfg-repo-cleaner/
java -jar bfg.jar --replace-text passwords.txt

# Option 2: Use git filter-branch (Manual)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch frontend/.env.local" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (DANGEROUS - coordinate with team!)
git push origin --force --all
git push origin --force --tags
```

## Step 4: Secure Environment Variables

### Update .gitignore
```bash
# Verify .env.local is ignored
cat .gitignore | grep ".env.local"

# If not present, add it
echo ".env.local" >> .gitignore
echo "*.env.local" >> .gitignore
```

### Create Secure .env.local
```bash
# Backup current file (for reference only)
cp frontend/.env.local frontend/.env.local.backup

# Create new secure file from template
cp frontend/.env.example frontend/.env.local

# Edit with new keys
# DO NOT commit this file!
```

## Step 5: Update Vercel Environment Variables

1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Update ALL the following with NEW keys:
   - `NANONETS_API_KEY`
   - `OCR_SPACE_API_KEY`
   - `OPENAI_API_KEY`
   - `HUGGINGFACE_API_TOKEN`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DATABASE_URL`
   - `JWT_SECRET`

## Step 6: Generate New JWT Secret

```bash
# Generate a strong random secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Add to .env.local and Vercel
```

## Step 7: Monitor for Unauthorized Usage

### Check API Usage

**Nanonets:**
- Check usage dashboard for unusual activity
- Look for requests from unknown IPs

**OCR.space:**
- Check request logs
- Monitor for rate limit hits

**OpenAI:**
- **CRITICAL**: Check billing immediately
- Look for unusual API calls
- Check usage by date

**Hugging Face:**
- Check model access logs
- Look for unusual activity

### Set Up Alerts

1. Enable billing alerts on all services
2. Set up usage notifications
3. Monitor error logs for authentication failures

## Step 8: Verify Security

```bash
# Check git status
git status

# Verify .env.local is not tracked
git ls-files | grep ".env.local"
# Should return: nothing

# Check for keys in current files
grep -r "a0a55141" .
grep -r "K82877653688957" .
grep -r "sk-proj-" .
# Should only find them in this security alert file

# Verify .gitignore
cat .gitignore | grep -E "\.env\.local|\.env$"
```

## Checklist

- [ ] All API keys rotated
- [ ] Old keys revoked
- [ ] New keys added to .env.local
- [ ] .env.local NOT committed to git
- [ ] .gitignore updated
- [ ] Vercel environment variables updated
- [ ] JWT secret regenerated
- [ ] Git history cleaned (optional but recommended)
- [ ] Team notified
- [ ] API usage monitored
- [ ] Billing alerts set up

## Prevention for Future

1. **Never commit .env files**
   - Always use .env.example as template
   - Keep actual keys in .env.local only

2. **Use git hooks**
   ```bash
   # Create pre-commit hook
   cat > .git/hooks/pre-commit << 'EOF'
   #!/bin/bash
   if git diff --cached --name-only | grep -E "\.env\.local$"; then
     echo "ERROR: Attempting to commit .env.local file!"
     echo "This file contains secrets and should not be committed."
     exit 1
   fi
   EOF
   chmod +x .git/hooks/pre-commit
   ```

3. **Use secret scanning**
   - Enable GitHub secret scanning
   - Use tools like git-secrets or truffleHog

4. **Regular audits**
   - Review environment variables monthly
   - Rotate keys every 90 days
   - Check for exposed secrets

## Cost Impact

### Potential Costs from Exposed Keys

**OpenAI** (Highest Risk):
- Could incur significant charges if key is used
- Check billing immediately
- Set spending limits

**Nanonets**:
- Paid service - could incur charges
- Check usage dashboard

**OCR.space**:
- Free tier has limits
- Minimal financial risk

**Hugging Face**:
- Free tier available
- Minimal financial risk

### Recommended Actions

1. **Check OpenAI billing NOW**
2. Set spending limits on all services
3. Enable billing alerts
4. Consider filing disputes if unauthorized usage found

## Support Contacts

- **OpenAI Support**: https://help.openai.com/
- **Nanonets Support**: support@nanonets.com
- **OCR.space Support**: https://ocr.space/contact
- **Hugging Face Support**: https://huggingface.co/support
- **Supabase Support**: https://supabase.com/support

## Timeline

1. **Immediate** (Next 1 hour):
   - [ ] Check OpenAI billing
   - [ ] Rotate all API keys
   - [ ] Update Vercel environment variables

2. **Today**:
   - [ ] Monitor API usage
   - [ ] Set up billing alerts
   - [ ] Update .gitignore
   - [ ] Create secure .env.local

3. **This Week**:
   - [ ] Clean git history (optional)
   - [ ] Set up git hooks
   - [ ] Enable secret scanning
   - [ ] Document incident

## Status

- **Discovered**: January 2025
- **Severity**: CRITICAL
- **Status**: ⚠️ UNRESOLVED - Action Required
- **Responsible**: Development Team

---

**DO NOT DEPLOY UNTIL ALL KEYS ARE ROTATED!**

---

Last Updated: January 2025
