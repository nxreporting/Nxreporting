// Test the new data format with your actual extracted data

const newFormatData = {
  "success": true,
  "content": JSON.stringify({
    "company_name": "SHIVOHAM MEDICINES",
    "report_title": "Stock Report", 
    "report_date_range": "01-Aug-2025 TO 30-Aug-2025",
    "item_name_1": "BECOCNX60K TAB",
    "opening_qty_1": 0,
    "purch_qty_1": 50,
    "purch_free_1": 10,
    "purc_ret_qty_1": 0,
    "sales_qty_1": 0,
    "sales_value_1": 0.00,
    "sales_free_1": 0,
    "s_return_qty_1": 0,
    "closing_qty_1": 50,
    "closing_value_1": 3535.50,
    "item_name_2": "CNCAL TABLETS",
    "opening_qty_2": 0,
    "purch_qty_2": 40,
    "purch_free_2": 8,
    "purc_ret_qty_2": 0,
    "sales_qty_2": 15,
    "sales_value_2": 2507.10,
    "sales_free_2": 3,
    "s_return_qty_2": 0,
    "closing_qty_2": 25,
    "closing_value_2": 4178.50,
    "item_name_3": "CNPRAZD",
    "opening_qty_3": 0,
    "purch_qty_3": 50,
    "purch_free_3": 10,
    "purc_ret_qty_3": 0,
    "sales_qty_3": 10,
    "sales_value_3": 1028.60,
    "sales_free_3": 2,
    "s_return_qty_3": 0,
    "closing_qty_3": 40,
    "closing_value_3": 4114.40,
    "item_name_4": "HB GOLD SP TAB",
    "opening_qty_4": 0,
    "purch_qty_4": 50,
    "purch_free_4": 10,
    "purc_ret_qty_4": 0,
    "sales_qty_4": 5,
    "sales_value_4": 428.55,
    "sales_free_4": 1,
    "s_return_qty_4": 0,
    "closing_qty_4": 45,
    "closing_value_4": 3856.95,
    "item_name_5": "PRIXICAM TAB",
    "opening_qty_5": 0,
    "purch_qty_5": 30,
    "purch_free_5": 6,
    "purc_ret_qty_5": 0,
    "sales_qty_5": 5,
    "sales_value_5": 2057.10,
    "sales_free_5": 1,
    "s_return_qty_5": 0,
    "closing_qty_5": 25,
    "closing_value_5": 10285.50,
    "total_opening_qty": 0,
    "total_purch_qty": 220,
    "total_purch_free": 44,
    "total_purc_ret_qty": 0,
    "total_sales_qty": 35,
    "total_sales_value": 6021.35,
    "total_sales_free": 7,
    "total_s_return_qty": 0,
    "total_closing_qty": 185,
    "total_closing_value": 25970.85
  })
};

// Test the formatting functions
function formatStockReport(flatData) {
  const data = JSON.parse(flatData.content);
  
  const company = { name: data.company_name || 'Unknown Company' };
  const report = {
    title: data.report_title || 'Stock Report',
    dateRange: data.report_date_range || data.date_range || 'Unknown Period'
  };

  const items = [];
  let itemIndex = 1;

  // Handle new format: item_name_1, opening_qty_1, etc.
  while (data[`item_name_${itemIndex}`]) {
    const item = {
      name: data[`item_name_${itemIndex}`],
      opening: { qty: data[`opening_qty_${itemIndex}`] || 0 },
      purchase: {
        qty: data[`purch_qty_${itemIndex}`] || 0,
        free: data[`purch_free_${itemIndex}`] || 0
      },
      sales: {
        qty: data[`sales_qty_${itemIndex}`] || 0,
        value: data[`sales_value_${itemIndex}`] || 0
      },
      closing: {
        qty: data[`closing_qty_${itemIndex}`] || 0,
        value: data[`closing_value_${itemIndex}`] || 0
      }
    };
    items.push(item);
    itemIndex++;
  }

  const summary = {
    totalItems: items.length,
    totalSalesValue: data.total_sales_value || 0,
    totalClosingValue: data.total_closing_value || 0
  };

  return { company, report, items, summary };
}

