const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');
const path = require('path');

// Test DocStrange (Nanonets) API directly
async function testDocStrangeAPI() {
  console.log('🧪 Testing DocStrange cloud API integration...');
  
  // Find a test PDF file in uploads directory
  const uploadsDir = path.join(__dirname, 'uploads');
  let testFile = null;
  
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    testFile = files.find(file => file.toLowerCase().endsWith('.pdf'));
    
    if (testFile) {
      testFile = path.join(uploadsDir, testFile);
      console.log('📄 Using test file:', testFile);
    }
  }
  
  if (!testFile) {
    console.log('❌ No PDF file found in uploads directory');
    console.log('📁 Upload a PDF file first and try again');
    return;
  }
  
  try {
    // Check file exists and get stats
    const stats = fs.statSync(testFile);
    const fileSizeMB = (stats.size / (1024 * 1024));
    console.log(`📊 File size: ${fileSizeMB.toFixed(2)} MB`);
    
    if (fileSizeMB > 50) {
      console.log('⚠️ File too large for free tier (>50MB)');
      return;
    }

    // Test 1: Try DocStrange cloud API (free)
    console.log('\n🌅 Testing DocStrange free cloud API...');
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFile));
    formData.append('output_format', 'json');
    formData.append('processing_mode', 'cloud');
    
    const headers = {
      'Content-Type': 'multipart/form-data',
      ...formData.getHeaders()
    };
    
    console.log('📡 Making request to DocStrange cloud API...');
    console.log('URL: https://api.nanonets.com/v2/docstrange/extract');
    
    const response = await fetch('https://api.nanonets.com/v2/docstrange/extract', {
      method: 'POST',
      headers: headers,
      body: formData
    });
    
    console.log('\n📬 Response received:');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const responseText = await response.text();
    console.log('\n📄 Raw response preview:');
    console.log(responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''));
    
    if (!response.ok) {
      console.log('\n❌ DocStrange cloud API request failed!');
      
      // Try alternative endpoints
      console.log('\n🔄 Trying alternative endpoint...');
      await tryAlternativeEndpoints(testFile);
      return;
    }
    
    // Try to parse as JSON
    try {
      const jsonData = JSON.parse(responseText);
      console.log('\n✅ DocStrange API request successful!');
      console.log('Response structure:');
      console.log('Keys:', Object.keys(jsonData));
      
      // Look for text content in various formats
      if (jsonData.markdown) {
        console.log('\n📜 Found markdown content:');
        console.log(jsonData.markdown.substring(0, 300) + '...');
      } else if (jsonData.text) {
        console.log('\n📜 Found text content:');
        console.log(jsonData.text.substring(0, 300) + '...');
      } else if (jsonData.data) {
        console.log('\n📊 Found data structure:');
        console.log(JSON.stringify(jsonData.data, null, 2).substring(0, 300) + '...');
      } else {
        console.log('\n⚠️ No obvious content field found');
        console.log('Full response:', JSON.stringify(jsonData, null, 2));
      }
      
    } catch (parseError) {
      console.log('\n⚠️ Response is not valid JSON');
      console.log('Parse error:', parseError.message);
    }
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code
    });
  }
}

// Try alternative endpoints if main one fails
async function tryAlternativeEndpoints(testFile) {
  const endpoints = [
    'https://docstrange.nanonets.com/api/extract',
    'https://app.nanonets.com/api/v2/OCR/Model/extract',
    'https://nanonets.com/api/extract'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n🔄 Trying endpoint: ${endpoint}`);
      
      const formData = new FormData();
      formData.append('file', fs.createReadStream(testFile));
      
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
      });
      
      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const text = await response.text();
        console.log('✅ Success! Response preview:');
        console.log(text.substring(0, 200) + '...');
        return;
      } else {
        const errorText = await response.text();
        console.log(`❌ Failed: ${errorText.substring(0, 100)}`);
      }
      
    } catch (error) {
      console.log(`❌ Error with ${endpoint}:`, error.message);
    }
  }
  
  console.log('\n😔 All alternative endpoints failed');
}

// Run the test
console.log('🚀 Starting DocStrange API test...');
testDocStrangeAPI().catch(error => {
  console.error('❌ Test script failed:', error);
  process.exit(1);
});