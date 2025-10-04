/**
 * Enhanced data formatter for pharmaceutical stock reports
 * Converts flat JSON extraction into structured, readable format
 */

export interface StockItem {
  name: string;
  opening: {
    qty: number;
  };
  purchase: {
    qty: number;
    free: number;
  };
  purchaseReturn: {
    qty: number;
  };
  sales: {
    qty: number;
    value: number;
  };
  salesReturn: {
    qty: number;
    free: number;
  };
  closing: {
    qty: number;
    value: number;
  };
}

export interface FormattedStockReport {
  company: {
    name: string;
  };
  report: {
    title: string;
    dateRange: string;
    generatedAt: string;
  };
  items: StockItem[];
  summary: {
    totalItems: number;
    totalOpeningQty: number;
    totalPurchaseQty: number;
    totalSalesQty: number;
    totalClosingQty: number;
    totalSalesValue: number;
    totalClosingValue: number;
  };
}

export class DataFormatter {
  /**
   * Format flat JSON extraction into structured stock report
   */
  static formatStockReport(flatData: any): FormattedStockReport {
    try {
      console.log('🔄 Starting data formatting...');
      
      // Parse the content if it's a string with better error handling
      let data;
      if (typeof flatData.content === 'string') {
        try {
          data = JSON.parse(flatData.content);
        } catch (jsonError) {
          console.warn('⚠️ JSON parsing failed, attempting to clean and retry...');
          // Try to clean the JSON string
          let cleanedContent = flatData.content
            .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
            .replace(/,\s*}/g, '}') // Remove trailing commas
            .replace(/,\s*]/g, ']') // Remove trailing commas in arrays
            .trim();
          
          // Try parsing again
          try {
            data = JSON.parse(cleanedContent);
            console.log('✅ JSON cleaned and parsed successfully');
          } catch (secondError) {
            console.error('❌ Even cleaned JSON failed to parse:', secondError);
            // Use the raw data directly if available
            data = flatData;
          }
        }
      } else {
        data = flatData.content || flatData;
      }

      console.log('📊 Data keys:', Object.keys(data).slice(0, 20));
      console.log('📊 Total data keys:', Object.keys(data).length);
      console.log('📊 Sample data values:', JSON.stringify(data).substring(0, 500) + '...');
      
      // Check for specific fields we expect
      console.log('🔍 Checking for expected fields:');
      console.log('  item_BECOCNX_LITE_sale:', data.item_BECOCNX_LITE_sale);
      console.log('  item_BECOCNX_LITE_sval:', data.item_BECOCNX_LITE_sval);
      console.log('  item_BYCINE_OD_sale:', data.item_BYCINE_OD_sale);
      console.log('  item_BYCINE_OD_sval:', data.item_BYCINE_OD_sval);
      
      // Log all keys that might contain company info
      const companyKeys = Object.keys(data).filter(key => 
        key.toLowerCase().includes('company') || 
        key.toLowerCase().includes('name') ||
        key.toLowerCase().includes('firm')
      );
      console.log('🏢 Potential company keys:', companyKeys);
      
      // Log all keys that might contain item info
      const itemKeys = Object.keys(data).filter(key => 
        key.toLowerCase().includes('item') ||
        key.toLowerCase().includes('product') ||
        key.toLowerCase().includes('medicine')
      );
      console.log('📦 Potential item keys:', itemKeys.slice(0, 10));

      // Extract company and report info with more flexible field matching
      const companyName = data.company_name || data.Company_Name || data.company || 
                         data.Company || data.COMPANY_NAME || data.store_name || 'Unknown Company';
      
      console.log('🏢 Found company name:', companyName);
      
      const company = {
        name: companyName
      };

      const reportTitle = data.report_title || data.Report_Type || data.report_type || 
                         data.title || data.Title || 'Stock Report';
      
      const dateRange = data.date_range || data.report_date_range || data.Report_Date || 
                       data.report_date || data.period || data.Period || 
                       (data.report_start_date && data.report_end_date ? 
                        `${data.report_start_date} to ${data.report_end_date}` : 'Unknown Period');

