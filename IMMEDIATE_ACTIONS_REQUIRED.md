# 🚨 IMMEDIATE ACTIONS REQUIRED

## ⚠️ CRITICAL SECURITY INCIDENT

**Status**: 🔴 ACTIVE - Requires Immediate Action  
**Severity**: CRITICAL  
**Discovered**: January 2025

---

## 📋 Quick Action Checklist

### ⏰ DO THIS NOW (Next 30 Minutes)

- [ ] **1. Check OpenAI Billing** 🔴 URGENT
  - Go to: https://platform.openai.com/usage
  - Check for unauthorized usage
  - Look for unusual spikes
  - If found, contact OpenAI support immediately

- [ ] **2. Revoke Exposed Keys** 🔴 URGENT
  - [ ] Nanonets: https://app.nanonets.com/ → Settings → API Keys
  - [ ] OCR.space: https://ocr.space/ocrapi → Account
  - [ ] OpenAI: https://platform.openai.com/api-keys
  - [ ] Hugging Face: https://huggingface.co/settings/tokens
  - [ ] Supabase: Project Settings → API

- [ ] **3. Generate New Keys**
  - [ ] Nanonets: New API key
  - [ ] OCR.space: New API key
  - [ ] OpenAI: New API key
  - [ ] Hugging Face: New token
  - [ ] Supabase: Rotate service role key
  - [ ] JWT Secret: Run `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

### 📝 DO THIS TODAY (Next 2 Hours)

- [ ] **4. Update Local Environment**
  ```bash
  # Windows (PowerShell)
  .\setup-secure-environment.ps1
  
  # Mac/Linux
  bash setup-secure-environment.sh
  ```

- [ ] **5. Update Vercel Environment Variables**
  - Go to: https://vercel.com/dashboard
  - Select your project
  - Settings → Environment Variables
  - Update ALL keys with NEW values

- [ ] **6. Verify Security**
  ```bash
  # Check .env.local is not tracked
  git status frontend/.env.local
  # Should show: nothing
  
  # Verify .gitignore
  cat .gitignore | grep ".env.local"
  # Should show: .env.local
  ```

- [ ] **7. Test Application**
  ```bash
  npm run dev
  # Upload a test PDF
  # Verify extraction works
  ```

### 🔍 DO THIS WEEK

- [ ] **8. Monitor API Usage**
  - Check all provider dashboards daily
  - Look for unusual activity
  - Set up billing alerts

- [ ] **9. Clean Git History** (Optional but Recommended)
  - See: SECURITY_ALERT.md → "Step 3: Remove Keys from Git History"
  - Coordinate with team before running
  - Backup repository first

- [ ] **10. Document Incident**
  - What happened
  - When discovered
  - Actions taken
  - Lessons learned

---

## 🔑 Exposed Keys Summary

| Service | Exposed Key | Status | Action |
|---------|-------------|--------|--------|
| Nanonets | `a0a55141-...` | 🔴 EXPOSED | Revoke & Replace |
| OCR.space | `K82877653688957` | 🔴 EXPOSED | Revoke & Replace |
| OpenAI | `sk-proj-...` | 🔴 EXPOSED | Revoke & Replace |
| Hugging Face | `hf_BYskc...` | 🔴 EXPOSED | Revoke & Replace |
| Supabase | JWT token | 🔴 EXPOSED | Rotate |
| Database | Password in URL | 🔴 EXPOSED | Change Password |
| JWT Secret | Weak secret | 🔴 EXPOSED | Generate New |

---

## 🎯 Priority Actions

### 🔴 CRITICAL (Do First)
1. Check OpenAI billing
2. Revoke all exposed keys
3. Generate new keys

### 🟡 HIGH (Do Today)
4. Update .env.local
5. Update Vercel environment variables
6. Test application

### 🟢 MEDIUM (Do This Week)
7. Monitor API usage
8. Clean git history
9. Document incident

---

## 📞 Emergency Contacts

### If You Find Unauthorized Usage

**OpenAI** (Highest Risk):
- Support: https://help.openai.com/
- Report: support@openai.com
- Phone: Check their website

**Nanonets**:
- Support: support@nanonets.com

**OCR.space**:
- Support: https://ocr.space/contact

**Hugging Face**:
- Support: https://huggingface.co/support

**Supabase**:
- Support: https://supabase.com/support

---

## 🛠️ Quick Commands

### Generate New JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Check Git Status
```bash
git status frontend/.env.local
```

### Remove from Git Tracking
```bash
git rm --cached frontend/.env.local
git commit -m "Remove .env.local from git tracking"
```

### Verify .gitignore
```bash
cat .gitignore | grep ".env.local"
```

### Test API Keys
```bash
# OCR.space
curl -X POST https://api.ocr.space/parse/image \
  -F "apikey=YOUR_NEW_KEY" \
  -F "file=@test.pdf"

# Nanonets
curl -X POST https://app.nanonets.com/api/v2/OCR/Model/YOUR_MODEL_ID/LabelFile/ \
  -H "Authorization: Basic $(echo -n 'YOUR_NEW_KEY:' | base64)" \
  -F "file=@test.pdf"
```

---

## 📚 Related Documents

- **SECURITY_ALERT.md** - Detailed security incident report
- **DEPLOYMENT_CHECKLIST.md** - Full deployment checklist
- **setup-secure-environment.ps1** - Automated setup script (Windows)
- **setup-secure-environment.sh** - Automated setup script (Mac/Linux)

---

## ✅ Completion Checklist

Once all actions are complete:

- [ ] All old keys revoked
- [ ] New keys generated and tested
- [ ] .env.local updated with new keys
- [ ] .env.local NOT in git
- [ ] Vercel environment variables updated
- [ ] Application tested and working
- [ ] API usage monitored
- [ ] Billing alerts set up
- [ ] Team notified
- [ ] Incident documented

---

## 🎯 Success Criteria

You're done when:

1. ✅ All old keys are revoked
2. ✅ New keys are working
3. ✅ Application runs successfully
4. ✅ No exposed keys in git
5. ✅ Monitoring is in place

---

**DO NOT DEPLOY TO PRODUCTION UNTIL ALL ITEMS ARE CHECKED!**

---

**Last Updated**: January 2025  
**Status**: 🔴 ACTIVE - Action Required  
**Next Review**: After all actions completed
