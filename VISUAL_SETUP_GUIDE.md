# 📸 Visual Setup Guide - With Pictures

## Follow These Steps Exactly

---

## 🎯 Step 1: Get OCR.space API Key (5 minutes)

### What You'll Do:
Get a free API key from OCR.space (this is what your app uses to read PDFs)

### How to Do It:

1. **Open your web browser**

2. **Go to this website**:
   ```
   https://ocr.space/ocrapi
   ```

3. **You'll see a page that says "Free OCR API"**
   - Look for a button that says "Register" or "Get Free API Key"
   - Click it

4. **Fill in the form**:
   - Enter your email address
   - Enter your name
   - Click "Register" or "Submit"

5. **Check your email**:
   - You'll receive an email with your API key
   - It looks like: `K82877653688957` (but yours will be different)
   - **Copy this key** (Ctrl+C or Cmd+C)

6. **Save it somewhere safe**:
   - Open Notepad (Windows) or TextEdit (Mac)
   - Paste your key
   - Save the file as "my-api-keys.txt"

---

## 🔑 Step 2: Generate JWT Secret (2 minutes)

### What You'll Do:
Create a random secret code for your app's security

### How to Do It:

1. **Open PowerShell** (Windows):
   - Press Windows key
   - Type "PowerShell"
   - Click "Windows PowerShell"

   **OR Open Terminal** (Mac):
   - Press Cmd+Space
   - Type "Terminal"
   - Press Enter

2. **You'll see a black or white window with text**

3. **Copy this command** (click to select, then Ctrl+C):
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

4. **Paste it in PowerShell/Terminal**:
   - Right-click in the window (or Ctrl+V)
   - Press Enter

5. **You'll see a long random string appear**:
   ```
   6411eca8be00830836dfe181d3d57eb209a65849450a4d7d4199cc2771cd355b90a02bef4401b5f358126469d091453dbe08d8c2324abfba0d276f87fa569237
   ```

6. **Copy this entire string**:
   - Click and drag to select all of it
   - Press Ctrl+C (or Cmd+C)

7. **Save it in your "my-api-keys.txt" file**:
   - Add a line: `JWT_SECRET=` and paste the string after it

---

## 📝 Step 3: Update .env.local File (5 minutes)

### What You'll Do:
Put your new keys into the configuration file

### How to Do It:

1. **Open VS Code** (or your code editor)

2. **Find the file**:
   - Look in the left sidebar
   - Navigate to: `frontend` folder
   - Find file: `.env.local`
   - Click to open it

3. **You'll see a file with lots of text**

4. **Find this line** (around line 30):
   ```bash
   OCR_SPACE_API_KEY="YOUR_NEW_OCR_SPACE_API_KEY_HERE"
   ```

5. **Replace it with your actual key**:
   - Delete: `YOUR_NEW_OCR_SPACE_API_KEY_HERE`
   - Paste your OCR.space key (the one from Step 1)
   - Keep the quotes!
   
   **Example**:
   ```bash
   OCR_SPACE_API_KEY="K82877653688957"
   ```

6. **Find this line** (around line 20):
   ```bash
   JWT_SECRET="GENERATE_NEW_SECRET_WITH_CRYPTO_RANDOM_BYTES"
   ```

7. **Replace it with your JWT secret**:
   - Delete: `GENERATE_NEW_SECRET_WITH_CRYPTO_RANDOM_BYTES`
   - Paste your JWT secret (the long string from Step 2)
   - Keep the quotes!
   
   **Example**:
   ```bash
   JWT_SECRET="6411eca8be00830836dfe181d3d57eb209a65849450a4d7d4199cc2771cd355b..."
   ```

8. **Save the file**:
   - Press Ctrl+S (Windows) or Cmd+S (Mac)
   - You should see the file name change from `.env.local •` to `.env.local` (no dot)

---

## 🚀 Step 4: Install and Run (10 minutes)

### What You'll Do:
Install the app's dependencies and start it

### How to Do It:

1. **Open PowerShell/Terminal** (if not already open)

2. **Navigate to your project folder**:
   ```bash
   cd path/to/your/project
   ```
   
   **Example**:
   ```bash
   cd C:\Users\YourName\Documents\pdf-extraction-system
   ```

3. **Install dependencies**:
   - Type this command:
     ```bash
     npm install
     ```
   - Press Enter
   - **Wait** (this might take 2-5 minutes)
   - You'll see lots of text scrolling
   - When it's done, you'll see a new prompt line

4. **Start the app**:
   - Type this command:
     ```bash
     npm run dev
     ```
   - Press Enter
   - **Wait** (about 10-30 seconds)
   - You'll see text like:
     ```
     ready - started server on 0.0.0.0:3000
     ```

5. **Open your browser**:
   - Open Chrome, Firefox, or Edge
   - Type in the address bar:
     ```
     http://localhost:3000
     ```
   - Press Enter

6. **You should see your app!**
   - If you see the homepage, it's working! 🎉

---

## 🧪 Step 5: Test PDF Upload (5 minutes)

