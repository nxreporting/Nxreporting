import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { sendSuccess, sendError, validateMethod } from '../../../lib/api-response';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface StockReportData {
  formattedData: {
    company: { name: string };
    report: {
      title: string;
      dateRange: string;
      generatedAt: string;
    };
    items: Array<{
      name: string;
      opening: { qty: number };
      purchase: { qty: number; free: number };
      purchaseReturn: { qty: number };
      sales: { qty: number; value: number };
      salesReturn: { qty: number; free: number };
      closing: { qty: number; value: number };
    }>;
    summary: {
      totalItems: number;
      totalOpeningQty: number;
      totalPurchaseQty: number;
      totalSalesQty: number;
      totalClosingQty: number;
      totalSalesValue: number;
      totalClosingValue: number;
    };
  };
  metadata: {
    originalFilename: string;
    fileSize: number;
    processedAt: string;
  };
  rawData: any;
}

/**
 * Extract brand name from item name
 */
function extractBrandName(itemName: string): string {
  const cleanName = itemName.toUpperCase().trim();
  const suffixes = ['TAB', 'TABLET', 'TABLETS', 'CAP', 'CAPSULE', 'CAPSULES', 'OD', 'MG', 'GM', 'SYRUP', 'GEL', 'CREAM'];
  let brandName = cleanName;
  
  suffixes.forEach(suffix => {
    brandName = brandName.replace(new RegExp(`\\s+${suffix}$`), '');
    brandName = brandName.replace(new RegExp(`-${suffix}$`), '');
  });

  const parts = brandName.split(/[\s-]+/);
  return parts[0] || itemName;
}

/**
 * Parse date range to start and end dates
 */