      console.log('📋 Found report title:', reportTitle);
      console.log('📅 Found date range:', dateRange);

      const report = {
        title: reportTitle,
        dateRange: dateRange,
        generatedAt: new Date().toISOString()
      };

      // Extract items dynamically - handle multiple naming conventions
      const items: StockItem[] = [];
      let itemIndex = 1;

      // Check which naming convention is used
      const hasOldFormat = data[`item_${itemIndex}_name`];
      const hasNewFormat = data[`item_name_${itemIndex}`];
      const hasDirectFormat = data[`item${itemIndex}_name`];
      
      // Also check for any field that looks like an item name
      const allKeys = Object.keys(data);
      const itemNameKeys = allKeys.filter(key => 
        key.toLowerCase().includes('item') && key.toLowerCase().includes('name')
      );
      
      // Check for other patterns that might indicate items
      const productKeys = allKeys.filter(key => 
        key.toLowerCase().includes('product') || 
        key.toLowerCase().includes('medicine') ||
        key.toLowerCase().includes('drug') ||
        key.toLowerCase().includes('tab') ||
        key.toLowerCase().includes('cap')
      );
      
      // Check for field patterns that might be items (like BECOCNX_TAB_Sales_Qty)
      const possibleItemFields = allKeys.filter(key => 
        (key.includes('_') && (
          key.toLowerCase().includes('sales') ||
          key.toLowerCase().includes('qty') ||
          key.toLowerCase().includes('value') ||
          key.toLowerCase().includes('opening') ||
          key.toLowerCase().includes('closing')
        ))
      );
      
      console.log(`🔍 Format detection - Old: ${!!hasOldFormat}, New: ${!!hasNewFormat}, Direct: ${!!hasDirectFormat}`);
      console.log(`🔍 Found item name keys:`, itemNameKeys.slice(0, 5));
      console.log(`🔍 Found product keys:`, productKeys.slice(0, 5));
      console.log(`🔍 Found possible item fields:`, possibleItemFields.slice(0, 10));

      // Extract product names from the specific pattern: item_PRODUCTNAME_FIELD
      const productNames = new Set<string>();
      
      // Look for fields that have actual data (not just pack info)
      const dataFields = allKeys.filter(field => 
        field.startsWith('item_') && 
        !field.endsWith('_pack') &&
        (field.endsWith('_sale') || field.endsWith('_sval') || field.endsWith('_op'))
      );
      
      console.log(`🔍 Found data fields:`, dataFields.slice(0, 10));
      
      dataFields.forEach(field => {
        // Extract product name from patterns like "item_BECOCNX_LITE_sale"
        const withoutItem = field.substring(5); // Remove "item_"
        
        // Handle specific field endings
        let productName = '';
        if (withoutItem.endsWith('_sale')) {
          productName = withoutItem.substring(0, withoutItem.length - 5);
        } else if (withoutItem.endsWith('_sval')) {
          productName = withoutItem.substring(0, withoutItem.length - 5);
        } else if (withoutItem.endsWith('_op')) {
          productName = withoutItem.substring(0, withoutItem.length - 3);
        }
        
        if (productName && productName.length > 2 && !productName.match(/^\d+$/)) {
          productNames.add(productName);
        }
      });
      
      console.log(`🔍 Detected product names from item_ pattern:`, Array.from(productNames).slice(0, 10));
      