### What You'll Do:
Make sure PDF extraction is working

### How to Do It:

1. **Find a test PDF**:
   - Any PDF file will work
   - Or download a sample from: https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf

2. **In your app, find the Upload page**:
   - Look for a button or link that says "Upload" or "Extract"
   - Click it

3. **Upload your PDF**:
   - You'll see a drag-and-drop area
   - Either:
     - Drag your PDF file onto it
     - OR click "Choose File" and select your PDF

4. **Click "Extract" or "Process"**

5. **Wait for processing**:
   - You'll see a loading indicator
   - This might take 5-30 seconds

6. **Check the results**:
   - You should see extracted text
   - If you see text from your PDF, **it's working!** ✅

7. **Check the console** (in PowerShell/Terminal):
   - Look for lines like:
     ```
     🔬 MultiProviderOCR: Starting extraction...
     🔄 OCR.space: Attempting extraction...
     ✅ OCR.space: Success (2340ms, 5432 chars)
     ```
   - If you see `✅ OCR.space: Success`, everything is working perfectly!

---

## ✅ Success Checklist

Check off each item as you complete it:

- [ ] Got OCR.space API key from website
- [ ] Generated JWT secret using command
- [ ] Saved both keys in a safe place
- [ ] Opened `frontend/.env.local` file
- [ ] Replaced `OCR_SPACE_API_KEY` with my key
- [ ] Replaced `JWT_SECRET` with my secret
- [ ] Saved the file (Ctrl+S)
- [ ] Ran `npm install` (waited for it to finish)
- [ ] Ran `npm run dev`
- [ ] Opened http://localhost:3000 in browser
- [ ] Saw the app homepage
- [ ] Uploaded a test PDF
- [ ] Saw extracted text
- [ ] Saw "✅ OCR.space: Success" in console

**If all items are checked, you're done!** 🎉

---

## 🆘 Common Problems and Solutions

### Problem 1: "npm: command not found"

**What it means**: Node.js is not installed

**How to fix**:
1. Go to: https://nodejs.org/
2. Click the big green button "Download Node.js (LTS)"
3. Run the installer
4. Click "Next" through all the steps
5. Restart PowerShell/Terminal
6. Try again

---

### Problem 2: "Cannot find module"

**What it means**: Dependencies are not installed

**How to fix**:
1. Make sure you're in the right folder
2. Run: `npm install`
3. Wait for it to finish
4. Try again

---

### Problem 3: "Port 3000 is already in use"

**What it means**: Another app is using port 3000

**How to fix**:
1. Close any other apps that might be running on port 3000
2. OR use a different port:
   ```bash
   npm run dev -- -p 3001
   ```
3. Then go to: http://localhost:3001

---

### Problem 4: "OCR extraction failed"

**What it means**: Your API key might be wrong

**How to fix**:
1. Check your `.env.local` file
2. Make sure the key is inside quotes: `"your-key"`
3. Make sure there are no spaces before or after the key
4. Make sure you saved the file (Ctrl+S)
5. Restart the app (Ctrl+C to stop, then `npm run dev` again)

---

### Problem 5: Can't find .env.local file

**What it means**: The file might be hidden

**How to fix**:
1. In VS Code, look in the `frontend` folder
2. If you don't see it, it might be hidden
3. In VS Code, press Ctrl+P (or Cmd+P)
4. Type: `frontend/.env.local`
5. Press Enter
6. The file should open

---

## 📸 What You Should See

### When npm install is running:
```
npm WARN deprecated ...
added 1234 packages in 45s
```

### When npm run dev is running:
```
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
event - compiled client and server successfully
```

### When you upload a PDF:
```
🔬 MultiProviderOCR: Starting extraction...
📄 File: document.pdf
📏 Size: 1024.00 KB
🔄 OCR.space: Attempting extraction...
✅ OCR.space: Success (2340ms, 5432 chars)
```

---

## 🎓 What Each Step Does

1. **Get API Key**: This lets your app use OCR.space to read PDFs
2. **Generate Secret**: This keeps your app secure
3. **Update .env.local**: This tells your app to use your new keys
4. **Install Dependencies**: This downloads all the code libraries your app needs
5. **Run App**: This starts your app so you can use it
6. **Test Upload**: This makes sure everything is working

---

## 💡 Pro Tips

1. **Keep PowerShell/Terminal open**: You'll see helpful messages there
2. **Save often**: Press Ctrl+S after making changes
3. **Read error messages**: They usually tell you what's wrong
4. **One step at a time**: Don't skip ahead
5. **Take breaks**: If you're stuck, take a 5-minute break and try again

---

## 🎉 You Did It!

If you made it through all the steps and your app is working, congratulations! 🎊

You now have:
- ✅ A secure app with new API keys
- ✅ Working PDF extraction
- ✅ A local development environment

**What's next?**
- Try uploading different PDFs
- Explore the app features
- Check out the analytics dashboard

---

**Need more help?** Go back to `SIMPLE_SETUP_GUIDE.md` for more details.

**Last Updated**: January 2025
