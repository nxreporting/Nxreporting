// Test enhanced brand analysis with your actual data and brand database

const actualData = {
  "company_name": "SHIVOHAM MEDICINES",
  "report_title": "Stock Report", 
  "report_date_range": "01-Aug-2025 TO 30-Aug-2025",
  "item_name_1": "BECOCNX60K TAB",
  "opening_qty_1": 0,
  "purch_qty_1": 50,
  "purch_free_1": 10,
  "sales_qty_1": 0,
  "sales_value_1": 0.00,
  "closing_qty_1": 50,
  "closing_value_1": 3535.50,
  "item_name_2": "CNCAL TABLETS",
  "opening_qty_2": 0,
  "purch_qty_2": 40,
  "purch_free_2": 8,
  "sales_qty_2": 15,
  "sales_value_2": 2507.10,
  "closing_qty_2": 25,
  "closing_value_2": 4178.50,
  "item_name_3": "CNPRAZD",
  "opening_qty_3": 0,
  "purch_qty_3": 50,
  "purch_free_3": 10,
  "sales_qty_3": 10,
  "sales_value_3": 1028.60,
  "closing_qty_3": 40,
  "closing_value_3": 4114.40,
  "item_name_4": "HB GOLD SP TAB",
  "opening_qty_4": 0,
  "purch_qty_4": 50,
  "purch_free_4": 10,
  "sales_qty_4": 5,
  "sales_value_4": 428.55,
  "closing_qty_4": 45,
  "closing_value_4": 3856.95,
  "item_name_5": "PRIXICAM TAB",
  "opening_qty_5": 0,
  "purch_qty_5": 30,
  "purch_free_5": 6,
  "sales_qty_5": 5,
  "sales_value_5": 2057.10,
  "closing_qty_5": 25,
  "closing_value_5": 10285.50,
  "total_sales_value": 6021.35,
  "total_closing_value": 25970.85
};

// Brand database mapping
const brandDatabase = {
  'BECOCNX60K': { brand: 'BECOCNX', division: 'CNX Ortho' },
  'BECOCNX': { brand: 'BECOCNX', division: 'CNX Ortho' },
  'CNCAL': { brand: 'CNCAL', division: 'CNX Ortho' },
  'CNPRAZD': { brand: 'CNPRAZ', division: 'CNX Ortho' },
  'CNPRAZ': { brand: 'CNPRAZ', division: 'CNX Ortho' },
  'HB': { brand: 'HBGOLD', division: 'CNX Ortho' },
  'HBGOLD': { brand: 'HBGOLD', division: 'CNX Ortho' },
  'PRIXICAM': { brand: 'PRIXICAM', division: 'CNX Ortho' }
};

function findBrandInfo(productName) {
  const cleanName = productName.toUpperCase().trim();
  
  // Try exact matches first
  for (const [key, info] of Object.entries(brandDatabase)) {
    if (cleanName.includes(key)) {
      return info;
    }
  }
  
  // Fallback to first word
  const firstWord = cleanName.split(/[\s-]+/)[0];
  return brandDatabase[firstWord] || { brand: firstWord, division: 'Unknown' };
}

