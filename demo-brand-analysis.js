// Demo of enhanced brand-wise analysis using your actual data

const sampleData = {
  "success": true,
  "content": "{\"company_name\": \"SHIVOHAM MEDICINES\", \"report_title\": \"Stock Report\", \"date_range\": \"01-Aug-2025 TO 30-Aug-2025\", \"item_1_name\": \"BILLURAGISE-M TAB\", \"item_1_opening_qty\": 0, \"item_1_purch_qty\": 30, \"item_1_purch_free\": 6, \"item_1_purc_ret_qty\": 0, \"item_1_sales_qty\": 5, \"item_1_sales_value\": 546.45, \"item_1_s_return_free\": 1, \"item_1_s_return_qty\": 0, \"item_1_closing_qty\": 25, \"item_1_closing_value\": 2732.25, \"item_2_name\": \"BYCINE OD\", \"item_2_opening_qty\": 0, \"item_2_purch_qty\": 100, \"item_2_purch_free\": 20, \"item_2_purc_ret_qty\": 0, \"item_2_sales_qty\": 10, \"item_2_sales_value\": 1864.20, \"item_2_s_return_free\": 2, \"item_2_s_return_qty\": 0, \"item_2_closing_qty\": 90, \"item_2_closing_value\": 16777.80, \"item_3_name\": \"CNZEP-0.25 MG TAB\", \"item_3_opening_qty\": 0, \"item_3_purch_qty\": 50, \"item_3_purch_free\": 10, \"item_3_purc_ret_qty\": 0, \"item_3_sales_qty\": 0, \"item_3_sales_value\": 0.00, \"item_3_s_return_free\": 0, \"item_3_s_return_qty\": 0, \"item_3_closing_qty\": 50, \"item_3_closing_value\": 750.00, \"item_4_name\": \"CNZEP-0.5 MG TAB\", \"item_4_opening_qty\": 0, \"item_4_purch_qty\": 30, \"item_4_purch_free\": 6, \"item_4_purc_ret_qty\": 0, \"item_4_sales_qty\": 0, \"item_4_sales_value\": 0.00, \"item_4_s_return_free\": 0, \"item_4_s_return_qty\": 0, \"item_4_closing_qty\": 30, \"item_4_closing_value\": 814.50, \"item_5_name\": \"HBGOLD ULTRA TABLETS\", \"item_5_opening_qty\": 0, \"item_5_purch_qty\": 40, \"item_5_purch_free\": 8, \"item_5_purc_ret_qty\": 0, \"item_5_sales_qty\": 0, \"item_5_sales_value\": 0.00, \"item_5_s_return_free\": 0, \"item_5_s_return_qty\": 0, \"item_5_closing_qty\": 40, \"item_5_closing_value\": 3257.20, \"item_6_name\": \"MEGRACYN TAB\", \"item_6_opening_qty\": 0, \"item_6_purch_qty\": 30, \"item_6_purch_free\": 6, \"item_6_purc_ret_qty\": 0, \"item_6_sales_qty\": 0, \"item_6_sales_value\": 0.00, \"item_6_s_return_free\": 0, \"item_6_s_return_qty\": 0, \"item_6_closing_qty\": 30, \"item_6_closing_value\": 6101.70, \"item_7_name\": \"PRERABEL CAP\", \"item_7_opening_qty\": 0, \"item_7_purch_qty\": 30, \"item_7_purch_free\": 6, \"item_7_purc_ret_qty\": 0, \"item_7_sales_qty\": 0, \"item_7_sales_value\": 0.00, \"item_7_s_return_free\": 0, \"item_7_s_return_qty\": 0, \"item_7_closing_qty\": 30, \"item_7_closing_value\": 4692.90, \"item_8_name\": \"PREXIMECV TAB\", \"item_8_opening_qty\": 0, \"item_8_purch_qty\": 30, \"item_8_purch_free\": 6, \"item_8_purc_ret_qty\": 0, \"item_8_sales_qty\": 0, \"item_8_sales_value\": 0.00, \"item_8_s_return_free\": 0, \"item_8_s_return_qty\": 0, \"item_8_closing_qty\": 30, \"item_8_closing_value\": 6621.30, \"item_9_name\": \"PREXIMEDT 200 TAB\", \"item_9_opening_qty\": 0, \"item_9_purch_qty\": 100, \"item_9_purch_free\": 20, \"item_9_purc_ret_qty\": 0, \"item_9_sales_qty\": 0, \"item_9_sales_value\": 0.00, \"item_9_s_return_free\": 0, \"item_9_s_return_qty\": 0, \"item_9_closing_qty\": 100, \"item_9_closing_value\": 7714.00, \"total_opening_qty\": 0, \"total_purch_qty\": 440, \"total_purch_free\": 88, \"total_purc_ret_qty\": 0, \"total_sales_qty\": 15, \"total_sales_value\": 2410.65, \"total_s_return_free\": 3, \"total_s_return_qty\": 0, \"total_closing_qty\": 425, \"total_closing_value\": 49461.65}",
  "format": "flat-json"
};

