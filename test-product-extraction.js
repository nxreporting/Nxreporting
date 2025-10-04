// Test product name extraction logic

const sampleData = {
  "item_BECOCNX_LITE_pack": "1",
  "item_BECOCNX_LITE_jul": 10,
  "item_BECOCNX_LITE_op": 51,
  "item_BECOCNX_LITE_sale": 15,
  "item_BECOCNX_LITE_ss": 3,
  "item_BECOCNX_LITE_sval": 964,
  "item_BECOCNX_LITE_c_stk": 33,
  "item_BECOCNX_LITE_c_val": 1909,
  "item_BYCINE_OD_pack": "1",
  "item_BYCINE_OD_jun": 100,
  "item_BYCINE_OD_pur": 50,
  "item_BYCINE_OD_sp": 10,
  "item_BYCINE_OD_sale": 50,
  "item_BYCINE_OD_ss": 10,
  "item_BYCINE_OD_sval": 9000
};

console.log('🧪 Testing Product Name Extraction\n');

const allKeys = Object.keys(sampleData);
console.log('📊 All keys:', allKeys);

// Look for fields that have actual data (not just pack info)
const dataFields = allKeys.filter(field => 
  field.startsWith('item_') && 
  !field.endsWith('_pack') &&
  (field.includes('_sale') || field.includes('_sval') || field.includes('_op') || field.includes('_c_stk'))
);

console.log('\n🔍 Data fields:', dataFields);

const productNames = new Set();

dataFields.forEach(field => {
  console.log(`\n🔍 Processing field: ${field}`);
  
  // Extract product name from patterns like "item_BECOCNX_LITE_sale"
  const withoutItem = field.substring(5); // Remove "item_"
  console.log(`  After removing 'item_': ${withoutItem}`);
  
  const lastUnderscoreIndex = withoutItem.lastIndexOf('_');
  console.log(`  Last underscore at index: ${lastUnderscoreIndex}`);
  
  if (lastUnderscoreIndex > 0) {
    const productName = withoutItem.substring(0, lastUnderscoreIndex);
    console.log(`  Extracted product name: "${productName}"`);
    
    if (productName && productName.length > 2 && !productName.match(/^\d+$/)) {
      productNames.add(productName);
      console.log(`  ✅ Added to product names`);
    } else {
      console.log(`  ❌ Rejected (too short or numeric)`);
    }
  }
});

console.log('\n🎯 Final product names:', Array.from(productNames));

// Test field value extraction
console.log('\n🔍 Testing field value extraction:');
Array.from(productNames).forEach(productName => {
  console.log(`\n📦 Product: ${productName}`);
  
  const saleField = `item_${productName}_sale`;
  const svalField = `item_${productName}_sval`;
  const opField = `item_${productName}_op`;
  
  console.log(`  Sale qty (${saleField}): ${sampleData[saleField]}`);
  console.log(`  Sale value (${svalField}): ${sampleData[svalField]}`);
  console.log(`  Opening (${opField}): ${sampleData[opField]}`);
});

console.log('\n✅ Product extraction test completed!');