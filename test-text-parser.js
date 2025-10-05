// Test the text parser with the actual OCR result
// Since we can't directly require TS, let's create a simple parser test

const sampleText = `Stock Statement Report
Item Name
ACKNOTIN 10 TABLEST
ACKNOTIN 5 TABLETS
BECOCNX 6 OK TAB
BECOCNX D3 TAB
BECOCNX LITETAB
BECOCNX OD TAB
BECOCNX PM TAB
BENCNX OD
BETAGOLD 24MG TAB
BETAGOLD 8MG TAB
BILURACISE-M TAB
BYCINE CD3 TABLETS
BYCINE OD
CALGREEN MAXTAB
CETAPRIME
CLOSINE OZTABLETS
CNCAL TABLETS
CNPRAZ 40 MG TAB
CNPRAZ D
CNPROT
CNPX 100
CNX CAL TAB
CNX CLAV 625 TAB
CNX DOX CAP
CNX MOISTURIZING CREAM
CNZEP-0.25 MG TAB
CNZEP -0.5 MG TAB
DOFOTIL SYRUP 200ML
ELM PLUS 5
ELM PRO 20MG TAB
ESCNX 15MG TAB
StockReport
Opening
Qty.
20
20
50
65
30
40
20
40
25
65
90
20
0
30
25
40
40
40
25
50
30
0
0
50
30
13
40
30
50
Purch.
Qty.
40
50
30
20
50
0
0
0
50
0
0
40
0
0
80
50
10
0
20
0
SHIVOHAM MEDICINES
Stock Report
(01-Sep-2025 TO 16-Sep-2025)
Free
Purc.Ret
Qty.
0
0
8
10
9
4
0
10
0
0
0
10
0
0
8
0
24
10
2
0
4
0
0
0
0
Qty.
0
60
60
55
0
5
20
50
0
5
5
35
35
0
50
15
0
35
0
10
5
105
30
0
10
20
10
10
20
Sales
Value
0.00
4881.60
4242.60
7071.35
0.00
607.15
3857.40
9000.00
0.00
275.00
546.45
5338.90
6524.70
0.00
19830.50
0.00
2507.10
0.00
3600.10
0.00
1328.60
707.15
15299.55
2314.20
0.00
150.00
0.00
3928.60
771.40
578.60
1800 00
Free
0
12
12
14
1
4
10
0
S.Return
Qty.
0
0
10
1
30
6
Closing
Qty.
20
0
40
40
20
25
20
20
35
20
30
55
20
0
30
10
40
45
40
15
45
20
10
40
30
13
30
20
30
Value
2196.60
0.00
2828.40
5142.80
1285.60
3035.75
3857.40
0.00
2742.80
1925.00
2185.80
4576.20
10253.10
3050.80
0.00
3471.30
1671.40
2657.20
4628.70
2571.60
1992.90
6364.35
1311.39
1542.80
3966.10
600.00
814.50
2553.59
2314.20
1157.20
2700.00
1`;

console.log('Testing text parser...');
try {
  const result = TextParser.parseStockReportText(sampleText);
  console.log('Parsed result keys:', Object.keys(result).length);
  console.log('Company:', result.company_name);
  console.log('Date range:', result.date_range);
  
  // Show some item fields
  const itemFields = Object.keys(result).filter(key => key.startsWith('item_'));
  console.log('Item fields found:', itemFields.length);
  console.log('Sample item fields:', itemFields.slice(0, 10));
  
  // Show some specific values
  console.log('ACKNOTIN_10_TABLEST sales:', result.item_ACKNOTIN_10_TABLEST_sale);
  console.log('BECOCNX_D3_TAB sales:', result.item_BECOCNX_D3_TAB_sale);
  
} catch (error) {
  console.error('Parser test failed:', error);
}`;