function analyzeWithBrandDatabase() {
  console.log('🏷️  ENHANCED BRAND ANALYSIS WITH DATABASE\n');
  console.log('=' .repeat(60));
  
  const items = [];
  let itemIndex = 1;
  
  // Extract items
  while (actualData[`item_name_${itemIndex}`]) {
    const productName = actualData[`item_name_${itemIndex}`];
    const brandInfo = findBrandInfo(productName);
    
    items.push({
      name: productName,
      brand: brandInfo.brand,
      division: brandInfo.division,
      purchase: {
        qty: actualData[`purch_qty_${itemIndex}`] || 0,
        free: actualData[`purch_free_${itemIndex}`] || 0
      },
      sales: {
        qty: actualData[`sales_qty_${itemIndex}`] || 0,
        value: actualData[`sales_value_${itemIndex}`] || 0
      },
      closing: {
        qty: actualData[`closing_qty_${itemIndex}`] || 0,
        value: actualData[`closing_value_${itemIndex}`] || 0
      }
    });
    itemIndex++;
  }
  
  // Group by division
  const divisionGroups = {};
  items.forEach(item => {
    if (!divisionGroups[item.division]) {
      divisionGroups[item.division] = [];
    }
    divisionGroups[item.division].push(item);
  });
  
  // Group by brand within divisions
  const brandGroups = {};
  items.forEach(item => {
    if (!brandGroups[item.brand]) {
      brandGroups[item.brand] = [];
    }
    brandGroups[item.brand].push(item);
  });
  
  console.log(`🏢 ${actualData.company_name} - ${actualData.report_title}`);
  console.log(`📅 ${actualData.report_date_range}\n`);
  
  // Division Analysis
  console.log('🏢 DIVISION ANALYSIS:');
  console.log('=' .repeat(40));
  
  Object.entries(divisionGroups).forEach(([division, divItems]) => {
    const totalSales = divItems.reduce((sum, item) => sum + item.sales.value, 0);
    const totalStrips = divItems.reduce((sum, item) => sum + item.sales.qty, 0);
    const totalClosing = divItems.reduce((sum, item) => sum + item.closing.value, 0);
    
    console.log(`\n📊 ${division}:`);
    console.log(`   • Products: ${divItems.length}`);
    console.log(`   • Sales: ${totalStrips} strips → ₹${totalSales.toLocaleString()}`);
    console.log(`   • Closing Value: ₹${totalClosing.toLocaleString()}`);
    console.log(`   • Brands: ${[...new Set(divItems.map(item => item.brand))].join(', ')}`);
  });
  
  // Brand Analysis
  console.log('\n\n🏷️  BRAND PERFORMANCE ANALYSIS:');
  console.log('=' .repeat(50));
  
  const brandAnalysis = Object.entries(brandGroups).map(([brand, brandItems]) => {
    const totalSales = brandItems.reduce((sum, item) => sum + item.sales.value, 0);
    const totalStrips = brandItems.reduce((sum, item) => sum + item.sales.qty, 0);
    const totalFree = brandItems.reduce((sum, item) => sum + item.purchase.free, 0);
    const totalClosing = brandItems.reduce((sum, item) => sum + item.closing.value, 0);
    const division = brandItems[0].division;
    
    return {
      brand,
      division,
      items: brandItems,
      metrics: {
        totalSales,
        totalStrips,
        totalFree,
        totalClosing,
        avgPrice: totalStrips > 0 ? totalSales / totalStrips : 0
      }
    };
  }).sort((a, b) => b.metrics.totalSales - a.metrics.totalSales);
  
  brandAnalysis.forEach((brandData, index) => {
    console.log(`\n${index + 1}. 🏷️  ${brandData.brand} (${brandData.division})`);
    console.log(`   📦 Products: ${brandData.items.length}`);
    console.log(`   💊 Sales: ${brandData.metrics.totalStrips} strips`);
    console.log(`   🎁 Free: ${brandData.metrics.totalFree} strips`);
    console.log(`   💰 Revenue: ₹${brandData.metrics.totalSales.toLocaleString()}`);
    console.log(`   📊 Closing: ₹${brandData.metrics.totalClosing.toLocaleString()}`);
    
    if (brandData.metrics.totalStrips > 0) {
      console.log(`   💵 Avg Price: ₹${brandData.metrics.avgPrice.toFixed(2)}/strip`);
    }
    
    // Show products
    brandData.items.forEach(item => {
      console.log(`      • ${item.name}: ${item.sales.qty} strips → ₹${item.sales.value}`);
    });
  });
  
  // Summary
  console.log('\n\n📈 BUSINESS INSIGHTS:');
  console.log('=' .repeat(30));
  console.log(`✅ All products belong to CNX Ortho division`);
  console.log(`🏆 Top Brand: ${brandAnalysis[0].brand} (₹${brandAnalysis[0].metrics.totalSales})`);
  console.log(`💎 Premium Brand: PRIXICAM (₹${brandAnalysis.find(b => b.brand === 'PRIXICAM')?.metrics.avgPrice.toFixed(2)}/strip)`);
  console.log(`📊 Active Brands: ${brandAnalysis.filter(b => b.metrics.totalStrips > 0).length}/${brandAnalysis.length}`);
  console.log(`🎯 Division Focus: Orthopedic & Bone Health products`);
}

analyzeWithBrandDatabase();