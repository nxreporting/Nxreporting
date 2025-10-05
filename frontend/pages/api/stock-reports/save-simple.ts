import { NextApiRequest, NextApiResponse } from 'next';
import { sendSuccess, sendError, validateMethod } from '../../../lib/api-response';
import { SimpleStorage } from '../../../lib/simple-storage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!validateMethod(req, res, ['POST', 'GET'])) {
    return;
  }

  if (req.method === 'GET') {
    // Return saved reports
    const reports = SimpleStorage.getReports();
    return sendSuccess(res, {
      reports: reports,
      count: reports.length
    });
  }

  try {
    console.log('📊 Saving stock report (simple storage)...');

    const stockReportData = req.body;

    if (!stockReportData.formattedData) {
      return sendError(res, 'Invalid data: formattedData is required', 400);
    }

    // Save using shared storage
    const reportRecord = SimpleStorage.saveReport(stockReportData);

    console.log('✅ Stock report saved successfully (simple storage)');
    console.log(`📊 Report ID: ${reportRecord.id}`);
    console.log(`📦 Items saved: ${reportRecord.items_count}`);

    return sendSuccess(res, {
      message: 'Stock report saved successfully (simple storage)',
      reportId: reportRecord.id,
      itemsCount: reportRecord.items_count,
      summary: {
        company: reportRecord.company_name,
        reportTitle: reportRecord.report_title,
        dateRange: reportRecord.date_range,
        totalSalesValue: reportRecord.total_sales_value,
        totalItems: reportRecord.total_items
      }
    });

  } catch (error: any) {
    console.error('❌ Error saving stock report (simple):', error);
    return sendError(res, `Failed to save stock report: ${error.message}`, 500);
  }
}