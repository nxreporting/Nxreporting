// Simple in-memory storage for stock reports
// This is a temporary solution until database is properly set up

interface SimpleReport {
  id: number;
  company_name: string;
  report_title: string;
  date_range: string;
  total_items: number;
  total_sales_value: number;
  total_closing_value: number;
  items_count: number;
  processed_at: string;
  filename: string;
  file_size: number;
}

// In-memory storage (will reset on server restart)
let savedReports: SimpleReport[] = [];

export class SimpleStorage {
  static saveReport(reportData: any): SimpleReport {
    const { formattedData, metadata } = reportData;
    const { company, report, items, summary } = formattedData;

    const reportRecord: SimpleReport = {
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

    savedReports.push(reportRecord);
    console.log(`✅ Report saved to simple storage. Total reports: ${savedReports.length}`);
    
    return reportRecord;
  }

  static getReports(): SimpleReport[] {
    return savedReports;
  }

  static getReportCount(): number {
    return savedReports.length;
  }

  static getCompanies(): string[] {
    return [...new Set(savedReports.map(r => r.company_name))];
  }

  static clearReports(): void {
    savedReports = [];
  }
}