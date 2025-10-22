# 🚀 Nanonets API Setup Guide

This guide will help you properly configure the Nanonets API for PDF data extraction in your application.

## 📋 Prerequisites

1. **Nanonets Account**: Sign up at [https://nanonets.com](https://nanonets.com)
2. **API Access**: Get your API key from the Nanonets dashboard
3. **Model Setup**: Create or use an existing OCR model

## 🔑 Step 1: Get Your API Key

1. **Login to Nanonets Dashboard**
   - Go to [https://app.nanonets.com](https://app.nanonets.com)
   - Sign in with your credentials

2. **Navigate to API Keys**
   - Click on your profile (top right)
   - Go to "Settings" → "API Keys"
   - Copy your API key (starts with `test_` or `live_`)

3. **Model ID (Optional)**
   - Go to "Models" in the dashboard
   - Select your OCR model or create a new one
   - Copy the Model ID from the URL or model details

## 🛠️ Step 2: Configure Environment Variables

Update your `frontend/.env.local` file:

```bash
# Nanonets Configuration
NANONETS_API_KEY="your_actual_api_key_here"
NANONETS_MODEL_ID="your_model_id_here"  # Optional, will use default if not provided
```

**Important**: Replace the placeholder values with your actual API credentials.

## 📊 Step 3: Choose the Right Model

### **Option A: Use Default OCR Model**
- Model ID: `bd442c54-71de-4057-a0b8-91c4c8b5e5e1`
- Good for: General document OCR
- Setup: No additional configuration needed

### **Option B: Create Custom Model (Recommended for Pharmaceutical Data)**

1. **Create New Model**
   ```bash
   curl -X POST 'https://app.nanonets.com/api/v2/OCR/Model/' \
     -H 'Authorization: Basic <base64_encoded_api_key>' \
     -H 'Content-Type: application/json' \
     -d '{
       "name": "Pharmaceutical Stock Report",
       "categories": ["company_name", "item_name", "opening_stock", "sales", "closing_stock", "sales_value"]
     }'
   ```

2. **Train Your Model**
   - Upload 5-10 sample pharmaceutical PDFs
   - Label the key fields (company name, item names, quantities, values)
   - Train the model (takes 10-30 minutes)

3. **Use Custom Model**
   ```bash
   NANONETS_MODEL_ID="your_custom_model_id"
   ```

## 🧪 Step 4: Test Your Configuration

### **Method 1: Using the Application**

1. **Start your application**
   ```bash
   npm run dev
   ```

2. **Upload a test PDF**
   - Go to `http://localhost:3000`
   - Upload a pharmaceutical PDF
   - Check the console for Nanonets logs

### **Method 2: Direct API Test**

Create a test script `test-nanonets-setup.js`:

```javascript
const { createNanonetsService } = require('./frontend/lib/services/nanonetsService');
const fs = require('fs');

async function testNanonets() {
  try {
    console.log('🧪 Testing Nanonets configuration...');
    
    // Create service
    const nanonetsService = createNanonetsService();
    
    // Check configuration
    const status = nanonetsService.getStatus();
    console.log('📊 Status:', status);
    
    if (!status.configured) {
      console.error('❌ Nanonets not configured. Check your API key.');
      return;
    }
    
    // Test with a sample PDF
    const pdfPath = './sample.pdf'; // Replace with your test PDF
    if (fs.existsSync(pdfPath)) {
      const fileBuffer = fs.readFileSync(pdfPath);
      
      console.log('📄 Testing extraction...');
      const result = await nanonetsService.extractFromBuffer(fileBuffer, 'test.pdf', {
        extractTables: true,
        extractFields: true
      });
      
      if (result.success) {
        console.log('✅ Extraction successful!');
        console.log('📊 Text length:', result.extractedText?.length);
        console.log('📋 Tables found:', result.tables?.length);
        console.log('🏷️ Fields found:', Object.keys(result.fields || {}).length);
        console.log('⚡ Confidence:', result.metadata?.confidence);
      } else {
        console.error('❌ Extraction failed:', result.error);
      }
    } else {
      console.log('⚠️ No test PDF found. Place a PDF at ./sample.pdf to test extraction.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testNanonets();
```

Run the test:
```bash
node test-nanonets-setup.js
```

## 📈 Step 5: Optimize for Your Use Case

### **For Pharmaceutical Stock Reports:**

1. **Custom Field Extraction**
   ```javascript
   const result = await nanonetsService.extractFromBuffer(fileBuffer, filename, {
     extractTables: true,
     extractFields: true,
     modelId: 'your_pharmaceutical_model_id'
   });
   ```

2. **Expected Data Structure**
   ```json
   {
     "company": {
       "name": "SHIVOHAM MEDICINES"
     },
     "items": [
       {
         "name": "ACKNOTIN 10 TABLETS",
         "opening": 20,
         "sales": 0,
         "closing": 20,
         "salesValue": 0,
         "closingValue": 2196.60
       }
     ],
     "summary": {
       "totalItems": 150,
       "totalSalesValue": 45000,
       "totalClosingValue": 125000
     }
   }
   ```

### **Performance Optimization:**

1. **File Size Limits**
   - Maximum: 25MB per file
   - Recommended: Under 10MB for faster processing
   - Compress large PDFs if needed

2. **Processing Time**
   - Small files (< 5MB): 2-5 seconds
   - Large files (> 10MB): 10-30 seconds
   - Complex documents: Up to 60 seconds

3. **Rate Limits**
   - Free tier: 500 requests/month
   - Paid plans: Higher limits available
   - Implement retry logic for rate limit errors

## 🔍 Step 6: Troubleshooting

### **Common Issues:**

1. **"Invalid API Key" Error**
   ```bash
   # Check your API key format
   echo $NANONETS_API_KEY
   # Should start with 'test_' or 'live_'
   ```

2. **"Model not found" Error**
   ```bash
   # List available models
   curl -X GET 'https://app.nanonets.com/api/v2/OCR/Model/' \
     -H 'Authorization: Basic <base64_encoded_api_key>'
   ```

3. **"File too large" Error**
   ```bash
   # Compress PDF
   gs -sDEVICE=pdfwrite -dPDFSETTINGS=/ebook \
      -dNOPAUSE -dQUIET -dBATCH \
      -sOutputFile=compressed.pdf input.pdf
   ```

4. **Poor Extraction Quality**
   - Use higher resolution PDFs (300+ DPI)
   - Ensure text is not rotated or skewed
   - Train a custom model with your document types
   - Check document language settings

### **Debug Logs:**

Enable detailed logging in your application:

```javascript
// In your extraction API
console.log('🔧 Nanonets Request:', {
  filename: filename,
  fileSize: fileBuffer.length,
  modelId: modelId
});

console.log('📊 Nanonets Response:', {
  success: result.success,
  textLength: result.extractedText?.length,
  tablesCount: result.tables?.length,
  fieldsCount: Object.keys(result.fields || {}).length,
  confidence: result.metadata?.confidence
});
```

## 🚀 Step 7: Production Deployment

### **Environment Variables for Production:**

1. **Vercel Deployment**
   ```bash
   # Set in Vercel dashboard
   NANONETS_API_KEY=live_your_production_api_key
   NANONETS_MODEL_ID=your_production_model_id
   ```

2. **Security Best Practices**
   - Use `live_` API keys for production
   - Rotate API keys every 90 days
   - Monitor API usage and costs
   - Implement proper error handling

### **Monitoring:**

1. **Track API Usage**
   ```javascript
   // Log extraction metrics
   console.log('📊 Nanonets Metrics:', {
     provider: 'Nanonets',
     success: result.success,
     duration: result.metadata?.duration,
     confidence: result.metadata?.confidence,
     fileSize: fileBuffer.length
   });
   ```

2. **Set Up Alerts**
   - API key expiration
   - Rate limit approaching
   - Low extraction confidence
   - High error rates

## 📚 Additional Resources

- **Nanonets API Documentation**: [https://docstrange.nanonets.com/apidocs/](https://docstrange.nanonets.com/apidocs/)
- **Model Training Guide**: [https://nanonets.com/documentation/](https://nanonets.com/documentation/)
- **Pricing Information**: [https://nanonets.com/pricing/](https://nanonets.com/pricing/)
- **Support**: [support@nanonets.com](mailto:support@nanonets.com)

## ✅ Verification Checklist

- [ ] Nanonets account created
- [ ] API key obtained and configured
- [ ] Model ID set (custom or default)
- [ ] Environment variables updated
- [ ] Test extraction successful
- [ ] Database integration working
- [ ] Production deployment configured
- [ ] Monitoring and alerts set up

---

**🎉 You're all set!** Your application should now be able to extract structured data from pharmaceutical PDFs using the Nanonets API with proper database storage and analysis capabilities.