      // If we found products this way, use them
      if (productNames.size > 0) {
        // Filter out products with no actual data before processing
        const validProductNames = Array.from(productNames).filter(productName => {
          const hasData = ['sale', 'sval', 'op', 'c_stk', 'c_val', 'pur', 'sp'].some(fieldType => {
            const fieldName = `item_${productName}_${fieldType}`;
            const value = data[fieldName];
            return value !== undefined && value !== null;
          });
          
          if (!hasData) {
            console.log(`  ❌ Skipping ${productName} - no actual data (all null values)`);
          }
          return hasData;
        });

        console.log(`🔍 Valid products after filtering: ${validProductNames.length}`);

        validProductNames.forEach(productName => {
          console.log(`🔍 Processing product: "${productName}"`);
          
          const cleanProductName = productName.replace(/_/g, ' ');
          
          // Helper function to find field value for this product using the actual pattern
          const findProductFieldValue = (fieldTypes: string[]): number => {
            for (const fieldType of fieldTypes) {
              const fieldName = `item_${productName}_${fieldType}`;
              const value = data[fieldName];
              console.log(`  🔍 Checking field: ${fieldName} = ${value} (type: ${typeof value})`);
              if (value !== undefined && value !== null) {
                const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
                console.log(`    → Converted to: ${numValue}`);
                return numValue;
              }
            }
            return 0;
          };

          const item: StockItem = {
            name: cleanProductName,
            opening: {
              qty: findProductFieldValue(['op']) // item_PRODUCTNAME_op
            },
            purchase: {
              qty: findProductFieldValue(['pur']), // item_PRODUCTNAME_pur
              free: findProductFieldValue(['sp']) // item_PRODUCTNAME_sp (sample/free)
            },
            purchaseReturn: {
              qty: findProductFieldValue(['cr']) // item_PRODUCTNAME_cr (credit/return)
            },
            sales: {
              qty: findProductFieldValue(['sale']), // item_PRODUCTNAME_sale
              value: findProductFieldValue(['sval']) // item_PRODUCTNAME_sval (sales value)
            },
            salesReturn: {
              qty: findProductFieldValue(['ss']), // item_PRODUCTNAME_ss (sales sample/return)
              free: findProductFieldValue(['db']) // item_PRODUCTNAME_db (debit)
            },
            closing: {
              qty: findProductFieldValue(['c_stk']), // item_PRODUCTNAME_c_stk (closing stock)
              value: findProductFieldValue(['c_val']) // item_PRODUCTNAME_c_val (closing value)
            }
          };
          
          items.push(item);
          console.log(`📦 Added item: ${cleanProductName} with sales qty: ${item.sales.qty}`);
        });
      } else {
        // Fallback to original numbered item detection
        let currentItemExists = true;
        while (currentItemExists) {
          let itemName = null;
          
          // Try different naming patterns
          if (data[`item_${itemIndex}_name`]) {
            itemName = data[`item_${itemIndex}_name`];
          } else if (data[`item_name_${itemIndex}`]) {
            itemName = data[`item_name_${itemIndex}`];
          } else if (data[`item${itemIndex}_name`]) {
            itemName = data[`item${itemIndex}_name`];
          } else {
            // Try to find any field that might be this item's name
            const possibleNameKey = allKeys.find(key => 
              key.toLowerCase().includes(`item`) && 
              key.toLowerCase().includes(`${itemIndex}`) && 
              key.toLowerCase().includes('name')
            );
            if (possibleNameKey) {
              itemName = data[possibleNameKey];
            }
          }
          
          if (!itemName) {
            currentItemExists = false;
            break;
          }
        // Helper function to find field value with multiple patterns
        const findFieldValue = (patterns: string[]): number => {
          for (const pattern of patterns) {
            const value = data[pattern];
            if (value !== undefined && value !== null) {
              return typeof value === 'number' ? value : parseFloat(value) || 0;
            }
          }
          return 0;
        };

        // Create item with flexible field matching
        const item: StockItem = {
          name: itemName,
          opening: {
            qty: findFieldValue([
              `item_${itemIndex}_opening_qty`,
              `opening_qty_${itemIndex}`,
              `item${itemIndex}_opening_qty`,
              `item_${itemIndex}_open_qty`
            ])
          },
          purchase: {
            qty: findFieldValue([
              `item_${itemIndex}_purch_qty`,
              `purch_qty_${itemIndex}`,
              `item${itemIndex}_purch_qty`,
              `item_${itemIndex}_purchase_qty`
            ]),
            free: findFieldValue([
              `item_${itemIndex}_purch_free`,
              `purch_free_${itemIndex}`,
              `item${itemIndex}_purch_free`,
              `item_${itemIndex}_purchase_free`
            ])
          },
          purchaseReturn: {
            qty: findFieldValue([
              `item_${itemIndex}_purc_ret_qty`,
              `purc_ret_qty_${itemIndex}`,
              `item${itemIndex}_purc_ret_qty`,
              `item_${itemIndex}_purchase_return_qty`
            ])
          },
          sales: {
            qty: findFieldValue([
              `item_${itemIndex}_sales_qty`,
              `sales_qty_${itemIndex}`,
              `item${itemIndex}_sales_qty`,
              `item_${itemIndex}_sale_qty`
            ]),
            value: findFieldValue([
              `item_${itemIndex}_sales_value`,
              `sales_value_${itemIndex}`,
              `item${itemIndex}_sales_value`,
              `item_${itemIndex}_sale_value`
            ])
          },
          salesReturn: {
            qty: findFieldValue([
              `item_${itemIndex}_s_return_qty`,
              `s_return_qty_${itemIndex}`,
              `item${itemIndex}_s_return_qty`,
              `item_${itemIndex}_sales_return_qty`
            ]),
            free: findFieldValue([
              `item_${itemIndex}_s_return_free`,
              `sales_free_${itemIndex}`,
              `item${itemIndex}_s_return_free`,
              `item_${itemIndex}_sales_return_free`
            ])
          },
          closing: {
            qty: findFieldValue([
              `item_${itemIndex}_closing_qty`,
              `closing_qty_${itemIndex}`,
              `item${itemIndex}_closing_qty`,
              `item_${itemIndex}_close_qty`
            ]),
            value: findFieldValue([
              `item_${itemIndex}_closing_value`,
              `closing_value_${itemIndex}`,
              `item${itemIndex}_closing_value`,
              `item_${itemIndex}_close_value`
            ])
          }
        };
        
          items.push(item);
          itemIndex++;
        }
      }

