# ============================================================================
# Secure Environment Setup Script (PowerShell)
# ============================================================================
# This script helps you set up a secure development environment
# after the API key exposure incident.
#
# Usage: .\setup-secure-environment.ps1
# ============================================================================

$ErrorActionPreference = "Stop"

Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "🔒 Secure Environment Setup" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  WARNING: This script will help you secure your environment after" -ForegroundColor Yellow
Write-Host "    the API key exposure incident." -ForegroundColor Yellow
Write-Host ""
Write-Host "Before running this script, you should have:"
Write-Host "  1. Rotated ALL API keys from provider dashboards"
Write-Host "  2. Revoked the old exposed keys"
Write-Host "  3. Generated new keys"
Write-Host ""
$confirm = Read-Host "Have you completed these steps? (yes/no)"

if ($confirm -ne "yes") {
    Write-Host ""
    Write-Host "❌ Please complete the key rotation first!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Follow these steps:"
    Write-Host "  1. Nanonets: https://app.nanonets.com/ → Settings → API Keys"
    Write-Host "  2. OCR.space: https://ocr.space/ocrapi → Account Settings"
    Write-Host "  3. OpenAI: https://platform.openai.com/api-keys"
    Write-Host "  4. Hugging Face: https://huggingface.co/settings/tokens"
    Write-Host "  5. Supabase: Project Settings → API → Rotate service role key"
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "Step 1: Verify .gitignore" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan

$gitignoreContent = Get-Content .gitignore -Raw
if ($gitignoreContent -notmatch "\.env\.local") {
    Write-Host "⚠️  Adding .env.local to .gitignore..." -ForegroundColor Yellow
    Add-Content .gitignore "`n# Environment files (NEVER commit these!)"
    Add-Content .gitignore ".env.local"
    Add-Content .gitignore "*.env.local"
    Write-Host "✅ Updated .gitignore" -ForegroundColor Green
} else {
    Write-Host "✅ .gitignore already contains .env.local" -ForegroundColor Green
}

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "Step 2: Generate New JWT Secret" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan

$newJwtSecret = node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
Write-Host "✅ Generated new JWT secret" -ForegroundColor Green
Write-Host ""
Write-Host "Your new JWT secret (save this!):" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host $newJwtSecret -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host ""

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "Step 3: Update .env.local" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan

if (Test-Path "frontend\.env.local") {
    Write-Host "⚠️  Backing up current .env.local..." -ForegroundColor Yellow
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    Copy-Item "frontend\.env.local" "frontend\.env.local.backup.$timestamp"
    Write-Host "✅ Backup created" -ForegroundColor Green
}

Write-Host ""
Write-Host "Now you need to manually update frontend\.env.local with:"
Write-Host ""
Write-Host "1. Your NEW API keys from provider dashboards"
Write-Host "2. The JWT secret shown above"
Write-Host "3. New database password (if changed)"
Write-Host ""
Read-Host "Press Enter when you've updated .env.local"

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "Step 4: Verify Security" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "Checking if .env.local is tracked by git..."
$trackedFiles = git ls-files
if ($trackedFiles -match "frontend[/\\].env.local") {
    Write-Host "❌ ERROR: .env.local is still tracked by git!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Run these commands to remove it:"
    Write-Host "  git rm --cached frontend/.env.local"
    Write-Host "  git commit -m 'Remove .env.local from git tracking'"
    Write-Host ""
    exit 1
} else {
    Write-Host "✅ .env.local is not tracked by git" -ForegroundColor Green
}

Write-Host ""
Write-Host "Checking for exposed keys in current files..."
$exposedKeysFound = $false

$oldKeys = @(
    "a0a55141",
    "K82877653688957",
    "sk-proj-"
)

foreach ($key in $oldKeys) {
    $found = Get-ChildItem -Recurse -File -Exclude *.md | 
             Select-String -Pattern $key -ErrorAction SilentlyContinue
    
    if ($found) {
        Write-Host "⚠️  Found old key '$key' in files!" -ForegroundColor Yellow
        $exposedKeysFound = $true
    }
}

if ($exposedKeysFound) {
    Write-Host ""
    Write-Host "❌ Old keys found in files! Please remove them." -ForegroundColor Red
    exit 1
} else {
    Write-Host "✅ No exposed keys found in current files" -ForegroundColor Green
}

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "Step 5: Update Vercel Environment Variables" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "You need to update these environment variables in Vercel:"
Write-Host ""
Write-Host "  1. Go to: https://vercel.com/dashboard"
Write-Host "  2. Select your project"
Write-Host "  3. Go to: Settings → Environment Variables"
Write-Host "  4. Update ALL of these with NEW keys:"
Write-Host ""
Write-Host "     - NANONETS_API_KEY" -ForegroundColor Yellow
Write-Host "     - NANONETS_MODEL_ID" -ForegroundColor Yellow
Write-Host "     - OCR_SPACE_API_KEY" -ForegroundColor Yellow
Write-Host "     - OPENAI_API_KEY" -ForegroundColor Yellow
Write-Host "     - HUGGINGFACE_API_TOKEN" -ForegroundColor Yellow
Write-Host "     - SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Yellow
Write-Host "     - DATABASE_URL" -ForegroundColor Yellow
Write-Host "     - JWT_SECRET (use the one generated above)" -ForegroundColor Yellow
Write-Host ""
Read-Host "Press Enter when you've updated Vercel environment variables"

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "Step 6: Test Local Setup" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "Installing dependencies..."
npm install

Write-Host ""
Write-Host "⚠️  IMPORTANT: Test the following:" -ForegroundColor Yellow
Write-Host "  1. Upload a PDF at http://localhost:3000/upload"
Write-Host "  2. Verify extraction works"
Write-Host "  3. Check console logs for errors"
Write-Host "  4. Verify correct OCR provider is used"
Write-Host ""
Write-Host "Starting server in 5 seconds..."
Start-Sleep -Seconds 5

npm run dev

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Monitor API usage for unauthorized access"
Write-Host "  2. Set up billing alerts on all services"
Write-Host "  3. Consider cleaning git history (see SECURITY_ALERT.md)"
Write-Host "  4. Document this incident"
Write-Host ""
Write-Host "For more information, see:"
Write-Host "  - SECURITY_ALERT.md"
Write-Host "  - DEPLOYMENT_CHECKLIST.md"
Write-Host ""
