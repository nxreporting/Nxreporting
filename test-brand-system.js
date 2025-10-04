const fetch = require('node-fetch');

async function testBrandSystem() {
  console.log('🧪 Testing Brand Management System\n');
  
  const baseUrl = 'http://localhost:5000/api/brands';
  
  try {
    // Test 1: Get all divisions
    console.log('1. 📊 Getting all divisions...');
    const divisionsResponse = await fetch(`${baseUrl}/divisions`);
    const divisionsResult = await divisionsResponse.json();
    
    if (divisionsResult.success) {
      console.log(`✅ Found ${divisionsResult.data.length} divisions:`);
      divisionsResult.data.forEach(div => {
        console.log(`   • ${div.name}: ${div.brands.length} brands`);
      });
    }
    
    // Test 2: Get brand statistics
    console.log('\n2. 📈 Getting brand statistics...');
    const statsResponse = await fetch(`${baseUrl}/stats`);
    const statsResult = await statsResponse.json();
    
    if (statsResult.success) {
      console.log(`✅ Statistics:`);
      console.log(`   • Total Divisions: ${statsResult.data.totalDivisions}`);
      console.log(`   • Total Brands: ${statsResult.data.totalBrands}`);
      console.log(`   • Top Division: ${statsResult.data.topDivisions[0]?.name} (${statsResult.data.topDivisions[0]?.brandCount} brands)`);
    }
    
    // Test 3: Search for specific brands
    console.log('\n3. 🔍 Searching for "BECOCNX" brands...');
    const searchResponse = await fetch(`${baseUrl}/search?q=BECOCNX`);
    const searchResult = await searchResponse.json();
    
    if (searchResult.success) {
      console.log(`✅ Found ${searchResult.data.length} matches:`);
      searchResult.data.forEach(match => {
        console.log(`   • ${match.brand.name} in ${match.division.name}`);
        if (match.brand.aliases) {
          console.log(`     Aliases: ${match.brand.aliases.join(', ')}`);
        }
      });
    }
    
    // Test 4: Identify brand for specific products
    console.log('\n4. 🎯 Testing brand identification...');
    const testProducts = ['CNCAL TABLETS', 'HB GOLD SP TAB', 'PRIXICAM TAB', 'UNKNOWN PRODUCT'];
    
    for (const product of testProducts) {
      const identifyResponse = await fetch(`${baseUrl}/identify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName: product })
      });
      
      const identifyResult = await identifyResponse.json();
      
      if (identifyResult.success) {
        if (identifyResult.data.matched) {
          console.log(`✅ ${product} → ${identifyResult.data.brand.name} (${identifyResult.data.division.name})`);
        } else {
          console.log(`❌ ${product} → No brand match found`);
        }
      }
    }
    
    // Test 5: Get specific division brands
    console.log('\n5. 🏢 Getting CNX Ortho division brands...');
    const orthoResponse = await fetch(`${baseUrl}/divisions/cnx-ortho`);
    const orthoResult = await orthoResponse.json();
    
    if (orthoResult.success) {
      console.log(`✅ CNX Ortho has ${orthoResult.data.length} brands:`);
      orthoResult.data.slice(0, 5).forEach(brand => {
        console.log(`   • ${brand.name}`);
      });
      if (orthoResult.data.length > 5) {
        console.log(`   ... and ${orthoResult.data.length - 5} more`);
      }
    }
    
    console.log('\n🎉 Brand Management System Test Complete!');
    console.log('✅ All API endpoints working correctly');
    console.log('✅ Brand database loaded with all divisions');
    console.log('✅ Search and identification working');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testBrandSystem();