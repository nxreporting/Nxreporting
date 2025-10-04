const fs = require('fs');
const FormData = require('form-data');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testNanonetsAPI() {
  console.log('🧪 Testing Nanonets API Key: a0a55141-94a6-11f0-8959-2e22c9bcfacb');
  
  // Test 1: Check if we have a test PDF file
  const uploadsDir = './uploads';
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
    console.log('📁 Creating a simple test without file...');
    
    // Test API key validity without file
    await testAPIKeyOnly();
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
      
      // Check if it's an authentication issue
      if (response.status === 401) {
        console.log('🔑 This appears to be an authentication issue - API key might be invalid');
      } else if (response.status === 403) {
        console.log('🚫 This appears to be a permission issue - API key might not have access');
      }
      
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

async function testAPIKeyOnly() {
  console.log('\n🔑 Testing API key validity...');
  
  try {
    // Test with a simple GET request to check API key
    const response = await fetch('https://extraction-api.nanonets.com/extract', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer a0a55141-94a6-11f0-8959-2e22c9bcfacb'
      }
    });
    
    console.log('API Key Test Status:', response.status);
    console.log('API Key Test Status Text:', response.statusText);
    
    const responseText = await response.text();
    console.log('Response:', responseText.substring(0, 200));
    
    if (response.status === 401) {
      console.log('❌ API key is invalid or expired');
    } else if (response.status === 403) {
      console.log('❌ API key doesn\'t have permission for this endpoint');
    } else if (response.status === 405) {
      console.log('✅ API key seems valid (Method Not Allowed is expected for GET)');
    } else {
      console.log('🤔 Unexpected response - check the API documentation');
    }
    
  } catch (error) {
    console.error('❌ API key test failed:', error.message);
  }
}

// Run the test
testNanonetsAPI().catch(console.error);