function parseDateRange(dateRange: string): { start: Date | null; end: Date | null } {
  try {
    // Handle format like "01-Sep-2025 TO 30-Sep-2025"
    const match = dateRange.match(/(\d{2}-\w{3}-\d{4})\s+TO\s+(\d{2}-\w{3}-\d{4})/);
    if (match) {
      const startStr = match[1];
      const endStr = match[2];
      
      // Convert "01-Sep-2025" to "2025-09-01"
      const convertDate = (dateStr: string) => {
        const [day, monthStr, year] = dateStr.split('-');
        const months: { [key: string]: string } = {
          'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
          'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
          'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
        };
        const month = months[monthStr] || '01';
        return new Date(`${year}-${month}-${day}`);
      };
      
      return {
        start: convertDate(startStr),
        end: convertDate(endStr)
      };
    }
  } catch (error) {
    console.error('Error parsing date range:', error);
  }
  
  return { start: null, end: null };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!validateMethod(req, res, ['POST'])) {
    return;
  }

  console.log('📊 Saving stock report to database...');

  try {
    const stockReportData: StockReportData = req.body;

    if (!stockReportData.formattedData) {
      return sendError(res, 'Invalid data: formattedData is required', 400);
    }

    const { formattedData, metadata, rawData } = stockReportData;
    const { company, report, items, summary } = formattedData;

    // 1. Insert or get company
    console.log('🏢 Processing company:', company.name);
    
    let companyRecord;
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('id')
      .eq('name', company.name)
      .single();

    if (existingCompany) {
      companyRecord = existingCompany;
    } else {
      const { data: newCompany, error: companyError } = await supabase
        .from('companies')
        .insert({ name: company.name })
        .select('id')
        .single();

      if (companyError) {
        console.error('❌ Error creating company:', companyError);
        return sendError(res, 'Failed to create company record', 500);
      }
      companyRecord = newCompany;
    }

    // 2. Parse date range
    const { start: periodStart, end: periodEnd } = parseDateRange(report.dateRange);

    // 3. Insert stock report
    console.log('📋 Creating stock report record...');
    
    const { data: reportRecord, error: reportError } = await supabase
      .from('stock_reports')
      .insert({
        company_id: companyRecord.id,
        report_title: report.title,
        report_period_start: periodStart,
        report_period_end: periodEnd,
        date_range: report.dateRange,
        total_items: summary.totalItems,
        total_opening_qty: summary.totalOpeningQty,
        total_purchase_qty: summary.totalPurchaseQty,
        total_sales_qty: summary.totalSalesQty,
        total_closing_qty: summary.totalClosingQty,
        total_sales_value: summary.totalSalesValue,
        total_closing_value: summary.totalClosingValue,
        original_filename: metadata.originalFilename,
        file_size: metadata.fileSize,
        processed_at: new Date(metadata.processedAt),
        raw_data: rawData
      })
      .select('id')
      .single();

    if (reportError) {
      console.error('❌ Error creating stock report:', reportError);
      return sendError(res, 'Failed to create stock report record', 500);
    }

    // 4. Insert stock items
    console.log('📦 Inserting stock items...');
    
    const stockItemsData = items.map(item => ({
      report_id: reportRecord.id,
      item_name: item.name,
      item_name_clean: item.name.replace(/[^A-Za-z0-9\s]/g, '').trim(),
      brand: extractBrandName(item.name),
      opening_qty: item.opening?.qty || 0,
      purchase_qty: item.purchase?.qty || 0,
      purchase_free: item.purchase?.free || 0,
      purchase_return_qty: item.purchaseReturn?.qty || 0,
      sales_qty: item.sales?.qty || 0,
      sales_value: item.sales?.value || 0,
      sales_return_qty: item.salesReturn?.qty || 0,
      sales_free: item.salesReturn?.free || 0,
      closing_qty: item.closing?.qty || 0,
      closing_value: item.closing?.value || 0
    }));

    const { error: itemsError } = await supabase
      .from('stock_items')
      .insert(stockItemsData);

    if (itemsError) {
      console.error('❌ Error inserting stock items:', itemsError);
      return sendError(res, 'Failed to insert stock items', 500);
    }

    // 5. Generate brand performance summary
    console.log('🏷️ Generating brand performance summary...');
    
    const brandSummary: { [key: string]: any } = {};
    
    items.forEach(item => {
      const brand = extractBrandName(item.name);
      if (!brandSummary[brand]) {
        brandSummary[brand] = {
          item_count: 0,
          total_sales_qty: 0,
          total_sales_value: 0,
          total_closing_value: 0
        };
      }
      
      brandSummary[brand].item_count++;
      brandSummary[brand].total_sales_qty += item.sales?.qty || 0;
      brandSummary[brand].total_sales_value += item.sales?.value || 0;
      brandSummary[brand].total_closing_value += item.closing?.value || 0;
    });

    const brandPerformanceData = Object.entries(brandSummary).map(([brand, data]: [string, any]) => ({
      report_id: reportRecord.id,
      brand_name: brand,
      item_count: data.item_count,
      total_sales_qty: data.total_sales_qty,
      total_sales_value: data.total_sales_value,
      total_closing_value: data.total_closing_value,
      avg_price_per_unit: data.total_sales_qty > 0 ? data.total_sales_value / data.total_sales_qty : 0
    }));

    const { error: brandError } = await supabase
      .from('brand_performance')
      .insert(brandPerformanceData);

    if (brandError) {
      console.error('❌ Error inserting brand performance:', brandError);
      // Don't fail the whole operation for this
    }

    console.log('✅ Stock report saved successfully');
    console.log(`📊 Report ID: ${reportRecord.id}`);
    console.log(`📦 Items saved: ${items.length}`);
    console.log(`🏷️ Brands processed: ${Object.keys(brandSummary).length}`);

    return sendSuccess(res, {
      message: 'Stock report saved successfully',
      reportId: reportRecord.id,
      itemsCount: items.length,
      brandsCount: Object.keys(brandSummary).length,
      summary: {
        company: company.name,
        reportTitle: report.title,
        dateRange: report.dateRange,
        totalSalesValue: summary.totalSalesValue,
        totalItems: summary.totalItems
      }
    });

  } catch (error: any) {
    console.error('❌ Error saving stock report:', error);
    return sendError(res, `Failed to save stock report: ${error.message}`, 500);
  }
}