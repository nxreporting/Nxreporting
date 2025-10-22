/**
 * Test the simplified OCR service to isolate 500 error
 */

async function testSimpleOCR() {
  console.log('🧪 Testing Simple OCR Service');
  console.log('=' .repeat(35));

  try {
    // Test 1: Import simple service
    console.log('\n📋 Test 1: Import Simple Service');
    const { simpleOCRService } = require('./frontend/lib/services/simpleOCRService');
    console.log('✅ Simple OCR Service imported successfully');

    // Test 2: Check service status
    console.log('\n📋 Test 2: Check Service Status');
    const status = await simpleOCRService.getStatus();
    console.log('✅ Service status:', {
      ready: status.ready,
      providers: status.providers.map(p => ({ name: p.name, configured: p.configured }))
    });

    // Test 3: Test extraction
    console.log('\n📋 Test 3: Test Extraction');
    const testBuffer = Buffer.from('Test PDF content for simple OCR');
    
    try {
      const result = await simpleOCRService.extractFromBuffer(testBuffer, 'test.pdf');
      console.log('✅ Extraction result:', {
        success: result.success,
        provider: result.provider,
        hasText: !!result.extractedText,
        textLength: result.extractedText?.length || 0,
        error: result.error
      });
    } catch (extractError) {
      console.log('⚠️ Extraction failed:', extractError.message);
    }

    console.log('\n🎉 Simple OCR Test Complete!');
    console.log('✅ If this works, the issue is in the complex service');
    console.log('🚀 Try uploading a PDF now - should work without 500 error');

  } catch (error) {
    console.error('\n❌ Simple OCR test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testSimpleOCR().catch(console.error);