// Test the updated TextParser with actual OCR-like text
console.log('🧪 Testing updated TextParser with OCR-like text...');

// Simulate the updated text parser logic
function parseStockReportText(rawText) {
  console.log('🔄 Starting text parsing...');
  console.log('📄 Raw text preview:', rawText.substring(0, 500) + '...');
  
  const result = {
    company_name: 'Unknown Company',
    report_title: 'Stock Report',
    date_range: 'Unknown Period'
  };

  try {
    // Extract company name
    const companyMatch = rawText.match(/([A-Z\s]+MEDICINES?)/i);
    if (companyMatch) {
      let companyName = companyMatch[1].trim();
      companyName = companyName.replace(/^.*?([A-Z]+\s+MEDICINES?).*$/i, '$1');
      result.company_name = companyName;
      console.log('🏢 Found company:', result.company_name);
    }

    // Extract date range
    const dateMatch = rawText.match(/\((\d{2}-\w{3}-\d{4})\s+TO\s+(\d{2}-\w{3}-\d{4})\)/);
    if (dateMatch) {
      result.date_range = `${dateMatch[1]} TO ${dateMatch[2]}`;
      console.log('📅 Found date range:', result.date_range);
    }

    // Parse items from OCR text
    parseDirectStructure(rawText, result);

    return result;

  } catch (error) {
    console.error('❌ Text parsing error:', error);
    return result;
  }
}

function parseDirectStructure(rawText, result) {
  console.log('🔄 Parsing actual tabular OCR data...');
  
  try {
    // Split text into lines and clean them
    const lines = rawText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    console.log(`📄 Processing ${lines.length} lines of OCR text`);
    
    // Parse tabular data where item names and numbers are on the same line
    const itemData = [];
    
    for (const line of lines) {
      // Skip header lines and company info
      if (line.includes('MEDICINES') || line.includes('Stock Report') || 
          line.includes('Statement') || line.includes('TO') ||
          line.match(/^\d{2}-\w{3}-\d{4}/) || line === 'Item Name' ||
          line.includes('Opening') || line.includes('Purch') || line.includes('Sales') ||
          line.includes('TOTAL')) {
        continue;
      }
      
      // Look for lines that start with pharmaceutical product names followed by numbers
      const itemMatch = line.match(/^([A-Z][A-Z\s\-0-9]+(TAB|TABLET|TABLETS|CAP|CAPSULE|SYRUP|GEL|CREAM|OD|D3|PM|SL|CD3|MAX|LITE|OZ|MOISTURIZING|DAILY))\s+(.+)/i);
      
      if (itemMatch) {
        const itemName = itemMatch[1].trim();
        const numbersText = itemMatch[3];
        
        // Extract all numbers from the rest of the line
        const numbers = numbersText.match(/\d+\.?\d*/g);
        if (numbers) {
          const numericValues = numbers.map(n => parseFloat(n)).filter(n => !isNaN(n));
          
          if (numericValues.length >= 9) {
            itemData.push({
              name: itemName,
              numbers: numericValues
            });
            console.log(`📦 Found item: ${itemName} with ${numericValues.length} values`);
          }
        }
      }
    }
    
    console.log(`📊 Found ${itemData.length} pharmaceutical items with complete data`);
    
    // Process each item's data
    itemData.forEach(item => {
      const cleanItemName = item.name
        .replace(/\s+/g, '_')
        .replace(/[^A-Z0-9_]/g, '')
        .toUpperCase();
      
      // Map to expected fields: Opening, Purchase, Free, PurchRet, Sales, SalesValue, SalesReturn, Closing, ClosingValue
      result[`item_${cleanItemName}_op`] = item.numbers[0] || 0;
      result[`item_${cleanItemName}_pur`] = item.numbers[1] || 0;
      result[`item_${cleanItemName}_sp`] = item.numbers[2] || 0;
      result[`item_${cleanItemName}_cr`] = item.numbers[3] || 0;
      result[`item_${cleanItemName}_sale`] = item.numbers[4] || 0;
      result[`item_${cleanItemName}_sval`] = item.numbers[5] || 0;
      result[`item_${cleanItemName}_ss`] = item.numbers[6] || 0;
      result[`item_${cleanItemName}_c_stk`] = item.numbers[7] || 0;
      result[`item_${cleanItemName}_c_val`] = item.numbers[8] || 0;
      
      console.log(`📊 ${cleanItemName}: Opening=${item.numbers[0]}, Sales=${item.numbers[4]}, SalesValue=${item.numbers[5]}, Closing=${item.numbers[7]}`);
    });
    
    console.log(`✅ Processed ${itemData.length} items from OCR text`);
    
  } catch (error) {
    console.error('❌ Error parsing OCR data:', error);
  }
}

