import { NextApiRequest, NextApiResponse } from 'next';
import { sendSuccess, sendError, validateMethod } from '../../../lib/api-response';

// Simple file-based storage for testing
let savedReports: any[] = [];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!validateMethod(req, res, ['POST', 'GET'])) {
    return;
  }

  if (req.method === 'GET') {
    // Return saved reports
    return sendSuccess(res, {
      reports: savedReports,
      count: savedReports.length
    });
  }

  try {
    console.log('📊 Saving stock report (simple storage)...');

    const stockReportData = req.body;

    if (!stockReportData.formattedData) {
      return sendError(res, 'Invalid data: formattedData is required', 400);
    }

    const { formattedData, metadata } = stockReportData;
    const { company, report, items, summary } = formattedData;

    // Create a simple report record
    const reportRecord = {
      id: Date.now(), // Simple ID
      company_name: company.name,
      report_title: report.title,
      date_range: report.dateRange,
      total_items: summary.totalItems,
      total_sales_value: summary.totalSalesValue,
      total_closing_value: summary.totalClosingValue,
      items_count: items.length,
      processed_at: new Date().toISOString(),
      filename: metadata.originalFilename,
      file_size: metadata.fileSize
    };

    // Save to memory (in production, this would be a database)
    savedReports.push(reportRecord);

    console.log('✅ Stock report saved successfully (simple storage)');
    console.log(`📊 Report ID: ${reportRecord.id}`);
    console.log(`📦 Items saved: ${items.length}`);

    return sendSuccess(res, {
      message: 'Stock report saved successfully (simple storage)',
      reportId: reportRecord.id,
      itemsCount: items.length,
      summary: {
        company: company.name,
        reportTitle: report.title,
        dateRange: report.dateRange,
        totalSalesValue: summary.totalSalesValue,
        totalItems: summary.totalItems
      }
    });

  } catch (error: any) {
    console.error('❌ Error saving stock report (simple):', error);
    return sendError(res, `Failed to save stock report: ${error.message}`, 500);
  }
}