const fs = require('fs');
const FormData = require('form-data');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testBackendExtract() {
  console.log('🧪 Testing backend /api/extract endpoint...');
  
  // Find a test PDF file
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
    return;
  }
  
  try {
    console.log('\n🔬 Testing backend extraction endpoint...');
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFile));
    formData.append('output_type', 'flat-json');
    
    console.log('📡 Making request to: http://localhost:5000/api/extract');
    
    const response = await fetch('http://localhost:5000/api/extract', {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });
    
    console.log('\n📬 Response received:');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Content-Type:', response.headers.get('content-type'));
    
    const responseText = await response.text();
    console.log('\n📄 Raw response (first 1000 chars):');
    console.log(responseText.substring(0, 1000));
    
    if (!response.ok) {
      console.log('\n❌ Backend extraction failed!');
      return;
    }
    
    // Try to parse as JSON
    try {
      const jsonData = JSON.parse(responseText);
      console.log('\n✅ Backend extraction successful!');
      console.log('Response keys:', Object.keys(jsonData));
      
      if (jsonData.success) {
        console.log('✅ Extraction completed successfully');
        if (jsonData.data) {
          console.log('📊 Data keys:', Object.keys(jsonData.data));
        }
        if (jsonData.extractedText) {
          console.log('📜 Extracted text length:', jsonData.extractedText.length);
        }
      } else {
        console.log('❌ Extraction failed:', jsonData.error);
      }
      
    } catch (parseError) {
      console.log('\n⚠️ Response is not valid JSON');
      console.log('Parse error:', parseError.message);
    }
    
  } catch (error) {
    console.error('\n❌ Network error:', error.message);
  }
}

// Run the test
testBackendExtract().catch(console.error);