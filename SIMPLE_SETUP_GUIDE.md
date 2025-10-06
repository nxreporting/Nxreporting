# 🚀 Simple Setup Guide - Step by Step

## Don't Worry! I'll Guide You Through Everything

This guide will help you fix the security issue and get your app running. Just follow each step carefully.

---

## 📋 What You Need to Do (Simple Version)

### Step 1: Get New API Keys (30 minutes)

You need to get new API keys because the old ones were exposed. Here's how:

#### 1.1 OCR.space (Most Important - This is what the app actually uses!)

1. Go to: https://ocr.space/ocrapi
2. Click "Free API" or "Sign Up"
3. Enter your email
4. You'll receive an API key by email
5. **Save this key somewhere safe** (like Notepad)

**Example key looks like**: `K82877653688957` (but yours will be different)

#### 1.2 Nanonets (Optional - Only if you want to use it)

1. Go to: https://app.nanonets.com/
2. Sign up or log in
3. Go to Settings → API Keys
4. Click "Generate New Key"
5. **Save this key somewhere safe**

**Example key looks like**: `a0a55141-94a6-11f0-8959-2e22c9bcfacb`

#### 1.3 Generate JWT Secret (Required)

1. Open PowerShell (Windows) or Terminal (Mac)
2. Copy and paste this command:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
3. Press Enter
4. You'll see a long random string
5. **Copy and save this string**

**Example looks like**: `6411eca8be00830836dfe181d3d57eb2...` (very long)

---

### Step 2: Update Your .env.local File (10 minutes)

Now let's put your new keys in the right place:

1. **Open the file**: `frontend/.env.local` in your code editor

2. **Find these lines and replace with YOUR new keys**:

```bash
# Replace this line:
OCR_SPACE_API_KEY="YOUR_NEW_OCR_SPACE_API_KEY_HERE"
# With your actual key:
OCR_SPACE_API_KEY="K82877653688957"  # ← Use YOUR key here!

# Replace this line:
JWT_SECRET="GENERATE_NEW_SECRET_WITH_CRYPTO_RANDOM_BYTES"
# With the secret you generated:
JWT_SECRET="6411eca8be00830836dfe181d3d57eb2..."  # ← Use YOUR secret here!

# If you got a Nanonets key, replace this:
NANONETS_API_KEY="YOUR_NEW_NANONETS_API_KEY_HERE"
# With your key:
NANONETS_API_KEY="a0a55141-94a6-11f0-8959-2e22c9bcfacb"  # ← Use YOUR key here!
```

3. **Save the file** (Ctrl+S or Cmd+S)

**Important**: Don't share this file with anyone! It contains your secret keys.

---

### Step 3: Test Your App (5 minutes)

Let's make sure everything works:

1. **Open PowerShell or Terminal** in your project folder

2. **Install dependencies** (if you haven't already):
   ```bash
   npm install
   ```
   Wait for it to finish (might take a few minutes)

3. **Start the app**:
   ```bash
   npm run dev
   ```

4. **Open your browser** and go to:
   ```
   http://localhost:3000
   ```

5. **Test PDF upload**:
   - Find the upload page
   - Upload a test PDF
   - Check if it extracts text successfully

6. **Check the console** (in PowerShell/Terminal):
   - Look for: `✅ OCR.space: Success`
   - This means it's working!

---

### Step 4: Update Vercel (If You're Deploying)

If you want to deploy your app to production:

1. **Go to**: https://vercel.com/dashboard

2. **Find your project** and click on it

3. **Click**: Settings → Environment Variables

4. **Add or update these variables**:
   - Click "Add New"
   - Name: `OCR_SPACE_API_KEY`
   - Value: Your new OCR.space key
   - Click "Save"

5. **Repeat for**:
   - `JWT_SECRET` (your generated secret)
   - `NANONETS_API_KEY` (if you have one)

6. **Redeploy**:
   - Go to Deployments tab
   - Click "Redeploy" on the latest deployment

---

## ✅ Quick Checklist

Use this to make sure you did everything:

- [ ] Got new OCR.space API key
- [ ] Generated new JWT secret
- [ ] Updated `frontend/.env.local` with new keys
- [ ] Saved the file
- [ ] Ran `npm install`
- [ ] Ran `npm run dev`
- [ ] Tested PDF upload
- [ ] Saw "✅ OCR.space: Success" in console
- [ ] Updated Vercel environment variables (if deploying)

---

## 🆘 Troubleshooting

### Problem: "npm: command not found"

**Solution**: You need to install Node.js
1. Go to: https://nodejs.org/
2. Download and install the LTS version
3. Restart your terminal
4. Try again

### Problem: "Cannot find module"

**Solution**: Install dependencies
```bash
npm install
```

### Problem: "Port 3000 is already in use"

**Solution**: Stop other apps using port 3000, or use a different port:
```bash
npm run dev -- -p 3001
```
Then go to: http://localhost:3001

### Problem: "OCR extraction failed"

**Solution**: Check your API key
1. Make sure you copied the key correctly
2. No extra spaces before or after the key
3. Key should be inside quotes: `"your-key-here"`

### Problem: "All OCR providers failed"

**Solution**: 
1. Check your internet connection
2. Verify your OCR.space API key is correct
3. Try getting a new API key from OCR.space

---

## 📞 Need More Help?

### Where to Get API Keys

1. **OCR.space** (Free, Easy):
   - Website: https://ocr.space/ocrapi
   - Free tier: 25,000 requests/month
   - No credit card needed

2. **Nanonets** (Optional, Paid):
   - Website: https://app.nanonets.com/
   - Requires paid plan
   - Better for specific document types

### Test Your API Keys

**Test OCR.space key**:
```bash
curl -X POST https://api.ocr.space/parse/image ^
  -F "apikey=YOUR_KEY_HERE" ^
  -F "url=https://i.imgur.com/example.jpg"
```

If it works, you'll see JSON response with text.

---

## 🎯 What's Next?

Once everything is working:

1. **Keep your keys safe**:
   - Never share your `.env.local` file
   - Never commit it to git
   - Don't post it online

2. **Monitor usage**:
   - Check OCR.space dashboard occasionally
   - Make sure you're not hitting limits

3. **Enjoy your app**:
   - Upload PDFs
   - Extract data
   - Generate reports

---

## 💡 Quick Tips

1. **Save your keys**: Keep them in a password manager or secure note
2. **Test first**: Always test locally before deploying
3. **Check logs**: If something fails, check the console for error messages
4. **One step at a time**: Don't rush, follow each step carefully

---

## 📚 What Each File Does

- **`.env.local`**: Stores your secret keys (never share this!)
- **`multiProviderOCRService.ts`**: The code that does OCR extraction
- **`extract.ts`**: API endpoint that receives PDF uploads
- **`package.json`**: Lists all the code libraries your app needs

---

## ✨ You're Almost Done!

Just follow the steps above, and you'll have:
- ✅ A secure app with new API keys
- ✅ Working PDF extraction
- ✅ Ready to deploy

**Start with Step 1** and work your way down. You got this! 🚀

---

**Need help?** Read the error message carefully - it usually tells you what's wrong!

**Still stuck?** Check the Troubleshooting section above.

**Last Updated**: January 2025
