// Debug the actual data structure from your console log

const actualExtractedData = {
  "store_name": "CHANDAN MEDICAL STORES (VS)",
  "store_address_phone": "LL,26-2 MAHARANA PRATAP,B H V S HOSPITAL Ph:9909020590,9712320590",
  "report_type": "Stock and Sales report",
  "report_start_date": "01-Aug-25",
  "report_end_date": "30-Aug-25",
  "item_MG0014_pack": null,
  "item_MG0014_jun": null,
  "item_MG0014_jul": null,
  "item_MG0014_op": null,
  "item_MG0014_pur": null,
  "item_MG0014_sp": null,
  "item_MG0014_sale": null,
  "item_MG0014_ss": null,
  "item_MG0014_sval": null,
  "item_MG0014_cr": null,
  "item_MG0014_db": null,
  "item_MG0014_adj": null,
  "item_MG0014_c_stk": null,
  "item_MG0014_c_val": null,
  "item_MG0014_ord": null,
  "category_1_name": "CNX PLUS",
  "category_1_code": "M00032",
  "item_BECOCNX_LITE_pack": "1",
  "item_BECOCNX_LITE_jun": null,
  "item_BECOCNX_LITE_jul": 10,
  "item_BECOCNX_LITE_op": 51,
  "item_BECOCNX_LITE_pur": null,
  "item_BECOCNX_LITE_sp": null,
  "item_BECOCNX_LITE_sale": 15,
  "item_BECOCNX_LITE_ss": 3,
  "item_BECOCNX_LITE_sval": 964,
  "item_BECOCNX_LITE_cr": null,
  "item_BECOCNX_LITE_db": null,
  "item_BECOCNX_LITE_adj": null,
  "item_BECOCNX_LITE_c_stk": 33,
  "item_BECOCNX_LITE_c_val": 1909,
  "item_BECOCNX_LITE_ord": null,
  "item_BENCNX_OD_pack": "1",
  "item_BENCNX_OD_jun": 100,
  "item_BENCNX_OD_jul": 7,
  "item_BENCNX_OD_op": 51,
  "item_BENCNX_OD_pur": 50,
  "item_BENCNX_OD_sp": 10,
  "item_BENCNX_OD_sale": 50,
  "item_BENCNX_OD_ss": 10,
  "item_BENCNX_OD_sval": 9000,
  "item_BENCNX_OD_cr": null,
  "item_BENCNX_OD_db": null,
  "item_BENCNX_OD_adj": null,
  "item_BENCNX_OD_c_stk": null,
  "item_BENCNX_OD_c_val": null
};

console.log('🧪 Debugging Actual Data Structure\n');

// Test product name extraction
const allKeys = Object.keys(actualExtractedData);
console.log('📊 Total keys:', allKeys.length);

// Look for fields that have actual data (not just pack info)
const dataFields = allKeys.filter(field => 
  field.startsWith('item_') && 
  !field.endsWith('_pack') &&
  (field.endsWith('_sale') || field.endsWith('_sval') || field.endsWith('_op'))
);

console.log('🔍 Data fields found:', dataFields);

const productNames = new Set();

dataFields.forEach(field => {
  console.log(`\n🔍 Processing field: ${field}`);
  
  const withoutItem = field.substring(5); // Remove "item_"
  
  let productName = '';
  if (withoutItem.endsWith('_sale')) {
    productName = withoutItem.substring(0, withoutItem.length - 5);
  } else if (withoutItem.endsWith('_sval')) {
    productName = withoutItem.substring(0, withoutItem.length - 5);
  } else if (withoutItem.endsWith('_op')) {
    productName = withoutItem.substring(0, withoutItem.length - 3);
  }
  
  console.log(`  Extracted product name: "${productName}"`);
  
  if (productName && productName.length > 2 && !productName.match(/^\d+$/)) {
    productNames.add(productName);
    console.log(`  ✅ Added to product names`);
  }
});

console.log('\n🎯 Final product names:', Array.from(productNames));

// Test field value extraction for each product
console.log('\n🔍 Testing field value extraction:');

Array.from(productNames).forEach(productName => {
  console.log(`\n📦 Product: ${productName}`);
  
  const findProductFieldValue = (fieldTypes) => {
    for (const fieldType of fieldTypes) {
      const fieldName = `item_${productName}_${fieldType}`;
      const value = actualExtractedData[fieldName];
      console.log(`  🔍 Checking field: ${fieldName} = ${value} (type: ${typeof value})`);
      if (value !== undefined && value !== null) {
        const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
        console.log(`    → Converted to: ${numValue}`);
        return numValue;
      }
    }
    return 0;
  };

  console.log(`  Opening qty: ${findProductFieldValue(['op'])}`);
  console.log(`  Purchase qty: ${findProductFieldValue(['pur'])}`);
  console.log(`  Free/Sample: ${findProductFieldValue(['sp'])}`);
  console.log(`  Sales qty: ${findProductFieldValue(['sale'])}`);
  console.log(`  Sales value: ${findProductFieldValue(['sval'])}`);
  console.log(`  Closing stock: ${findProductFieldValue(['c_stk'])}`);
  console.log(`  Closing value: ${findProductFieldValue(['c_val'])}`);
});

console.log('\n✅ Debug completed!');