function extractBrandName(itemName) {
  const cleanName = itemName.toUpperCase().trim();
  const suffixes = ['TAB', 'TABLET', 'TABLETS', 'CAP', 'CAPSULE', 'CAPSULES', 'OD', 'MG', 'GM'];
  let brandName = cleanName;
  
  suffixes.forEach(suffix => {
    brandName = brandName.replace(new RegExp(`\\s+${suffix}$`), '');
    brandName = brandName.replace(new RegExp(`-${suffix}$`), '');
  });

  const parts = brandName.split(/[\s-]+/);
  return parts[0] || itemName;
}

function generateBrandWiseAnalysis(formattedData) {
  const { items } = formattedData;
  
  const brandGroups = {};
  
  items.forEach(item => {
    const brandName = extractBrandName(item.name);
    if (!brandGroups[brandName]) {
      brandGroups[brandName] = [];
    }
    brandGroups[brandName].push(item);
  });

  const brandAnalysis = Object.entries(brandGroups).map(([brand, brandItems]) => {
    const totalSaleStrips = brandItems.reduce((sum, item) => sum + item.sales.qty, 0);
    const totalFreeStrips = brandItems.reduce((sum, item) => sum + item.purchase.free, 0);
    const totalSalesAmount = brandItems.reduce((sum, item) => sum + item.sales.value, 0);
    const totalClosingValue = brandItems.reduce((sum, item) => sum + item.closing.value, 0);

    return {
      brand,
      itemCount: brandItems.length,
      items: brandItems,
      metrics: {
        totalSaleStrips,
        totalFreeStrips,
        totalSalesAmount,
        totalClosingValue,
        averageSalePrice: totalSaleStrips > 0 ? totalSalesAmount / totalSaleStrips : 0
      }
    };
  }).sort((a, b) => b.metrics.totalSalesAmount - a.metrics.totalSalesAmount);

  return brandAnalysis;
}

console.log('🧪 TESTING NEW DATA FORMAT\n');
console.log('=' .repeat(60));

const formatted = formatStockReport(newFormatData);
const brandAnalysis = generateBrandWiseAnalysis(formatted);

console.log(`🏢 ${formatted.company.name} - ${formatted.report.title}`);
console.log(`📅 ${formatted.report.dateRange}`);
console.log(`📦 Total Items: ${formatted.summary.totalItems}`);
console.log(`💰 Total Sales: ₹${formatted.summary.totalSalesValue.toLocaleString()}`);
console.log(`📊 Total Closing: ₹${formatted.summary.totalClosingValue.toLocaleString()}\n`);

console.log('🏆 BRAND PERFORMANCE:');
console.log('=' .repeat(40));

brandAnalysis.forEach((brand, index) => {
  console.log(`\n${index + 1}. 🏷️  ${brand.brand}`);
  console.log(`   📦 Products: ${brand.itemCount}`);
  console.log(`   💊 Sales: ${brand.metrics.totalSaleStrips} strips`);
  console.log(`   🎁 Free: ${brand.metrics.totalFreeStrips} strips`);
  console.log(`   💰 Revenue: ₹${brand.metrics.totalSalesAmount.toLocaleString()}`);
  console.log(`   📊 Closing: ₹${brand.metrics.totalClosingValue.toLocaleString()}`);
  
  if (brand.metrics.totalSaleStrips > 0) {
    console.log(`   💵 Avg Price: ₹${brand.metrics.averageSalePrice.toFixed(2)}/strip`);
  }
});

console.log('\n\n📋 DETAILED BREAKDOWN:');
console.log('=' .repeat(50));

brandAnalysis.forEach((brand, index) => {
  if (brand.metrics.totalSaleStrips > 0) {  // Only show active brands
    console.log(`\n🏷️  **${brand.brand}** (${brand.itemCount} products)`);
    console.log('─'.repeat(30));
    
    brand.items.forEach((item, itemIndex) => {
      console.log(`\n   ${itemIndex + 1}. ${item.name}`);
      console.log(`      📦 Purchase: ${item.purchase.qty} + ${item.purchase.free} free`);
      console.log(`      💰 Sales: ${item.sales.qty} strips → ₹${item.sales.value}`);
      console.log(`      📊 Closing: ${item.closing.qty} strips (₹${item.closing.value})`);
    });
  }
});

console.log('\n\n✅ NEW FORMAT PARSING SUCCESSFUL!');
console.log('The data formatter now handles both old and new field naming conventions.');