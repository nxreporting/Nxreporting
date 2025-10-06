#!/bin/bash

# ============================================================================
# Secure Environment Setup Script
# ============================================================================
# This script helps you set up a secure development environment
# after the API key exposure incident.
#
# Usage: bash setup-secure-environment.sh
# ============================================================================

set -e  # Exit on error

echo "============================================================================"
echo "🔒 Secure Environment Setup"
echo "============================================================================"
echo ""
echo "⚠️  WARNING: This script will help you secure your environment after"
echo "    the API key exposure incident."
echo ""
echo "Before running this script, you should have:"
echo "  1. Rotated ALL API keys from provider dashboards"
echo "  2. Revoked the old exposed keys"
echo "  3. Generated new keys"
echo ""
read -p "Have you completed these steps? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo ""
    echo "❌ Please complete the key rotation first!"
    echo ""
    echo "Follow these steps:"
    echo "  1. Nanonets: https://app.nanonets.com/ → Settings → API Keys"
    echo "  2. OCR.space: https://ocr.space/ocrapi → Account Settings"
    echo "  3. OpenAI: https://platform.openai.com/api-keys"
    echo "  4. Hugging Face: https://huggingface.co/settings/tokens"
    echo "  5. Supabase: Project Settings → API → Rotate service role key"
    echo ""
    exit 1
fi

echo ""
echo "============================================================================"
echo "Step 1: Verify .gitignore"
echo "============================================================================"

if ! grep -q "\.env\.local" .gitignore; then
    echo "⚠️  Adding .env.local to .gitignore..."
    echo "" >> .gitignore
    echo "# Environment files (NEVER commit these!)" >> .gitignore
    echo ".env.local" >> .gitignore
    echo "*.env.local" >> .gitignore
    echo "✅ Updated .gitignore"
else
    echo "✅ .gitignore already contains .env.local"
fi

echo ""
echo "============================================================================"
echo "Step 2: Generate New JWT Secret"
echo "============================================================================"

NEW_JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
echo "✅ Generated new JWT secret"
echo ""
echo "Your new JWT secret (save this!):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "$NEW_JWT_SECRET"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo ""
echo "============================================================================"
echo "Step 3: Update .env.local"
echo "============================================================================"

if [ -f "frontend/.env.local" ]; then
    echo "⚠️  Backing up current .env.local..."
    cp frontend/.env.local frontend/.env.local.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ Backup created"
fi

echo ""
echo "Now you need to manually update frontend/.env.local with:"
echo ""
echo "1. Your NEW API keys from provider dashboards"
echo "2. The JWT secret shown above"
echo "3. New database password (if changed)"
echo ""
read -p "Press Enter when you've updated .env.local..."

echo ""
echo "============================================================================"
echo "Step 4: Verify Security"
echo "============================================================================"

echo ""
echo "Checking if .env.local is tracked by git..."
if git ls-files | grep -q "frontend/.env.local"; then
    echo "❌ ERROR: .env.local is still tracked by git!"
    echo ""
    echo "Run these commands to remove it:"
    echo "  git rm --cached frontend/.env.local"
    echo "  git commit -m 'Remove .env.local from git tracking'"
    echo ""
    exit 1
else
    echo "✅ .env.local is not tracked by git"
fi

echo ""
echo "Checking for exposed keys in current files..."
EXPOSED_KEYS_FOUND=false

if grep -r "a0a55141" . --exclude-dir=node_modules --exclude-dir=.git --exclude="*.md" 2>/dev/null; then
    echo "⚠️  Found old Nanonets key in files!"
    EXPOSED_KEYS_FOUND=true
fi

if grep -r "K82877653688957" . --exclude-dir=node_modules --exclude-dir=.git --exclude="*.md" 2>/dev/null; then
    echo "⚠️  Found old OCR.space key in files!"
    EXPOSED_KEYS_FOUND=true
fi

if grep -r "sk-proj-" . --exclude-dir=node_modules --exclude-dir=.git --exclude="*.md" 2>/dev/null; then
    echo "⚠️  Found old OpenAI key in files!"
    EXPOSED_KEYS_FOUND=true
fi

if [ "$EXPOSED_KEYS_FOUND" = true ]; then
    echo ""
    echo "❌ Old keys found in files! Please remove them."
    exit 1
else
    echo "✅ No exposed keys found in current files"
fi

echo ""
echo "============================================================================"
echo "Step 5: Update Vercel Environment Variables"
echo "============================================================================"

echo ""
echo "You need to update these environment variables in Vercel:"
echo ""
echo "  1. Go to: https://vercel.com/dashboard"
echo "  2. Select your project"
echo "  3. Go to: Settings → Environment Variables"
echo "  4. Update ALL of these with NEW keys:"
echo ""
echo "     - NANONETS_API_KEY"
echo "     - NANONETS_MODEL_ID"
echo "     - OCR_SPACE_API_KEY"
echo "     - OPENAI_API_KEY"
echo "     - HUGGINGFACE_API_TOKEN"
echo "     - SUPABASE_SERVICE_ROLE_KEY"
echo "     - DATABASE_URL"
echo "     - JWT_SECRET (use the one generated above)"
echo ""
read -p "Press Enter when you've updated Vercel environment variables..."

echo ""
echo "============================================================================"
echo "Step 6: Test Local Setup"
echo "============================================================================"

echo ""
echo "Installing dependencies..."
npm install

echo ""
echo "Starting development server..."
echo ""
echo "⚠️  IMPORTANT: Test the following:"
echo "  1. Upload a PDF at http://localhost:3000/upload"
echo "  2. Verify extraction works"
echo "  3. Check console logs for errors"
echo "  4. Verify correct OCR provider is used"
echo ""
echo "Starting server in 5 seconds..."
sleep 5

npm run dev

echo ""
echo "============================================================================"
echo "✅ Setup Complete!"
echo "============================================================================"
echo ""
echo "Next steps:"
echo "  1. Monitor API usage for unauthorized access"
echo "  2. Set up billing alerts on all services"
echo "  3. Consider cleaning git history (see SECURITY_ALERT.md)"
echo "  4. Document this incident"
echo ""
echo "For more information, see:"
echo "  - SECURITY_ALERT.md"
echo "  - DEPLOYMENT_CHECKLIST.md"
echo ""
