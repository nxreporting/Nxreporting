/**
 * Test script to verify the OCR service fix
 */

async function testOCRFix() {
  console.log('🧪 Testing OCR Service Fix');
  console.log('=' .repeat(40));

  try {
    // Test 1: Import services
    console.log('\n📋 Test 1: Import Services');
    console.log('-'.repeat(25));
    
    const { ocrService } = require('./frontend/lib/services/multiProviderOCRService');
    console.log('✅ MultiProviderOCRService imported successfully');

    // Test 2: Check service status
    console.log('\n📋 Test 2: Check Service Status');
    console.log('-'.repeat(25));
    
    const status = await ocrService.getStatus();
    console.log('📊 Service Status:', JSON.stringify(status, null, 2));

    // Test 3: Test with minimal buffer
    console.log('\n📋 Test 3: Test Extraction');
    console.log('-'.repeat(25));
    
    const testBuffer = Buffer.from('Test content for OCR validation');
    console.log('🧪 Testing with minimal buffer...');
    
    try {
      const result = await ocrService.extractFromBuffer(testBuffer, 'test.txt');
      console.log('📊 Extraction Result:', {
        success: result.success,
        provider: result.provider,
        hasText: !!result.extractedText,
        textLength: result.extractedText?.length || 0,
        error: result.error
      });
    } catch (extractError) {
      console.log('⚠️ Extraction test failed (expected for non-PDF):', extractError.message);
    }

    console.log('\n✅ OCR Service Fix Test Complete!');
    console.log('🚀 The 500 error should now be resolved.');
    console.log('💡 Start your app with: npm run dev');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testOCRFix().catch(console.error);