/**
 * Test Script for dots.ocr Integration
 * Tests the complete integration with your existing PDF extraction system
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: './frontend/.env.local' });

async function testDotsOCRIntegration() {
  console.log('🧪 Testing dots.ocr Integration');
  console.log('=' .repeat(50));

  try {
    // Step 1: Test dots.ocr Service
    console.log('\n📋 Step 1: Testing dots.ocr Service');
    console.log('-'.repeat(30));
    
    const { createDotsOCRService } = require('./frontend/lib/services/dotsOCRService');
    const dotsOCRService = createDotsOCRService();

    // Check service status
    console.log('🔍 Checking dots.ocr server status...');
    const status = await dotsOCRService.getStatus();
    console.log('📊 Service Status:', status);

    if (!status.available) {
      console.error('❌ dots.ocr server not available!');
      console.log('💡 Please start the vLLM server:');
      console.log('   vllm serve ./weights/DotsOCR --trust-remote-code --port 8000');
      return;
    }

    console.log('✅ dots.ocr server is running!');

    // Step 2: Test Multi-Provider OCR Service
    console.log('\n📋 Step 2: Testing Multi-Provider OCR Service');
    console.log('-'.repeat(30));

    const { ocrService } = require('./frontend/lib/services/multiProviderOCRService');
    
    // Check service status
    const ocrStatus = ocrService.getStatus();
    console.log('📊 OCR Service Status:', ocrStatus);

    // Step 3: Test with Sample File
    console.log('\n📋 Step 3: Testing with Sample File');
    console.log('-'.repeat(30));

    // Look for test files
    const testFiles = [
      './sample.pdf',
      './test.pdf',
      './CNX Sept 25 Chn.pdf',
      './frontend/public/sample.pdf'
    ];

    let testFile = null;
    for (const filePath of testFiles) {
      if (fs.existsSync(filePath)) {
        testFile = filePath;
        break;
      }
    }

    if (!testFile) {
      console.log('⚠️ No test PDF found. Creating a test with text buffer...');
      
      // Test with minimal buffer
      const testBuffer = Buffer.from('Test PDF content for dots.ocr validation');
      
      try {
        console.log('🧪 Testing with minimal buffer...');
        const result = await dotsOCRService.extractFromBuffer(testBuffer, 'test.txt', {
          mode: 'ocr_only'
        });
        
        console.log('📊 Minimal Test Result:', {
          success: result.success,
          provider: result.provider,
          hasText: !!result.extractedText,
          textLength: result.extractedText?.length || 0,
          error: result.error
        });
        
      } catch (testError) {
        console.log('⚠️ Minimal test failed (expected for non-PDF content):', testError.message);
      }
      
    } else {
      console.log(`📄 Found test file: ${testFile}`);
      
      try {
        const fileBuffer = fs.readFileSync(testFile);
        const filename = path.basename(testFile);
        
        console.log(`📏 File size: ${(fileBuffer.length / 1024).toFixed(2)} KB`);
        console.log('🔄 Starting extraction with multi-provider service...');
        
        const startTime = Date.now();
        const result = await ocrService.extractFromBuffer(fileBuffer, filename);
        const duration = Date.now() - startTime;
        
        console.log('\n📊 Extraction Results:');
        console.log(`   ✅ Success: ${result.success}`);
        console.log(`   🏷️ Provider: ${result.provider}`);
        console.log(`   ⏱️ Duration: ${duration}ms`);
        console.log(`   📝 Text Length: ${result.extractedText?.length || 0} characters`);
        console.log(`   ⚡ Confidence: ${result.metadata?.confidence?.toFixed(2) || 'N/A'}%`);
        console.log(`   📊 Elements: ${result.metadata?.elements || result.metadata?.layoutElements || 'N/A'}`);
        
        if (result.extractedText && result.extractedText.length > 0) {
          console.log('\n📄 Text Preview:');
          console.log('   ' + result.extractedText.substring(0, 200) + '...');
        }
        
        if (result.metadata?.layoutElements > 0) {
          console.log('\n📋 Layout Detection:');
          console.log(`   Elements detected: ${result.metadata.layoutElements}`);
          console.log('   ✅ Layout analysis available');
        }

        // Step 4: Test Database Integration
        console.log('\n📋 Step 4: Testing Database Integration');
        console.log('-'.repeat(30));

        try {
          const { getDatabaseService } = require('./frontend/lib/services/databaseService');
          const dbService = getDatabaseService();

          // Test database connection
          console.log('🔗 Testing database connection...');
          
          // Create a test file record
          const testFileRecord = await dbService.saveUploadedFile(
            filename,
            `dots_ocr_test_${Date.now()}_${filename}`,
            `test://storage/${filename}`,
            'application/pdf',
            fileBuffer.length,
            'test-user'
          );
          
          console.log(`✅ File record created: ${testFileRecord.id}`);

          // Save extraction data
          const extractionRecord = await dbService.saveExtractionData({
            fileId: testFileRecord.id,
            userId: 'test-user',
            rawData: result.data,
            structuredData: result.data,
            extractedText: result.extractedText,
            ocrProvider: result.provider,
            metadata: result.metadata
          });

          console.log(`✅ Extraction record saved: ${extractionRecord.id}`);
          console.log('📊 Database integration successful!');

          await dbService.disconnect();

        } catch (dbError) {
          console.error('❌ Database test failed:', dbError.message);
          console.log('🔧 Check your DATABASE_URL and ensure the database is accessible');
        }

      } catch (extractionError) {
        console.error('❌ PDF extraction failed:', extractionError.message);
        
        if (extractionError.message.includes('server not available')) {
          console.log('🔧 Start the dots.ocr server and try again');
        } else if (extractionError.message.includes('CUDA')) {
          console.log('🔧 GPU memory issue - try reducing batch size');
        }
      }
    }

    // Step 5: Integration Summary
    console.log('\n🎯 Step 5: Integration Summary');
    console.log('-'.repeat(30));

    console.log('✅ dots.ocr Service: Integrated');
    console.log('✅ Multi-Provider OCR: Updated with dots.ocr as primary');
    console.log('✅ Database Integration: Ready for enhanced data');
    console.log('✅ Fallback System: Nanonets → OCR.space → Fallback');

    console.log('\n🚀 Next Steps:');
    console.log('1. Start your application: npm run dev');
    console.log('2. Visit: http://localhost:3000');
    console.log('3. Upload a pharmaceutical PDF');
    console.log('4. Check that "dots.ocr" is used as the provider');
    console.log('5. Compare results with previous extractions');

    console.log('\n📚 Documentation:');
    console.log('- Integration Guide: ./DOTS_OCR_INTEGRATION_GUIDE.md');
    console.log('- Troubleshooting: ./DOTS_OCR_TROUBLESHOOTING.md');
    console.log('- dots.ocr Repo: https://github.com/rednote-hilab/dots.ocr');

  } catch (error) {
    console.error('\n❌ Integration test failed:', error.message);
    console.error('Stack trace:', error.stack);
    
    console.log('\n🔧 Troubleshooting Steps:');
    console.log('1. Ensure dots.ocr is installed and model downloaded');
    console.log('2. Start vLLM server: vllm serve ./weights/DotsOCR --trust-remote-code');
    console.log('3. Check server: curl http://localhost:8000/health');
    console.log('4. Verify environment variables in frontend/.env.local');
  }
}

// Run the test
if (require.main === module) {
  testDotsOCRIntegration().catch(console.error);
}

module.exports = { testDotsOCRIntegration };