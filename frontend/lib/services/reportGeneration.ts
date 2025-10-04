import * as XLSX from 'xlsx';

interface ExtractedDataWithFile {
  id: string;
  rawData: any;
  structuredData: any;
  status: string;
  extractedAt: Date;
  file: {
    originalName: string;
    uploadedAt: Date;
  };
}

export async function generateCSV(data: ExtractedDataWithFile[]): Promise<string> {
  try {
    const csvRows = [];
    
    // Header
    csvRows.push('File Name,Upload Date,Extraction Date,Status,Word Count,Dates Found,Numbers Found,Has Tables');
    
    // Data rows
    data.forEach(item => {
      const metadata = (item.structuredData as any)?.metadata || {};
      const dates = (item.structuredData as any)?.dates || [];
      const numbers = (item.structuredData as any)?.numbers || [];
      const tables = (item.structuredData as any)?.tables || [];
      
      const row = [
        `"${item.file.originalName}"`,
        new Date(item.file.uploadedAt).toISOString().split('T')[0],
        new Date(item.extractedAt).toISOString().split('T')[0],
        item.status,
        metadata.wordCount || 0,
        dates.length,
        numbers.length,
        tables.length > 0 ? 'Yes' : 'No'
      ];
      
      csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
  } catch (error) {
    console.error('CSV generation error:', error);
    throw new Error('Failed to generate CSV');
  }
}

export async function generateExcel(data: ExtractedDataWithFile[]): Promise<Buffer> {
  try {
    const workbook = XLSX.utils.book_new();
    
    // Summary sheet
    const summaryData = [
      ['Total Files', data.length],
      ['Successful Extractions', data.filter(d => d.status === 'COMPLETED').length],
      ['Failed Extractions', data.filter(d => d.status === 'FAILED').length],
      ['Total Word Count', data.reduce((sum, d) => {
        const wordCount = (d.structuredData as any)?.metadata?.wordCount || 0;
        return sum + wordCount;
      }, 0)]
    ];
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    
    // Details sheet
    const detailsData = data.map(item => {
      const metadata = (item.structuredData as any)?.metadata || {};
      const dates = (item.structuredData as any)?.dates || [];
      const numbers = (item.structuredData as any)?.numbers || [];
      const tables = (item.structuredData as any)?.tables || [];
      
      return {
        'File Name': item.file.originalName,
        'Upload Date': new Date(item.file.uploadedAt).toISOString().split('T')[0],
        'Extraction Date': new Date(item.extractedAt).toISOString().split('T')[0],
        'Status': item.status,
        'Word Count': metadata.wordCount || 0,
        'Dates Found': dates.length,
        'Numbers Found': numbers.length,
        'Has Tables': tables.length > 0 ? 'Yes' : 'No',
        'Title': (item.structuredData as any)?.title || ''
      };
    });
    
    const detailsSheet = XLSX.utils.json_to_sheet(detailsData);
    XLSX.utils.book_append_sheet(workbook, detailsSheet, 'Details');
    
    // Numbers sheet (if any numbers found)
    const allNumbers = data.flatMap(item => {
      const numbers = (item.structuredData as any)?.numbers || [];
      return numbers.map((num: number) => ({
        'File Name': item.file.originalName,
        'Number': num,
        'Extraction Date': new Date(item.extractedAt).toISOString().split('T')[0]
      }));
    });
    
    if (allNumbers.length > 0) {
      const numbersSheet = XLSX.utils.json_to_sheet(allNumbers);
      XLSX.utils.book_append_sheet(workbook, numbersSheet, 'Numbers');
    }
    
    // Dates sheet (if any dates found)
    const allDates = data.flatMap(item => {
      const dates = (item.structuredData as any)?.dates || [];
      return dates.map((date: string) => ({
        'File Name': item.file.originalName,
        'Date': date,
        'Extraction Date': new Date(item.extractedAt).toISOString().split('T')[0]
      }));
    });
    
    if (allDates.length > 0) {
      const datesSheet = XLSX.utils.json_to_sheet(allDates);
      XLSX.utils.book_append_sheet(workbook, datesSheet, 'Dates');
    }
    
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  } catch (error) {
    console.error('Excel generation error:', error);
    throw new Error('Failed to generate Excel file');
  }
}