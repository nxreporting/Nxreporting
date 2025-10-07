/**
 * PDF to CSV Converter
 * 
 * Extracts table data from pharmaceutical PDFs and converts to CSV format
 * No OCR needed - direct PDF text extraction with table structure detection
 */

import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';

// Configure PDF.js worker
if (typeof window === 'undefined') {
  // Server-side configuration
  const pdfjsWorker = require('pdfjs-dist/legacy/build/pdf.worker.entry');
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

export interface CsvExtractionResult {
  success: boolean;
  csvData?: string;
  tableData?: string[][];
  metadata?: {
    pages: number;
    tablesFound: number;
    companyName?: string;
    reportDate?: string;
    processingTime: number;
  };
  error?: string;
}

export class PdfToCsvConverter {
  
  /**
   * Main function to convert PDF to CSV
   */
  static async convertPdfToCsv(fileBuffer: Buffer, filename: string): Promise<CsvExtractionResult> {
    const startTime = Date.now();
    
    console.log(`📄 Starting PDF to CSV conversion: ${filename}`);
    console.log(`📏 File size: ${(fileBuffer.length / 1024).toFixed(2)} KB`);
    
    try {
      // Load PDF document
      const pdfDoc = await pdfjsLib.getDocument({
        data: new Uint8Array(fileBuffer),
        verbosity: 0 // Reduce console output
      }).promise;
      
      console.log(`📖 PDF loaded successfully: ${pdfDoc.numPages} pages`);
      
      let allText = '';
      let companyName = '';
      let reportDate = '';
      
      // Extract text from all pages
      for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Extract text items with position information
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        allText += pageText + '\n';
        
        // Extract company name and date from first page
        if (pageNum === 1) {
          companyName = this.extractCompanyName(pageText);
          reportDate = this.extractReportDate(pageText);
        }
      }
      
      console.log(`📝 Extracted text length: ${allText.length} characters`);
      console.log(`🏢 Company: ${companyName}`);
      console.log(`📅 Date: ${reportDate}`);
      
      // Convert text to table structure
      const tableData = this.parseTextToTable(allText);
      console.log(`📊 Found ${tableData.length} table rows`);
      
      if (tableData.length === 0) {
        return {
          success: false,
          error: 'No table data found in PDF',
          metadata: {
            pages: pdfDoc.numPages,
            tablesFound: 0,
            companyName,
            reportDate,
            processingTime: Date.now() - startTime
          }
        };
      }
      
      // Convert table to CSV
      const csvData = this.tableToCsv(tableData);
      
      const processingTime = Date.now() - startTime;
      console.log(`✅ PDF to CSV conversion completed in ${processingTime}ms`);
      
      return {
        success: true,
        csvData,
        tableData,
        metadata: {
          pages: pdfDoc.numPages,
          tablesFound: tableData.length > 0 ? 1 : 0,
          companyName,
          reportDate,
          processingTime
        }
      };
      
    } catch (error: any) {
      console.error('❌ PDF to CSV conversion failed:', error);
      
      return {
        success: false,
        error: `PDF conversion failed: ${error.message}`,
        metadata: {
          pages: 0,
          tablesFound: 0,
          processingTime: Date.now() - startTime
        }
      };
    }
  }
  
  /**
   * Extract company name from text
   */
  private static extractCompanyName(text: string): string {
    // Look for pharmaceutical company patterns
    const companyPatterns = [
      /([A-Z][A-Z\s]+(?:MEDICINES?|PHARMA|PHARMACEUTICAL|MEDICAL|HEALTHCARE))/i,
      /([A-Z][A-Z\s]+(?:STORES?|DISTRIBUTORS?))/i,
      /^([A-Z][A-Z\s]{5,})/m // Any long uppercase text at start
    ];
    
    for (const pattern of companyPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    return 'Unknown Company';
  }
  
  /**
   * Extract report date from text
   */
  private static extractReportDate(text: string): string {
    const datePatterns = [
      /(\d{1,2}[-\/]\w{3}[-\/]\d{4})/g, // DD-MMM-YYYY or DD/MMM/YYYY
      /(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/g, // DD-MM-YYYY or DD/MM/YYYY
      /(\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/g, // YYYY-MM-DD
      /(From.*?to.*?\d{4})/i, // "From ... to ..." patterns
      /(\(\d{2}-\w{3}-\d{4}\s+TO\s+\d{2}-\w{3}-\d{4}\))/i // (DD-MMM-YYYY TO DD-MMM-YYYY)
    ];
    
    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    return 'Unknown Date';
  }
  
  /**
   * Parse extracted text into table structure
   */
  private static parseTextToTable(text: string): string[][] {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const tableData: string[][] = [];
    
    // Look for table headers
    let headerFound = false;
    let headers: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip company info and titles
      if (this.isHeaderOrTitle(line)) {
        continue;
      }
      
      // Detect table headers
      if (!headerFound && this.isTableHeader(line)) {
        headers = this.parseTableRow(line);
        tableData.push(headers);
        headerFound = true;
        console.log(`📋 Found table headers: ${headers.join(', ')}`);
        continue;
      }
      
      // Parse data rows
      if (headerFound && this.isDataRow(line)) {
        const rowData = this.parseTableRow(line);
        if (rowData.length > 0) {
          // Ensure row has same number of columns as headers
          while (rowData.length < headers.length) {
            rowData.push('');
          }
          tableData.push(rowData.slice(0, headers.length));
        }
      }
    }
    
    // If no headers found, create generic ones
    if (!headerFound && tableData.length === 0) {
      // Try to find pharmaceutical product lines
      const productLines = lines.filter(line => this.isPharmaceuticalProduct(line));
      
      if (productLines.length > 0) {
        // Create headers based on common pharmaceutical report structure
        headers = ['Product Name', 'Opening', 'Purchase', 'Sales', 'Closing', 'Value'];
        tableData.push(headers);
        
        productLines.forEach(line => {
          const rowData = this.parsePharmaceuticalRow(line);
          if (rowData.length > 0) {
            while (rowData.length < headers.length) {
              rowData.push('');
            }
            tableData.push(rowData.slice(0, headers.length));
          }
        });
      }
    }
    
    return tableData;
  }
  
  /**
   * Check if line is a header or title
   */
  private static isHeaderOrTitle(line: string): boolean {
    const headerPatterns = [
      /^(MEDICINES?|PHARMA|PHARMACEUTICAL|MEDICAL|HEALTHCARE)/i,
      /^(Stock Report|Statement|Report)/i,
      /^\d{2}[-\/]\w{3}[-\/]\d{4}/,
      /^From.*to/i
    ];
    
    return headerPatterns.some(pattern => pattern.test(line));
  }
  
  /**
   * Check if line contains table headers
   */
  private static isTableHeader(line: string): boolean {
    const headerKeywords = [
      'Item Name', 'Product', 'Opening', 'Purchase', 'Sales', 'Closing', 'Value',
      'Op.', 'Pur', 'Sale', 'Stk', 'Val', 'Qty'
    ];
    
    const foundKeywords = headerKeywords.filter(keyword => 
      line.toLowerCase().includes(keyword.toLowerCase())
    );
    
    return foundKeywords.length >= 3; // At least 3 header keywords
  }
  
  /**
   * Check if line is a data row
   */
  private static isDataRow(line: string): boolean {
    // Should contain numbers and pharmaceutical product indicators
    const hasNumbers = /\d+/.test(line);
    const hasPharmaceuticalIndicators = /\b(TAB|TABLET|CAP|CAPSULE|SYRUP|GEL|CREAM|INJ|MG|ML)\b/i.test(line);
    
    return hasNumbers && (hasPharmaceuticalIndicators || line.length > 20);
  }
  
  /**
   * Check if line contains pharmaceutical product
   */
  private static isPharmaceuticalProduct(line: string): boolean {
    const pharmaceuticalPatterns = [
      /\b(TAB|TABLET|TABLETS|CAP|CAPSULE|SYRUP|GEL|CREAM|INJ|INJECTION)\b/i,
      /\b\d+\s*(MG|ML|GM)\b/i,
      /^[A-Z][A-Z\s\-0-9]+(TAB|CAP|SYRUP)/i
    ];
    
    return pharmaceuticalPatterns.some(pattern => pattern.test(line)) && /\d+/.test(line);
  }
  
  /**
   * Parse a table row into columns
   */
  private static parseTableRow(line: string): string[] {
    // Try different splitting strategies
    
    // Strategy 1: Split by multiple spaces (common in PDF text)
    let columns = line.split(/\s{2,}/).filter(col => col.trim().length > 0);
    
    if (columns.length < 3) {
      // Strategy 2: Split by tabs
      columns = line.split('\t').filter(col => col.trim().length > 0);
    }
    
    if (columns.length < 3) {
      // Strategy 3: Extract product name and numbers
      const productMatch = line.match(/^([A-Z][A-Z\s\-0-9]+(?:TAB|CAP|SYRUP|GEL|CREAM|INJ))/i);
      if (productMatch) {
        const productName = productMatch[1].trim();
        const remainingText = line.substring(productMatch[0].length);
        const numbers = remainingText.match(/\d+\.?\d*/g) || [];
        
        columns = [productName, ...numbers];
      }
    }
    
    return columns.map(col => col.trim());
  }
  
  /**
   * Parse pharmaceutical product row
   */
  private static parsePharmaceuticalRow(line: string): string[] {
    // Extract product name (usually at the beginning)
    const productMatch = line.match(/^([A-Z][A-Z\s\-0-9]+(?:TAB|CAP|SYRUP|GEL|CREAM|INJ|MG|ML))/i);
    
    if (!productMatch) {
      return [];
    }
    
    const productName = productMatch[1].trim();
    const remainingText = line.substring(productMatch[0].length);
    
    // Extract all numbers from the remaining text
    const numbers = remainingText.match(/\d+\.?\d*/g) || [];
    
    return [productName, ...numbers];
  }
  
  /**
   * Convert table data to CSV format
   */
  private static tableToCsv(tableData: string[][]): string {
    return tableData
      .map(row => 
        row.map(cell => {
          // Escape cells that contain commas or quotes
          if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        }).join(',')
      )
      .join('\n');
  }
}