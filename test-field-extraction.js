// Test field extraction with actual data structure

const actualData = {
  "company_name": "CHANDAN MEDICAL STORES (VS)",
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

console.log('🧪 Testing Field Extraction with Actual Data\n');

// Test the exact logic from the data formatter
const productName = 'BECOCNX_LITE';

console.log(`📦 Testing product: ${productName}`);

const findProductFieldValue = (fieldTypes) => {
  for (const fieldType of fieldTypes) {
    const fieldName = `item_${productName}_${fieldType}`;
    const value = actualData[fieldName];
    console.log(`  🔍 Checking field: ${fieldName} = ${value}`);
    if (value !== undefined && value !== null) {
      return typeof value === 'number' ? value : parseFloat(value) || 0;
    }
  }
  return 0;
};

console.log('\n📊 Field extraction results:');
console.log(`Opening qty: ${findProductFieldValue(['op'])}`);
console.log(`Purchase qty: ${findProductFieldValue(['pur'])}`);
console.log(`Free/Sample: ${findProductFieldValue(['sp'])}`);
console.log(`Sales qty: ${findProductFieldValue(['sale'])}`);
console.log(`Sales value: ${findProductFieldValue(['sval'])}`);
console.log(`Closing stock: ${findProductFieldValue(['c_stk'])}`);
console.log(`Closing value: ${findProductFieldValue(['c_val'])}`);

console.log('\n🔍 Testing BYCINE_OD:');
const productName2 = 'BYCINE_OD';

const findProductFieldValue2 = (fieldTypes) => {
  for (const fieldType of fieldTypes) {
    const fieldName = `item_${productName2}_${fieldType}`;
    const value = actualData[fieldName];
    console.log(`  🔍 Checking field: ${fieldName} = ${value}`);
    if (value !== undefined && value !== null) {
      return typeof value === 'number' ? value : parseFloat(value) || 0;
    }
  }
  return 0;
};

console.log(`Sales qty: ${findProductFieldValue2(['sale'])}`);
console.log(`Sales value: ${findProductFieldValue2(['sval'])}`);
console.log(`Purchase qty: ${findProductFieldValue2(['pur'])}`);
console.log(`Free/Sample: ${findProductFieldValue2(['sp'])}`);

console.log('\n✅ Field extraction test completed!');