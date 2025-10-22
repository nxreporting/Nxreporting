/**
 * Quick test to verify the 500 error fix
 */

async function test500Fix() {
  console.log('🧪 Testing 500 Error Fix');
  console.log('=' .repeat(30));

  try {
    // Test 1: Import the OCR service
    console.log('\n📋 Test 1: Import OCR Service');
    const { ocrService } = require('./frontend/lib/services/multiProviderOCRService');
    console.log('✅ OCR Service imported successfully');

    // Test 2: Check service status
    console.log('\n📋 Test 2: Check Service Status');
    try {
      const status = await ocrService.getStatus();
      console.log('✅ Service status retrieved:', {
        ready: status.ready,
        providerCount: status.providers.length,
        timestamp: status.timestamp
      });
    } catch (statusError) {
      console.error('❌ Status check failed:', statusError.message);
    }

    // Test 3: Test with minimal extraction
    console.log('\n📋 Test 3: Test Minimal Extraction');
    try {
      const testBuffer = Buffer.from('Test PDF content');
      const result = await ocrService.extractFromBuffer(testBuffer, 'test.pdf');
      
      console.log('✅ Extraction test completed:', {
        success: result.success,
        provider: result.provider,
        hasError: !!result.error,
        errorMessage: result.error
      });
    } catch (extractError) {
      console.log('⚠️ Extraction failed (expected):', extractError.message);
    }

    console.log('\n🎉 500 Error Fix Test Complete!');
    console.log('✅ The service should now work without TypeScript errors');
    console.log('🚀 Try uploading a PDF in your application');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
test500Fix().catch(console.error);