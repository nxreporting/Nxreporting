# 🔧 Update Vercel Environment Variables

## Issue
The OCR extraction is failing because the `OCR_SPACE_API_KEY` is not configured in Vercel production environment.

## Solution

### 1. Add OCR_SPACE_API_KEY to Vercel

Go to your Vercel dashboard:
1. Visit: https://vercel.com/dashboard
2. Select your project: `nxreporting`
3. Go to **Settings** → **Environment Variables**
4. Add this new variable:

```
Variable Name: OCR_SPACE_API_KEY
Value: helloworld
Environment: Production, Preview, Development
```

### 2. Redeploy

After adding the environment variable:
- Go to **Deployments** tab
- Click **"Redeploy"** on the latest deployment
- Wait for deployment to complete

### 3. Test OCR Service

After redeployment, test the OCR service:
- Visit: `https://your-app.vercel.app/api/test-ocr`
- Should return: `{"success": true, "message": "OCR service is working correctly"}`

### 4. Test PDF Extraction

Then test the full PDF extraction:
- Visit: `https://your-app.vercel.app/test-extract.html`
- Upload a PDF file
- Should now extract actual text instead of showing "OCR not available"

## Expected Result

After this fix:
- ✅ OCR.space API will work with the free "helloworld" key
- ✅ PDF extraction will return actual text content
- ✅ TextParser will process real OCR text instead of fallback data
- ✅ UI will show actual pharmaceutical data from uploaded PDFs

## Verification

The extraction response should change from:
```json
{
  "extractedText": "File: CNX Sept 25 Chn.pdf\nSize: 0.19 MB\nNote: OCR not available"
}
```

To:
```json
{
  "extractedText": "Stock Statement Report\nSHIVOHAM MEDICINES\nStock Report\n(01-Sep-2025 TO 16-Sep-2025)\n..."
}
```

And `formattedData.items` should contain actual pharmaceutical products instead of being empty.