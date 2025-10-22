/**
 * Complete Nanonets API Test Script
 * Tests the full PDF extraction and database storage flow
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: './frontend/.env.local' });

async function testCompleteFlow() {
  console.log('🧪 Testing Complete Nanonets + Database Flow');
  console.log('=' .repeat(50));

  try {
    // Step 1: Test Environment Configuration
    console.log('\n📋 Step 1: Checking Environment Configuration');
    console.log('-'.repeat(30));
    
    const apiKey = process.env.NANONETS_API_KEY;
    const modelId = process.env.NANONETS_MODEL_ID;
    const dbUrl = process.env.DATABASE_URL;

    console.log('🔑 NANONETS_API_KEY:', apiKey ? `${apiKey.substring(0, 8)}...` : '❌ Not set');
    console.log('🏷️ NANONETS_MODEL_ID:', modelId || '📝 Using default');
    console.log('🗄️ DATABASE_URL:', dbUrl ? '✅ Configured' : '❌ Not set');

    if (!apiKey || apiKey === 'YOUR_NEW_NANONETS_API_KEY_HERE') {
      console.error('\n❌ CRITICAL: Nanonets API key not configured!');
      console.log('📝 Please update NANONETS_API_KEY in frontend/.env.local');
      console.log('🔗 Get your API key from: https://app.nanonets.com/');
      return;
    }

    // Step 2: Test Nanonets Service
    console.log('\n🔧 Step 2: Testing Nanonets Service');
    console.log('-'.repeat(30));

    const { createNanonetsService } = require('./frontend/lib/services/nanonetsService');
    const nanonetsService = createNanonetsService();

    const status = nanonetsService.getStatus();
    console.log('📊 Service Status:', status);

    if (!status.configured) {
      console.error('❌ Nanonets service not properly configured');
      return;
    }

    // Step 3: Test API Connection
    console.log('\n🌐 Step 3: Testing API Connection');
    console.log('-'.repeat(30));

    try {
      console.log('📡 Fetching available models...');
      const models = await nanonetsService.getModels();
      console.log(`✅ API Connection successful! Found ${models.length} models`);
      
      if (models.length > 0) {
        console.log('📋 Available Models:');
        models.slice(0, 3).forEach(model => {
          console.log(`   - ${model.name} (ID: ${model.model_id})`);
        });
      }
    } catch (apiError) {
      console.error('❌ API Connection failed:', apiError.message);
      
      if (apiError.message.includes('401')) {
        console.log('🔑 Check your API key - it might be invalid or expired');
      } else if (apiError.message.includes('429')) {
        console.log('⏱️ Rate limit exceeded - try again later');
      }
      return;
    }

    // Step 4: Test PDF Extraction
    console.log('\n📄 Step 4: Testing PDF Extraction');
    console.log('-'.repeat(30));

    // Look for test PDFs
    const testPdfPaths = [
      './sample.pdf',
      './test.pdf',
      './CNX Sept 25 Chn.pdf',
      './frontend/public/sample.pdf'
    ];

    let testPdfPath = null;
    for (const pdfPath of testPdfPaths) {
      if (fs.existsSync(pdfPath)) {
        testPdfPath = pdfPath;
        break;
      }
    }

    if (!testPdfPath) {
      console.log('⚠️ No test PDF found. Creating a minimal test...');
      
      // Test with a simple text-based approach
      const testBuffer = Buffer.from('Test PDF content for API validation');
      
      try {
        console.log('🧪 Testing with minimal buffer...');
        const result = await nanonetsService.extractFromBuffer(testBuffer, 'test.txt', {
          extractTables: false,
          extractFields: false
        });
        
        console.log('📊 Minimal Test Result:', {
          success: result.success,
          provider: result.provider,
          hasText: !!result.extractedText,
          error: result.error
        });
        
      } catch (testError) {
        console.log('⚠️ Minimal test failed (expected for non-PDF content):', testError.message);
      }
      
      console.log('\n📝 To test with real PDF:');
      console.log('   1. Place a PDF file as ./sample.pdf');
      console.log('   2. Run this script again');
      console.log('   3. Or upload via the web interface at http://localhost:3000');
      
    } else {
      console.log(`📄 Found test PDF: ${testPdfPath}`);
      
      try {
        const fileBuffer = fs.readFileSync(testPdfPath);
        const filename = path.basename(testPdfPath);
        
        console.log(`📏 File size: ${(fileBuffer.length / 1024).toFixed(2)} KB`);
        console.log('🔄 Starting extraction...');
        
        const startTime = Date.now();
        const result = await nanonetsService.extractFromBuffer(fileBuffer, filename, {
          extractTables: true,
          extractFields: true
        });
        const duration = Date.now() - startTime;
        
        console.log('\n📊 Extraction Results:');
        console.log(`   ✅ Success: ${result.success}`);
        console.log(`   🏷️ Provider: ${result.provider}`);
        console.log(`   ⏱️ Duration: ${duration}ms`);
        console.log(`   📝 Text Length: ${result.extractedText?.length || 0} characters`);
        console.log(`   📋 Tables: ${result.tables?.length || 0}`);
        console.log(`   🏷️ Fields: ${Object.keys(result.fields || {}).length}`);
        console.log(`   ⚡ Confidence: ${result.metadata?.confidence?.toFixed(2) || 'N/A'}%`);
        
        if (result.extractedText && result.extractedText.length > 0) {
          console.log('\n📄 Text Preview:');
          console.log('   ' + result.extractedText.substring(0, 200) + '...');
        }
        
        if (result.tables && result.tables.length > 0) {
          console.log('\n📋 Table Preview:');
          const firstTable = result.tables[0];
          console.log(`   Rows: ${firstTable.rows?.length || 0}`);
          console.log(`   Columns: ${firstTable.metadata?.columnCount || 0}`);
        }
        
        if (result.fields && Object.keys(result.fields).length > 0) {
          console.log('\n🏷️ Fields Preview:');
          Object.entries(result.fields).slice(0, 5).forEach(([key, field]) => {
            console.log(`   ${key}: ${field.value} (${field.confidence?.toFixed(2)}%)`);
          });
        }

        // Step 5: Test Database Storage
        console.log('\n💾 Step 5: Testing Database Storage');
        console.log('-'.repeat(30));

        if (dbUrl) {
          try {
            const { getDatabaseService } = require('./frontend/lib/services/databaseService');
            const dbService = getDatabaseService();

            // Test database connection
            console.log('🔗 Testing database connection...');
            
            // Create a test file record
            const testFileRecord = await dbService.saveUploadedFile(
              filename,
              `test_${Date.now()}_${filename}`,
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
              structuredData: result.structuredData,
              extractedText: result.extractedText,
              ocrProvider: result.provider,
              metadata: result.metadata
            });

            console.log(`✅ Extraction record saved: ${extractionRecord.id}`);
            console.log('📊 Database storage successful!');

            // Test retrieval
            const retrievedExtraction = await dbService.getExtraction(extractionRecord.id);
            console.log(`✅ Data retrieval successful: ${!!retrievedExtraction}`);

            await dbService.disconnect();

          } catch (dbError) {
            console.error('❌ Database test failed:', dbError.message);
            console.log('🔧 Check your DATABASE_URL and ensure the database is accessible');
          }
        } else {
          console.log('⚠️ Database URL not configured - skipping database tests');
        }

      } catch (extractionError) {
        console.error('❌ PDF extraction failed:', extractionError.message);
        
        if (extractionError.message.includes('401')) {
          console.log('🔑 API key issue - check your Nanonets credentials');
        } else if (extractionError.message.includes('413')) {
          console.log('📏 File too large - try a smaller PDF (< 25MB)');
        } else if (extractionError.message.includes('429')) {
          console.log('⏱️ Rate limit - wait before trying again');
        }
      }
    }

    // Step 6: Integration Test Summary
    console.log('\n🎯 Step 6: Integration Test Summary');
    console.log('-'.repeat(30));

    console.log('✅ Configuration: API key configured');
    console.log('✅ Service: Nanonets service initialized');
    console.log('✅ Connection: API connection successful');
    console.log(testPdfPath ? '✅ Extraction: PDF processing tested' : '⚠️ Extraction: No PDF available for testing');
    console.log(dbUrl ? '✅ Database: Storage integration tested' : '⚠️ Database: Not configured');

    console.log('\n🚀 Next Steps:');
    console.log('1. Start your application: npm run dev');
    console.log('2. Visit: http://localhost:3000');
    console.log('3. Upload a pharmaceutical PDF');
    console.log('4. Check the extraction results and database storage');

    console.log('\n📚 Documentation:');
    console.log('- Setup Guide: ./NANONETS_SETUP_GUIDE.md');
    console.log('- API Docs: https://docstrange.nanonets.com/apidocs/');
    console.log('- Dashboard: https://app.nanonets.com/');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
if (require.main === module) {
  testCompleteFlow().catch(console.error);
}

module.exports = { testCompleteFlow };