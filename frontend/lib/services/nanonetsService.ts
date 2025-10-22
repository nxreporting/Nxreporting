/**
 * Enhanced Nanonets OCR Service
 * Based on official Nanonets API documentation: https://docstrange.nanonets.com/apidocs/
 * 
 * Features:
 * - Document OCR with structured data extraction
 * - Table extraction for financial reports
 * - Custom field extraction for pharmaceutical data
 * - Async processing for large documents
 */

import FormData from 'form-data';

// ============================================================================
// INTERFACES
// ============================================================================

export interface NanonetsConfig {
  apiKey: string;
  modelId?: string;
  baseUrl?: string;
}

export interface NanonetsResponse {
  success: boolean;
  data?: any;
  extractedText?: string;
  structuredData?: any;
  tables?: any[];
  fields?: Record<string, any>;
  error?: string;
  provider: string;
  metadata?: {
    duration: number;
    fileSize: number;
    confidence?: number;
    pages?: number;
  };
}

export interface NanonetsField {
  label: string;
  ocr_text: string;
  confidence: number;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface NanonetsTable {
  rows: Array<{
    cells: Array<{
      text: string;
      confidence: number;
      position: any;
    }>;
  }>;
}

// ============================================================================
// NANONETS SERVICE CLASS
// ============================================================================

export class NanonetsService {
  private config: NanonetsConfig;
  private baseUrl: string;

  constructor(config: NanonetsConfig) {
    this.config = {
      baseUrl: 'https://app.nanonets.com/api/v2',
      ...config
    };
    this.baseUrl = this.config.baseUrl!;
  }

  /**
   * Check if service is properly configured
   */
  isConfigured(): boolean {
    return !!(this.config.apiKey && 
             this.config.apiKey !== 'YOUR_NEW_NANONETS_API_KEY_HERE' &&
             this.config.apiKey.length > 10);
  }

  /**
   * Extract data from PDF using Nanonets OCR
   */
  async extractFromBuffer(
    fileBuffer: Buffer, 
    filename: string,
    options: {
      extractTables?: boolean;
      extractFields?: boolean;
      modelId?: string;
    } = {}
  ): Promise<NanonetsResponse> {
    if (!this.isConfigured()) {
      throw new Error('Nanonets API key not configured. Please set NANONETS_API_KEY in your environment.');
    }

    console.log('🔧 Nanonets: Starting enhanced extraction...');
    const startTime = Date.now();

    try {
      // Use provided model ID or default
      const modelId = options.modelId || this.config.modelId || 'bd442c54-71de-4057-a0b8-91c4c8b5e5e1';
      
      // Prepare form data
      const formData = new FormData();
      formData.append('file', fileBuffer, {
        filename: filename,
        contentType: 'application/pdf'
      });

      // Add extraction options
      if (options.extractTables) {
        formData.append('extract_tables', 'true');
      }
      
      if (options.extractFields) {
        formData.append('extract_fields', 'true');
      }

      // API endpoint
      const url = `${this.baseUrl}/OCR/Model/${modelId}/LabelFile/`;
      
      // Authentication header
      const authString = Buffer.from(`${this.config.apiKey}:`).toString('base64');

      console.log(`📡 Nanonets: Calling API (model: ${modelId})...`);
      console.log(`📄 File: ${filename} (${(fileBuffer.length / 1024).toFixed(2)} KB)`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authString}`,
          ...formData.getHeaders()
        },
        body: formData
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Nanonets: HTTP ${response.status} - ${errorText}`);
        
        // Handle specific error cases
        if (response.status === 401) {
          throw new Error('Invalid Nanonets API key. Please check your NANONETS_API_KEY.');
        } else if (response.status === 413) {
          throw new Error('File too large for Nanonets API. Maximum size is 25MB.');
        } else if (response.status === 429) {
          throw new Error('Nanonets API rate limit exceeded. Please try again later.');
        }
        
        throw new Error(`Nanonets API error: ${response.status} - ${errorText}`);
      }

      const responseData = await response.json();
      
      // Process the response
      const processedResult = this.processNanonetsResponse(responseData);
      
      console.log(`✅ Nanonets: Success (${duration}ms)`);
      console.log(`📊 Extracted: ${processedResult.extractedText?.length || 0} chars, ${processedResult.tables?.length || 0} tables, ${Object.keys(processedResult.fields || {}).length} fields`);

