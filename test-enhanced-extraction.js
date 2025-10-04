const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testEnhancedExtraction() {
  console.log('🧪 Testing Enhanced PDF Extraction...\n');

  // Test file path - using the same file from your screenshot
  const testFile = './uploads/0673a55d-74d0-40c4-b053-8fa59906da14-1758199776394.pdf';
  
  if (!fs.existsSync(testFile)) {
    console.log('❌ Test file not found. Please upload a PDF first.');
    return;
  }

  try {
    // Create form data
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFile));
    formData.append('output_type', 'flat-json');

    console.log('📡 Making request to enhanced extraction endpoint...');
    
    const response = await fetch('http://localhost:5000/api/extract', {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });

    console.log(`📬 Response Status: ${response.status}\n`);

    if (response.ok) {
      const result = await response.json();
      
      console.log('✅ EXTRACTION SUCCESSFUL!\n');
      
      // Show formatted data
      if (result.formattedData) {
        console.log('📊 FORMATTED STOCK REPORT:');
        console.log('=' .repeat(50));
        console.log(`🏢 Company: ${result.formattedData.company.name}`);
        console.log(`📋 Report: ${result.formattedData.report.title}`);
        console.log(`📅 Period: ${result.formattedData.report.dateRange}`);
        console.log(`📦 Total Items: ${result.formattedData.items.length}`);
        console.log('\n📋 ITEMS BREAKDOWN:');
        
        result.formattedData.items.forEach((item, index) => {
          console.log(`\n${index + 1}. ${item.name}`);
          console.log(`   Opening: ${item.opening.qty} units`);
          console.log(`   Purchase: ${item.purchase.qty} + ${item.purchase.free} free`);
          console.log(`   Sales: ${item.sales.qty} units (₹${item.sales.value})`);
          console.log(`   Closing: ${item.closing.qty} units (₹${item.closing.value})`);
        });
        
        console.log('\n💰 SUMMARY:');
        console.log('=' .repeat(30));
        console.log(`Total Sales Value: ₹${result.formattedData.summary.totalSalesValue.toLocaleString()}`);
        console.log(`Total Closing Value: ₹${result.formattedData.summary.totalClosingValue.toLocaleString()}`);
      }
      
      // Show AI-generated summary
      if (result.summary) {
        console.log('\n🤖 AI SUMMARY:');
        console.log('=' .repeat(40));
        console.log(result.summary);
      }
      
    } else {
      const error = await response.text();
      console.log('❌ Extraction failed:', error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testEnhancedExtraction();