// Enhanced brand analysis functions
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

function formatStockReport(flatData) {
  const data = JSON.parse(flatData.content);
  
  const company = { name: data.company_name || 'Unknown Company' };
  const report = {
    title: data.report_title || 'Stock Report',
    dateRange: data.date_range || 'Unknown Period'
  };

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

  return { company, report, items };
}

function generateBrandWiseAnalysis(formattedData) {
  const { items } = formattedData;
  
  // Group items by brand
  const brandGroups = {};
  
  items.forEach(item => {
    const brandName = extractBrandName(item.name);
    if (!brandGroups[brandName]) {
      brandGroups[brandName] = [];
    }
    brandGroups[brandName].push(item);
  });

  // Calculate brand-wise metrics
  const brandAnalysis = Object.entries(brandGroups).map(([brand, brandItems]) => {
    const totalSaleStrips = brandItems.reduce((sum, item) => sum + item.sales.qty, 0);
    const totalFreeStrips = brandItems.reduce((sum, item) => sum + item.purchase.free, 0);
    const totalSalesAmount = brandItems.reduce((sum, item) => sum + item.sales.value, 0);
    const totalClosingValue = brandItems.reduce((sum, item) => sum + item.closing.value, 0);
    const totalPurchaseQty = brandItems.reduce((sum, item) => sum + item.purchase.qty, 0);

    return {
      brand,
      itemCount: brandItems.length,
      items: brandItems,
      metrics: {
        totalSaleStrips,
        totalFreeStrips,
        totalSalesAmount,
        totalClosingValue,
        totalPurchaseQty,
        averageSalePrice: totalSaleStrips > 0 ? totalSalesAmount / totalSaleStrips : 0
      }
    };
  }).sort((a, b) => b.metrics.totalSalesAmount - a.metrics.totalSalesAmount);

  return brandAnalysis;
}

console.log('🏷️  BRAND-WISE ANALYSIS DEMO\n');
console.log('=' .repeat(60));

const formatted = formatStockReport(sampleData);
const brandAnalysis = generateBrandWiseAnalysis(formatted);

console.log(`🏢 ${formatted.company.name} - ${formatted.report.title}`);
console.log(`📅 ${formatted.report.dateRange}\n`);

console.log('🏆 BRAND PERFORMANCE SUMMARY:');
console.log('=' .repeat(50));

brandAnalysis.forEach((brand, index) => {
  console.log(`\n${index + 1}. 🏷️  BRAND: ${brand.brand}`);
  console.log(`   📦 Products: ${brand.itemCount} items`);
  console.log(`   💊 Sale Strips: ${brand.metrics.totalSaleStrips} strips`);
  console.log(`   🎁 Free Strips: ${brand.metrics.totalFreeStrips} strips`);
  console.log(`   💰 Sales Amount: ₹${brand.metrics.totalSalesAmount.toLocaleString()}`);
  console.log(`   📊 Closing Value: ₹${brand.metrics.totalClosingValue.toLocaleString()}`);
  console.log(`   💵 Avg Price/Strip: ₹${brand.metrics.averageSalePrice.toFixed(2)}`);
});

console.log('\n\n📋 DETAILED BRAND BREAKDOWN:');
console.log('=' .repeat(60));

brandAnalysis.forEach((brand, index) => {
  console.log(`\n🏷️  **BRAND ${index + 1}: ${brand.brand}**`);
  console.log('─'.repeat(40));
  
  brand.items.forEach((item, itemIndex) => {
    console.log(`\n   ${itemIndex + 1}. ${item.name}`);
    console.log(`      📦 Purchase: ${item.purchase.qty} + ${item.purchase.free} free strips`);
    console.log(`      💰 Sales: ${item.sales.qty} strips → ₹${item.sales.value}`);
    console.log(`      📊 Closing: ${item.closing.qty} strips (₹${item.closing.value})`);
    
    if (item.sales.qty > 0) {
      const pricePerStrip = item.sales.value / item.sales.qty;
      console.log(`      💵 Price per strip: ₹${pricePerStrip.toFixed(2)}`);
    }
  });
});

console.log('\n\n🎯 KEY INSIGHTS:');
console.log('=' .repeat(30));
const totalBrands = brandAnalysis.length;
const activeBrands = brandAnalysis.filter(b => b.metrics.totalSaleStrips > 0).length;
const topBrand = brandAnalysis[0];

console.log(`✅ Total Brands: ${totalBrands}`);
console.log(`🔥 Active Brands (with sales): ${activeBrands}`);
console.log(`🏆 Top Brand: ${topBrand.brand} (₹${topBrand.metrics.totalSalesAmount})`);
console.log(`📊 Brand Diversity: ${((activeBrands/totalBrands)*100).toFixed(1)}% brands generating sales`);