      return {
        success: true,
        data: responseData,
        extractedText: processedResult.extractedText,
        structuredData: processedResult.structuredData,
        tables: processedResult.tables,
        fields: processedResult.fields,
        provider: 'Nanonets',
        metadata: {
          duration,
          fileSize: fileBuffer.length,
          confidence: processedResult.confidence,
          pages: processedResult.pages
        }
      };

    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`❌ Nanonets: Failed after ${duration}ms - ${error.message}`);
      throw error;
    }
  }

  /**
   * Process Nanonets API response into structured format
   */
  private processNanonetsResponse(responseData: any): {
    extractedText: string;
    structuredData: any;
    tables: any[];
    fields: Record<string, any>;
    confidence: number;
    pages: number;
  } {
    let extractedText = '';
    let structuredData: any = {};
    let tables: any[] = [];
    let fields: Record<string, any> = {};
    let totalConfidence = 0;
    let confidenceCount = 0;
    let pages = 0;

    try {
      if (responseData.result && Array.isArray(responseData.result)) {
        pages = responseData.result.length;

        for (const page of responseData.result) {
          if (page.prediction && Array.isArray(page.prediction)) {
            // Extract text and fields
            for (const prediction of page.prediction) {
              const text = prediction.ocr_text || prediction.text || prediction.label || '';
              const confidence = prediction.confidence || 0;
              
              if (text.trim()) {
                extractedText += text + ' ';
                
                // Track confidence
                if (confidence > 0) {
                  totalConfidence += confidence;
                  confidenceCount++;
                }
                
                // Store as field if it has a label
                if (prediction.label && prediction.label !== text) {
                  fields[prediction.label] = {
                    value: text,
                    confidence: confidence,
                    position: prediction.position || null
                  };
                }
              }
            }
          }

          // Extract tables if present
          if (page.tables && Array.isArray(page.tables)) {
            for (const table of page.tables) {
              const processedTable = this.processTable(table);
              if (processedTable) {
                tables.push(processedTable);
              }
            }
          }
        }
      }

      // Clean up extracted text
      extractedText = extractedText.trim().replace(/\s+/g, ' ');

      // Create structured data for pharmaceutical reports
      structuredData = this.createStructuredData(extractedText, fields, tables);

      const avgConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0;

      return {
        extractedText,
        structuredData,
        tables,
        fields,
        confidence: avgConfidence,
        pages
      };

    } catch (error) {
      console.warn('⚠️ Nanonets: Error processing response, returning raw data');
      return {
        extractedText: JSON.stringify(responseData, null, 2),
        structuredData: responseData,
        tables: [],
        fields: {},
        confidence: 0,
        pages: 0
      };
    }
  }

  /**
   * Process table data from Nanonets response
   */
  private processTable(tableData: any): any {
    try {
      if (!tableData.rows || !Array.isArray(tableData.rows)) {
        return null;
      }

      const processedRows = tableData.rows.map((row: any) => {
        if (!row.cells || !Array.isArray(row.cells)) {
          return [];
        }
        
        return row.cells.map((cell: any) => ({
          text: cell.text || cell.ocr_text || '',
          confidence: cell.confidence || 0
        }));
      });

      return {
        rows: processedRows,
        metadata: {
          rowCount: processedRows.length,
          columnCount: processedRows[0]?.length || 0
        }
      };

    } catch (error) {
      console.warn('⚠️ Nanonets: Error processing table data');
      return null;
    }
  }

  /**
   * Create structured data for pharmaceutical/business reports
   */
  private createStructuredData(text: string, fields: Record<string, any>, tables: any[]): any {
    const structured: any = {
      company: {},
      report: {},
      items: [],
      summary: {}
    };

    try {
      // Extract company information
      const companyMatch = text.match(/(?:company|firm|medicines?|pharma|ltd|limited|inc|corp)[:\s]*([A-Z][A-Z\s&.]+)/i);
      if (companyMatch) {
        structured.company.name = companyMatch[1].trim();
      }

      // Extract report information
      const reportMatch = text.match(/(?:stock|inventory|sales|report)[:\s]*([A-Z][A-Z\s]+)/i);
      if (reportMatch) {
        structured.report.title = reportMatch[1].trim();
      }

      // Extract date information
      const dateMatch = text.match(/(?:date|period|month|year)[:\s]*([A-Z][a-z]+\s+\d{2,4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
      if (dateMatch) {
        structured.report.dateRange = dateMatch[1].trim();
      }

      // Process tables for item data
      if (tables.length > 0) {
        for (const table of tables) {
          const items = this.extractItemsFromTable(table);
          structured.items.push(...items);
        }
      }

      // Extract summary information from fields
      for (const [key, field] of Object.entries(fields)) {
        if (key.toLowerCase().includes('total') || key.toLowerCase().includes('sum')) {
          structured.summary[key] = field.value;
        }
      }

      return structured;

    } catch (error) {
      console.warn('⚠️ Nanonets: Error creating structured data');
      return { raw: text, fields, tables };
    }
  }

  /**
   * Extract item data from table structure
   */
  private extractItemsFromTable(table: any): any[] {
    const items: any[] = [];

    try {
      if (!table.rows || table.rows.length < 2) {
        return items;
      }

      // Assume first row is header
      const headers = table.rows[0].map((cell: any) => 
        cell.text.toLowerCase().replace(/[^a-z0-9]/g, '')
      );

      // Process data rows
      for (let i = 1; i < table.rows.length; i++) {
        const row = table.rows[i];
        const item: any = {};

        for (let j = 0; j < Math.min(headers.length, row.length); j++) {
          const header = headers[j];
          const cellValue = row[j]?.text || '';

          if (cellValue.trim()) {
            // Map common pharmaceutical report fields
            if (header.includes('name') || header.includes('item') || header.includes('product')) {
              item.name = cellValue;
            } else if (header.includes('opening') || header.includes('stock')) {
              item.opening = this.parseNumber(cellValue);
            } else if (header.includes('sales') || header.includes('sold')) {
              item.sales = this.parseNumber(cellValue);
            } else if (header.includes('closing') || header.includes('balance')) {
              item.closing = this.parseNumber(cellValue);
            } else if (header.includes('value') || header.includes('amount')) {
              if (header.includes('sales')) {
                item.salesValue = this.parseNumber(cellValue);
              } else if (header.includes('closing')) {
                item.closingValue = this.parseNumber(cellValue);
              }
            } else {
              item[header] = cellValue;
            }
          }
        }

        if (Object.keys(item).length > 0) {
          items.push(item);
        }
      }

    } catch (error) {
      console.warn('⚠️ Nanonets: Error extracting items from table');
    }

    return items;
  }

  /**
   * Parse numeric values from text
   */
  private parseNumber(text: string): number {
    if (!text) return 0;
    
    // Remove non-numeric characters except decimal point and comma
    const cleaned = text.replace(/[^\d.,\-]/g, '');
    
    // Handle Indian number format (lakhs, crores)
    if (text.toLowerCase().includes('lakh')) {
      return parseFloat(cleaned) * 100000;
    } else if (text.toLowerCase().includes('crore')) {
      return parseFloat(cleaned) * 10000000;
    }
    
    // Standard number parsing
    const number = parseFloat(cleaned.replace(/,/g, ''));
    return isNaN(number) ? 0 : number;
  }

  /**
   * Get available models for the account
   */
  async getModels(): Promise<any[]> {
    if (!this.isConfigured()) {
      throw new Error('Nanonets API key not configured');
    }

    try {
      const authString = Buffer.from(`${this.config.apiKey}:`).toString('base64');
      
      const response = await fetch(`${this.baseUrl}/OCR/Model/`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${authString}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`);
      }

      const models = await response.json();
      return models;

    } catch (error: any) {
      console.error('❌ Nanonets: Failed to fetch models:', error.message);
      throw error;
    }
  }

  /**
   * Create a new model for custom document types
   */
  async createModel(name: string, categories: string[]): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('Nanonets API key not configured');
    }

    try {
      const authString = Buffer.from(`${this.config.apiKey}:`).toString('base64');
      
      const response = await fetch(`${this.baseUrl}/OCR/Model/`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name,
          categories: categories
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create model: ${response.status}`);
      }

      const model = await response.json();
      return model;

    } catch (error: any) {
      console.error('❌ Nanonets: Failed to create model:', error.message);
      throw error;
    }
  }

  /**
   * Get service status and configuration
   */
  getStatus() {
    return {
      configured: this.isConfigured(),
      apiKey: this.config.apiKey ? `${this.config.apiKey.substring(0, 8)}...` : 'Not set',
      modelId: this.config.modelId || 'Default',
      baseUrl: this.baseUrl
    };
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create Nanonets service instance from environment variables
 */
export function createNanonetsService(): NanonetsService {
  return new NanonetsService({
    apiKey: process.env.NANONETS_API_KEY || '',
    modelId: process.env.NANONETS_MODEL_ID,
    baseUrl: process.env.NANONETS_BASE_URL
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export default NanonetsService;