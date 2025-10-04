const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testNanonetsAPI() {
  console.log('🧪 Testing Nanonets API Key: a0a55141-94a6-11f0-8959-2e22c9bcfacb');
  
  // Test 1: Check if we have a test PDF file
  const uploadsDir = './backend/uploads';
  let testFile = null;
  
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    testFile = files.find(file => file.toLowerCase().endsWith('.pdf'));
    
    if (testFile) {
      testFile = `${uploadsDir}/${testFile}`;
      console.log('📄 Using test file:', testFile);
    }
  }
  
  if (!testFile) {
    console.log('❌ No PDF file found in uploads directory');
    console.log('📁 Please upload a PDF file first');
    return;
  }
  
  try {
    // Test the exact API call from your code
    console.log('\n🔬 Testing Nanonets extraction API...');
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFile));
    formData.append('output_type', 'markdown');
    
    const headers = {
      'Authorization': 'Bearer a0a55141-94a6-11f0-8959-2e22c9bcfacb',
      ...formData.getHeaders()
    };
    
    console.log('📡 Making request to: https://extraction-api.nanonets.com/extract');
    console.log('🔑 Using API key: a0a55141-94a6-11f0-8959-2e22c9bcfacb');
    
    const response = await fetch('https://extraction-api.nanonets.com/extract', {
      method: 'POST',
      headers: headers,
      body: formData
    });
    
    console.log('\n📬 Response received:');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Content-Type:', response.headers.get('content-type'));
    
    const responseText = await response.text();
    console.log('\n📄 Raw response (first 500 chars):');
    console.log(responseText.substring(0, 500));
    
    if (!response.ok) {
      console.log('\n❌ API request failed!');
      console.log('Full error response:', responseText);
      
      // Try alternative endpoints
      await tryAlternativeEndpoints(testFile);
      return;
    }
    
    // Try to parse as JSON
    try {
      const jsonData = JSON.parse(responseText);
      console.log('\n✅ API request successful!');
      console.log('Response keys:', Object.keys(jsonData));
      
      if (jsonData.markdown) {
        console.log('\n📜 Extracted markdown (first 200 chars):');
        console.log(jsonData.markdown.substring(0, 200) + '...');
      } else if (jsonData.text) {
        console.log('\n📜 Extracted text (first 200 chars):');
        console.log(jsonData.text.substring(0, 200) + '...');
      }
      
    } catch (parseError) {
      console.log('\n⚠️ Response is not valid JSON');
      console.log('This might be an HTML error page');
    }
    
  } catch (error) {
    console.error('\n❌ Network error:', error.message);
  }
}

async function tryAlternativeEndpoints(testFile) {
  console.log('\n🔄 Trying alternative Nanonets endpoints...');
  
  const endpoints = [
    'https://app.nanonets.com/api/v2/OCR/Model/extract',
    'https://nanonets.com/api/extract',
    'https://api.nanonets.com/v2/extract'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n🔄 Testing: ${endpoint}`);
      
      const formData = new FormData();
      formData.append('file', fs.createReadStream(testFile));
      
      const headers = {
        'Authorization': 'Bearer a0a55141-94a6-11f0-8959-2e22c9bcfacb',
        ...formData.getHeaders()
      };
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: headers,
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
      console.log(`❌ Error: ${error.message}`);
    }
  }
}

// Run the test
testNanonetsAPI().catch(console.error);