      console.log(`✅ Extracted ${items.length} items`);

      // Calculate summary using the actual summary fields
      const summary = {
        totalItems: items.length,
        totalOpeningQty: data.summary_opening_value || 0,
        totalPurchaseQty: data.summary_purchase_value || 0,
        totalSalesQty: items.reduce((sum, item) => sum + item.sales.qty, 0),
        totalClosingQty: items.reduce((sum, item) => sum + item.closing.qty, 0),
        totalSalesValue: data.summary_sales || 0,
        totalClosingValue: data.summary_closing_value || 0
      };

      const result = {
        company,
        report,
        items,
        summary
      };

      console.log('✅ Data formatting completed successfully');
      return result;

    } catch (error) {
      console.error('❌ Data formatting error:', error);
      throw new Error(`Failed to format stock report data: ${error}`);
    }
  }

  /**
   * Generate brand-wise analysis with detailed breakdown
   */
  static generateBrandWiseAnalysis(formattedData: FormattedStockReport): any {
    try {
      console.log('🔄 Starting brand analysis...');
      
      const { items } = formattedData;
      
      // Group items by brand (extract brand from item name)
      const brandGroups: { [key: string]: StockItem[] } = {};
      
      items.forEach(item => {
        // Extract brand name (first word or meaningful part)
        const brandName = this.extractBrandName(item.name);
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
        const totalClosingQty = brandItems.reduce((sum, item) => sum + item.closing.qty, 0);

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
            totalClosingQty,
            averageSalePrice: totalSaleStrips > 0 ? totalSalesAmount / totalSaleStrips : 0
          }
        };
      }).sort((a, b) => b.metrics.totalSalesAmount - a.metrics.totalSalesAmount);

      console.log(`✅ Brand analysis completed for ${brandAnalysis.length} brands`);
      return brandAnalysis;
      
    } catch (error) {
      console.error('❌ Brand analysis error:', error);
      return [];
    }
  }

  /**
   * Extract brand name from item name using brand database
   */
  private static extractBrandName(itemName: string): string {
    try {
      // Try to import brand manager
      const { brandManager } = require('../data/brandDatabase');
      
      // Try to find brand in database
      const brandMatch = brandManager.findBrand(itemName);
      if (brandMatch) {
        return brandMatch.brand.name;
      }
    } catch (error) {
      console.warn('Brand database not available, using fallback extraction');
    }
    
    // Fallback to pattern-based extraction
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

  /**
   * Generate human-readable summary with brand analysis
   */
  static generateSummary(formattedData: FormattedStockReport): string {
    try {
      console.log('🔄 Generating summary...');
      
      const { company, report, items, summary } = formattedData;
      const brandAnalysis = this.generateBrandWiseAnalysis(formattedData);
      
      const result = `
📊 **${company.name}** - ${report.title}
📅 Period: ${report.dateRange}
📦 Total Items: ${summary.totalItems} | 🏷️ Brands: ${brandAnalysis.length}
💰 Total Sales Value: ₹${summary.totalSalesValue.toLocaleString()}
📈 Total Closing Value: ₹${summary.totalClosingValue.toLocaleString()}

🏆 TOP PERFORMING BRANDS:
${brandAnalysis.slice(0, 5).map((brand, index) => 
  `${index + 1}. ${brand.brand}: ₹${brand.metrics.totalSalesAmount.toLocaleString()} (${brand.metrics.totalSaleStrips} strips sold)`
).join('\n')}

🔝 Top Individual Items:
${items
  .filter(item => item.sales.qty > 0)
  .sort((a, b) => b.sales.value - a.sales.value)
  .slice(0, 3)
  .map((item, index) => 
    `${index + 1}. ${item.name}: ${item.sales.qty} strips → ₹${item.sales.value}`
  ).join('\n')}
      `.trim();

      console.log('✅ Summary generated successfully');
      return result;
      
    } catch (error) {
      console.error('❌ Summary generation error:', error);
      return 'Summary generation failed';
    }
  }

  /**
   * Generate detailed brand-wise report
   */
  static generateDetailedBrandReport(formattedData: FormattedStockReport): string {
    try {
      console.log('🔄 Generating detailed brand report...');
      
      const { company, report } = formattedData;
      const brandAnalysis = this.generateBrandWiseAnalysis(formattedData);
      
      let report_text = `
🏢 **${company.name}** - Brand-wise Analysis
📅 ${report.dateRange}
${'='.repeat(60)}

`;

      brandAnalysis.forEach((brand, index) => {
        report_text += `
🏷️  **BRAND ${index + 1}: ${brand.brand}**
${'─'.repeat(40)}
📊 Overview:
   • Products: ${brand.itemCount} items
   • Sale Strips: ${brand.metrics.totalSaleStrips} strips
   • Free Strips: ${brand.metrics.totalFreeStrips} strips  
   • Sales Amount: ₹${brand.metrics.totalSalesAmount.toLocaleString()}
   • Closing Value: ₹${brand.metrics.totalClosingValue.toLocaleString()}
   • Avg Price/Strip: ₹${brand.metrics.averageSalePrice.toFixed(2)}

📋 Product Details:
`;
        
        brand.items.forEach((item, itemIndex) => {
          report_text += `   ${itemIndex + 1}. ${item.name}
      📦 Purchase: ${item.purchase.qty} + ${item.purchase.free} free
      💰 Sales: ${item.sales.qty} strips → ₹${item.sales.value}
      📊 Closing: ${item.closing.qty} strips (₹${item.closing.value})
`;
        });
        
        report_text += '\n';
      });

      console.log('✅ Detailed brand report generated successfully');
      return report_text.trim();
      
    } catch (error) {
      console.error('❌ Detailed brand report error:', error);
      return 'Detailed brand report generation failed';
    }
  }
}