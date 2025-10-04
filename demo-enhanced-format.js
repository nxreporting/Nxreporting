// Demo of enhanced data formatting using your actual extracted data

const sampleData = {
  "success": true,
  "content": "{\"company_name\": \"SHIVOHAM MEDICINES\", \"report_title\": \"Stock Report\", \"date_range\": \"01-Aug-2025 TO 30-Aug-2025\", \"item_1_name\": \"BILLURAGISE-M TAB\", \"item_1_opening_qty\": 0, \"item_1_purch_qty\": 30, \"item_1_purch_free\": 6, \"item_1_purc_ret_qty\": 0, \"item_1_sales_qty\": 5, \"item_1_sales_value\": 546.45, \"item_1_s_return_free\": 1, \"item_1_s_return_qty\": 0, \"item_1_closing_qty\": 25, \"item_1_closing_value\": 2732.25, \"item_2_name\": \"BYCINE OD\", \"item_2_opening_qty\": 0, \"item_2_purch_qty\": 100, \"item_2_purch_free\": 20, \"item_2_purc_ret_qty\": 0, \"item_2_sales_qty\": 10, \"item_2_sales_value\": 1864.20, \"item_2_s_return_free\": 2, \"item_2_s_return_qty\": 0, \"item_2_closing_qty\": 90, \"item_2_closing_value\": 16777.80, \"item_3_name\": \"CNZEP-0.25 MG TAB\", \"item_3_opening_qty\": 0, \"item_3_purch_qty\": 50, \"item_3_purch_free\": 10, \"item_3_purc_ret_qty\": 0, \"item_3_sales_qty\": 0, \"item_3_sales_value\": 0.00, \"item_3_s_return_free\": 0, \"item_3_s_return_qty\": 0, \"item_3_closing_qty\": 50, \"item_3_closing_value\": 750.00, \"total_opening_qty\": 0, \"total_purch_qty\": 440, \"total_purch_free\": 88, \"total_purc_ret_qty\": 0, \"total_sales_qty\": 15, \"total_sales_value\": 2410.65, \"total_s_return_free\": 3, \"total_s_return_qty\": 0, \"total_closing_qty\": 425, \"total_closing_value\": 49461.65}",
  "format": "flat-json"
};

// Enhanced formatting function
function formatStockReport(flatData) {
  const data = JSON.parse(flatData.content);
  
  // Extract company and report info
  const company = {
    name: data.company_name || 'Unknown Company'
  };

  const report = {
    title: data.report_title || 'Stock Report',
    dateRange: data.date_range || 'Unknown Period',
    generatedAt: new Date().toISOString()
  };

  // Extract items dynamically
  const items = [];
  let itemIndex = 1;

  while (data[`item_${itemIndex}_name`]) {
    const item = {
      name: data[`item_${itemIndex}_name`],
      opening: { qty: data[`item_${itemIndex}_opening_qty`] || 0 },
      purchase: {
        qty: data[`item_${itemIndex}_purch_qty`] || 0,
        free: data[`item_${itemIndex}_purch_free`] || 0
      },
      sales: {
        qty: data[`item_${itemIndex}_sales_qty`] || 0,
        value: data[`item_${itemIndex}_sales_value`] || 0
      },
      closing: {
        qty: data[`item_${itemIndex}_closing_qty`] || 0,
        value: data[`item_${itemIndex}_closing_value`] || 0
      }
    };
    
    items.push(item);
    itemIndex++;
  }

  // Calculate summary
  const summary = {
    totalItems: items.length,
    totalSalesValue: data.total_sales_value || 0,
    totalClosingValue: data.total_closing_value || 0
  };

  return { company, report, items, summary };
}

// Generate readable summary
function generateSummary(formattedData) {
  const { company, report, items, summary } = formattedData;
  
  const topSellers = items
    .filter(item => item.sales.qty > 0)
    .sort((a, b) => b.sales.value - a.sales.value)
    .slice(0, 3);
  
  return `
📊 **${company.name}** - ${report.title}
📅 Period: ${report.dateRange}
📦 Total Items: ${summary.totalItems}
💰 Total Sales Value: ₹${summary.totalSalesValue.toLocaleString()}
📈 Total Closing Value: ₹${summary.totalClosingValue.toLocaleString()}

🔝 Top Items by Sales:
${topSellers.map((item, index) => 
  `${index + 1}. ${item.name}: ${item.sales.qty} units (₹${item.sales.value})`
).join('\n')}
  `.trim();
}

console.log('🧪 ENHANCED DATA FORMATTING DEMO\n');
console.log('📄 Original flat data structure vs Enhanced readable format\n');

const formatted = formatStockReport(sampleData);
const summary = generateSummary(formatted);

console.log('✨ ENHANCED FORMATTED OUTPUT:');
console.log('=' .repeat(50));
console.log(summary);

console.log('\n📋 DETAILED ITEMS BREAKDOWN:');
console.log('=' .repeat(40));

formatted.items.forEach((item, index) => {
  if (item.sales.qty > 0) {  // Only show items with sales
    console.log(`\n${index + 1}. ${item.name}`);
    console.log(`   📦 Purchase: ${item.purchase.qty} + ${item.purchase.free} free`);
    console.log(`   💰 Sales: ${item.sales.qty} units → ₹${item.sales.value}`);
    console.log(`   📊 Closing: ${item.closing.qty} units (₹${item.closing.value})`);
  }
});

console.log('\n🎯 KEY IMPROVEMENTS:');
console.log('✅ Structured data instead of flat key-value pairs');
console.log('✅ Human-readable summary with insights');
console.log('✅ Organized by logical groups (company, items, totals)');
console.log('✅ Currency formatting and visual indicators');
console.log('✅ Top performers identification');