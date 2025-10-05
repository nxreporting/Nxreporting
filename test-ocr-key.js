// Test the new OCR.space API key
console.log('🔍 Testing OCR.space API key: K82877653688957');

async function testOCRKey() {
  try {
    // Test with a simple text image URL
    const testImageUrl = 'https://www.learningcontainer.com/wp-content/uploads/2019/09/sample-ocr-file.jpg';
    
    const formData = new FormData();
    formData.append('url', testImageUrl);
    formData.append('apikey', 'K82877653688957');
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');
    formData.append('detectOrientation', 'false');
    formData.append('scale', 'true');
    formData.append('OCREngine', '2');

    console.log('📡 Making test request to OCR.space...');

    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: formData
    });

    console.log('📊 Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ HTTP Error:', errorText);
      return false;
    }

    const responseData = await response.json();
    console.log('📊 OCR.space response:', JSON.stringify(responseData, null, 2));

    if (responseData.IsErroredOnProcessing) {
      const errorMsg = Array.isArray(responseData.ErrorMessage) 
        ? responseData.ErrorMessage.join(', ') 
        : responseData.ErrorMessage;
      console.log('❌ OCR processing error:', errorMsg);
      return false;
    }

    // Extract text from response
    let extractedText = '';
    if (responseData.ParsedResults && responseData.ParsedResults.length > 0) {
      extractedText = responseData.ParsedResults
        .map((result) => result.ParsedText || '')
        .filter((text) => text.trim())
        .join('\n')
        .trim();
    }

    if (extractedText) {
      console.log('✅ OCR extraction successful!');
      console.log('📜 Extracted text:', extractedText);
      console.log('📏 Text length:', extractedText.length, 'characters');
      return true;
    } else {
      console.log('⚠️ No text extracted from test image');
      return false;
    }

  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
    return false;
  }
}

// Run the test
testOCRKey().then(success => {
  if (success) {
    console.log('\n🎉 SUCCESS! OCR.space API key is working correctly!');
    console.log('📝 Next steps:');
    console.log('1. Add this key to Vercel environment variables');
    console.log('2. Redeploy the application');
    console.log('3. Test PDF extraction with real documents');
    console.log('\n🔧 Vercel Environment Variable:');
    console.log('Name: OCR_SPACE_API_KEY');
    console.log('Value: K82877653688957');
  } else {
    console.log('\n❌ FAILED! There might be an issue with the API key or service');
    console.log('📝 Possible issues:');
    console.log('1. API key might be invalid or expired');
    console.log('2. OCR.space service might be temporarily unavailable');
    console.log('3. Network connectivity issues');
  }
}).catch(error => {
  console.log('❌ Test execution failed:', error.message);
});