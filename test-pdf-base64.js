// Test PDF processing with base64 encoding for OCR.space
console.log('🔍 Testing PDF processing with base64 encoding...');

const fs = require('fs');
const path = require('path');

async function testPDFBase64() {
  try {
    // Create a minimal PDF buffer for testing (this is just a test - real PDFs will be uploaded)
    const testPDFBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n179\n%%EOF');
    
    console.log('📄 Created test PDF buffer, size:', testPDFBuffer.length, 'bytes');
    
    // Convert to base64 like the OCR service will do
    const base64Data = testPDFBuffer.toString('base64');
    const base64String = `data:application/pdf;base64,${base64Data}`;
    
    console.log('📊 Base64 string length:', base64String.length);
    console.log('📊 Base64 preview:', base64String.substring(0, 100) + '...');
    
    // Test the OCR.space API with base64 PDF
    const formData = new FormData();
    formData.append('base64Image', base64String);
    formData.append('apikey', 'K82877653688957');
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');
    formData.append('detectOrientation', 'false');
    formData.append('scale', 'true');
    formData.append('OCREngine', '2');
    formData.append('filetype', 'PDF');

    console.log('📡 Making OCR.space request with base64 PDF...');

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
      
      // Check if it's still a file type error
      if (errorMsg.includes('file type') || errorMsg.includes('E216')) {
        console.log('⚠️ Still getting file type error with base64 approach');
        return false;
      } else if (errorMsg.includes('No text found') || errorMsg.includes('empty')) {
        console.log('✅ File type error resolved! (No text found is expected for test PDF)');
        return true;
      }
      
      return false;
    }

    // If we get here, the PDF was processed successfully
    console.log('✅ PDF processed successfully with base64 approach!');
    return true;

  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
    return false;
  }
}

// Run the test
testPDFBase64().then(success => {
  if (success) {
    console.log('\n🎉 SUCCESS! Base64 PDF approach is working!');
    console.log('📝 The OCR service should now handle PDF files correctly');
    console.log('🔧 Next steps:');
    console.log('1. Deploy the updated OCR service');
    console.log('2. Test with actual pharmaceutical PDF');
    console.log('3. Verify real data extraction');
  } else {
    console.log('\n❌ Base64 approach still has issues');
    console.log('📝 Will fall back to Nanonets OCR service');
    console.log('🔧 Fallback strategy:');
    console.log('1. OCR.space fails → Try Nanonets');
    console.log('2. Nanonets fails → Use fallback data');
    console.log('3. System continues to work with sample data');
  }
}).catch(error => {
  console.log('❌ Test execution failed:', error.message);
});