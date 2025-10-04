// Test the fixed product name extraction logic

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
  "item_BYCINE_OD_sval": 9000,
  "item_BYCINE_OD_c_stk": 3,
  "item_BYCINE_OD_c_val": 493
};

console.log('🧪 Testing FIXED Product Name Extraction\n');

const allKeys = Object.keys(sampleData);

// Look for fields that have actual data (not just pack info)
const dataFields = allKeys.filter(field => 
  field.startsWith('item_') && 
  !field.endsWith('_pack') &&
  (field.endsWith('_sale') || field.endsWith('_sval') || field.endsWith('_op'))
);

console.log('🔍 Data fields:', dataFields);

const productNames = new Set();

dataFields.forEach(field => {
  console.log(`\n🔍 Processing field: ${field}`);
  
  // Extract product name from patterns like "item_BECOCNX_LITE_sale"
  const withoutItem = field.substring(5); // Remove "item_"
  console.log(`  After removing 'item_': ${withoutItem}`);
  
  // Handle specific field endings
  let productName = '';
  if (withoutItem.endsWith('_sale')) {
    productName = withoutItem.substring(0, withoutItem.length - 5);
    console.log(`  Removed '_sale': ${productName}`);
  } else if (withoutItem.endsWith('_sval')) {
    productName = withoutItem.substring(0, withoutItem.length - 5);
    console.log(`  Removed '_sval': ${productName}`);
  } else if (withoutItem.endsWith('_op')) {
    productName = withoutItem.substring(0, withoutItem.length - 3);
    console.log(`  Removed '_op': ${productName}`);
  }
  
  if (productName && productName.length > 2 && !productName.match(/^\d+$/)) {
    productNames.add(productName);
    console.log(`  ✅ Added to product names`);
  } else {
    console.log(`  ❌ Rejected`);
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
  const cStkField = `item_${productName}_c_stk`;
  const cValField = `item_${productName}_c_val`;
  
  console.log(`  Sale qty (${saleField}): ${sampleData[saleField]}`);
  console.log(`  Sale value (${svalField}): ${sampleData[svalField]}`);
  console.log(`  Opening (${opField}): ${sampleData[opField]}`);
  console.log(`  Closing stock (${cStkField}): ${sampleData[cStkField]}`);
  console.log(`  Closing value (${cValField}): ${sampleData[cValField]}`);
});

console.log('\n✅ FIXED extraction test completed!');