function extractNumbersAfterItem(lines, itemLineIndex) {
  const numbers = [];
  
  // Look in the next 10 lines for numeric data
  for (let i = itemLineIndex + 1; i < Math.min(itemLineIndex + 10, lines.length); i++) {
    const line = lines[i];
    
    // Stop if we hit another item name
    if (line.match(/^[A-Z][A-Z\s\-0-9]+(TAB|TABLET|TABLETS|CAP|CAPSULE|SYRUP|GEL|CREAM|OD|D3|PM|SL|CD3|MAX|LITE|OZ)/i)) {
      break;
    }
    
    // Extract all numbers from this line
    const lineNumbers = line.match(/\d+\.?\d*/g);
    if (lineNumbers) {
      lineNumbers.forEach(numStr => {
        const num = parseFloat(numStr);
        if (!isNaN(num)) {
          numbers.push(num);
        }
      });
    }
    
    // If we have enough numbers for all fields, we can stop
    if (numbers.length >= 9) {
      break;
    }
  }
  
  return numbers;
}

// Test with realistic OCR text that might come from a PDF
const sampleOCRText = `Stock Statement Report
SHIVOHAM MEDICINES
Stock Report
(01-Sep-2025 TO 16-Sep-2025)

Item Name                Opening  Purch.  Free  Purch.Ret  Sales  Sales Value  Sales Ret  Closing  Closing Value

ACKNOTIN 10 TABLETS      20       0       0     0          0      0.00         0          20       2196.60
ACKNOTIN 5 TABLETS       20       90      18    0          70     5695.20      14         40       3254.40
BECOCNX 60K TAB          50       80      16    0          90     6363.90      18         40       2828.40
BECOCNX D3 TAB           65       80      24    0          95     12214.15     25         50       6428.50
BECOCNX LITE TAB         0        20      4     0          0      0.00         0          20       1285.60

TOTAL                    2148     1825    365   0          1250   237626.59    250        2055     243102.04`;

const result = parseStockReportText(sampleOCRText);

console.log('\n✅ Test Results:');
console.log('Company:', result.company_name);
console.log('Date Range:', result.date_range);
console.log('Item fields found:', Object.keys(result).filter(k => k.startsWith('item_')).length);

// Check specific items
const itemKeys = Object.keys(result).filter(k => k.startsWith('item_'));
const uniqueItems = [...new Set(itemKeys.map(k => k.split('_').slice(1, -1).join('_')))];
console.log(`Found ${uniqueItems.length} unique items:`, uniqueItems.slice(0, 3));

// Show sample data for first item
if (uniqueItems.length > 0) {
  const firstItem = uniqueItems[0];
  console.log(`\nSample data for ${firstItem}:`);
  console.log(`  Opening: ${result[`item_${firstItem}_op`]}`);
  console.log(`  Sales: ${result[`item_${firstItem}_sale`]}`);
  console.log(`  Sales Value: ${result[`item_${firstItem}_sval`]}`);
  console.log(`  Closing: ${result[`item_${firstItem}_c_stk`]}`);
  console.log(`  Closing Value: ${result[`item_${firstItem}_c_val`]}`);
}

console.log('\n🎯 The updated TextParser should now parse actual OCR text!');
console.log('📝 Next steps:');
console.log('1. Deploy the updated TextParser');
console.log('2. Test with actual PDF extraction');
console.log('3. Verify that formattedData contains real parsed items');