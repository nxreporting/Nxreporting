// Test OCR extraction to debug the issue
console.log('🔍 Testing OCR extraction debug...');

// Simulate the OCR service behavior
async function testOCRService() {
  console.log('🔄 Testing OCR.space API...');
  
  // Check environment variables
  const ocrSpaceKey = process.env.OCR_SPACE_API_KEY || 'helloworld';
  const nanonetsKey = process.env.NANONETS_API_KEY;
  
  console.log('🔑 OCR.space API Key:', ocrSpaceKey ? 'Configured' : 'Missing');
  console.log('🔑 Nanonets API Key:', nanonetsKey ? 'Configured' : 'Missing');
  
  // Test with a simple text image URL (OCR.space supports URLs)
  const testImageUrl = 'https://www.learningcontainer.com/wp-content/uploads/2019/09/sample-ocr-file.jpg';
  
  try {
    const formData = new FormData();
    formData.append('url', testImageUrl);
    formData.append('apikey', ocrSpaceKey);
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');
    formData.append('detectOrientation', 'false');
    formData.append('scale', 'true');
    formData.append('OCREngine', '2');

    console.log('📡 Making test OCR.space request...');

    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: formData
    });

    console.log('📊 Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ OCR.space error response:', errorText);
      return false;
    }

    const responseData = await response.json();
    console.log('📊 OCR.space response:', JSON.stringify(responseData, null, 2));

    if (responseData.IsErroredOnProcessing) {
      const errorMsg = Array.isArray(responseData.ErrorMessage) 
        ? responseData.ErrorMessage.join(', ') 
        : responseData.ErrorMessage;
      console.log('❌ OCR.space processing error:', errorMsg);
      return false;
    }

    // Extract text from OCR.space response
    let extractedText = '';
    if (responseData.ParsedResults && responseData.ParsedResults.length > 0) {
      extractedText = responseData.ParsedResults
        .map((result) => result.ParsedText || '')
        .filter((text) => text.trim())
        .join('\n')
        .trim();
    }

    if (extractedText) {
      console.log('✅ OCR.space extraction successful!');
      console.log('📜 Extracted text:', extractedText.substring(0, 200) + '...');
      return true;
    } else {
      console.log('⚠️ No text extracted from test image');
      return false;
    }

  } catch (error) {
    console.log('❌ OCR.space test failed:', error.message);
    return false;
  }
}

// Test the OCR service
testOCRService().then(success => {
  if (success) {
    console.log('\n✅ OCR service is working correctly!');
    console.log('📝 The issue might be:');
    console.log('  1. PDF format not supported by OCR.space');
    console.log('  2. PDF file too large or complex');
    console.log('  3. Network issues during extraction');
    console.log('\n🔧 Solutions:');
    console.log('  1. Try with a simpler PDF');
    console.log('  2. Check Vercel environment variables');
    console.log('  3. Monitor extraction logs in production');
  } else {
    console.log('\n❌ OCR service is not working');
    console.log('📝 Possible issues:');
    console.log('  1. API key not configured correctly');
    console.log('  2. OCR.space service unavailable');
    console.log('  3. Network connectivity issues');
    console.log('\n🔧 Next steps:');
    console.log('  1. Get a proper OCR.space API key');
    console.log('  2. Configure Nanonets properly');
    console.log('  3. Add more fallback OCR services');
  }
}).catch(error => {
  console.log('❌ Test failed with error:', error.message);
});