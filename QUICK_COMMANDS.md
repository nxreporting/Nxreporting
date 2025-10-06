# ⚡ Quick Commands Cheat Sheet

## Copy and Paste These Commands

---

## 🔑 Step 1: Generate JWT Secret

**Copy this command:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**What it does**: Creates a random secret for your app

**Save the output** - you'll need it in Step 2!

---

## 📝 Step 2: Update .env.local

**Open this file:**
```
frontend/.env.local
```

**Find and replace these lines:**

```bash
# Line ~30: Replace with your OCR.space key
OCR_SPACE_API_KEY="YOUR_NEW_OCR_SPACE_API_KEY_HERE"
# Change to:
OCR_SPACE_API_KEY="your-actual-key-from-ocrspace"

# Line ~20: Replace with your JWT secret
JWT_SECRET="GENERATE_NEW_SECRET_WITH_CRYPTO_RANDOM_BYTES"
# Change to:
JWT_SECRET="paste-the-long-string-from-step-1-here"
```

**Save the file**: Ctrl+S (Windows) or Cmd+S (Mac)

---

## 🚀 Step 3: Install and Run

**Copy these commands one by one:**

```bash
# 1. Install dependencies (takes 2-5 minutes)
npm install

# 2. Start the app
npm run dev
```

**Then open your browser:**
```
http://localhost:3000
```

---

## 🧪 Step 4: Test

1. Go to http://localhost:3000
2. Find the Upload page
3. Upload a PDF
4. Check if text is extracted

**Look for this in your terminal:**
```
✅ OCR.space: Success
```

---

## 🆘 If Something Goes Wrong

### "npm: command not found"
```bash
# Install Node.js from: https://nodejs.org/
# Then restart your terminal and try again
```

### "Port 3000 is already in use"
```bash
# Use a different port:
npm run dev -- -p 3001
# Then go to: http://localhost:3001
```

### "Cannot find module"
```bash
# Install dependencies:
npm install
```

### "OCR extraction failed"
```bash
# 1. Check your API key in .env.local
# 2. Make sure it's inside quotes: "your-key"
# 3. Save the file (Ctrl+S)
# 4. Restart the app:
#    - Press Ctrl+C to stop
#    - Run: npm run dev
```

---

## 📋 Complete Setup (All Commands)

**Copy and run these in order:**

```bash
# 1. Generate JWT secret (save the output!)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 2. Edit frontend/.env.local with your keys
# (Do this manually in your code editor)

# 3. Install dependencies
npm install

# 4. Start the app
npm run dev

# 5. Open browser to:
# http://localhost:3000
```

---

## 🔗 Where to Get API Keys

**OCR.space** (Free):
```
https://ocr.space/ocrapi
```
- Sign up with email
- Get API key instantly
- Free tier: 25,000 requests/month

**Nanonets** (Optional, Paid):
```
https://app.nanonets.com/
```
- Sign up
- Go to Settings → API Keys
- Generate new key

---

## ✅ Quick Checklist

```
[ ] Generated JWT secret
[ ] Got OCR.space API key
[ ] Updated frontend/.env.local
[ ] Saved the file
[ ] Ran: npm install
[ ] Ran: npm run dev
[ ] Opened: http://localhost:3000
[ ] Tested PDF upload
[ ] Saw: ✅ OCR.space: Success
```

---

## 💾 Save Your Keys

**Create a file called "my-keys.txt" and save:**

```
OCR_SPACE_API_KEY=your-key-here
JWT_SECRET=your-long-secret-here
NANONETS_API_KEY=your-key-here (if you have one)
```

**Keep this file safe and NEVER share it!**

---

## 🎯 That's It!

Just follow the commands above and you're done!

**Need more help?** Read:
- `SIMPLE_SETUP_GUIDE.md` - Detailed explanations
- `VISUAL_SETUP_GUIDE.md` - Step-by-step with pictures

---

**Last Updated**: January 2025
