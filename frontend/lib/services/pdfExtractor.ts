/**
 * Enhanced PDF Extraction Service
 * 
 * Provides reliable PDF text extraction using OCR.space API with comprehensive
 * error handling, retry logic, and support for multiple pharmaceutical PDF formats.
 */

import FormData from 'form-data';

// Core interfaces for the PDF extraction service
export interface ExtractionResult {
  success: boolean;
  provider: 'OCR.space' | 'Fallback';
  extractedText?: string;
  error?: string;
  rawResponse?: any;
  metadata?: {
    duration: number;
    fileSize: number;
    attempts: number;
    processingMethod: 'base64' | 'multipart';
    formatDetected?: string;
    confidence?: number;
    parsingStrategy?: string;
  };
  structuredData?: {
    company_name: string;
    report_title: string;
    date_range: string;
    [key: string]: any; // Dynamic pharmaceutical data fields
  };
}

/**
 * Environment Configuration Handler
 */
export class EnvironmentConfig {
  static validateApiKey(): string {
    const apiKey = process.env.OCR_SPACE_API_KEY;
    
    if (!apiKey || apiKey.trim() === '' || apiKey === 'your-api-key-here') {
      throw new Error('OCR_SPACE_API_KEY environment variable is required and must be set to a valid API key');
    }
    
    return apiKey.trim();
  }
}

/**
 * Secure Logger - Never logs sensitive information
 */
export class SecureLogger {
  static log(level: 'INFO' | 'DEBUG' | 'ERROR', message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const sanitizedData = data ? this.sanitizeData(data) : '';
    console.log(`[${timestamp}] ${level}: ${message}${sanitizedData ? ' ' + JSON.stringify(sanitizedData) : ''}`);
  }
  
  private static sanitizeData(data: any): any {
    if (typeof data === 'string') {
      // Never log API keys or sensitive tokens
      if (data.includes('apikey') || data.includes('token') || data.includes('key')) {
        return '[REDACTED]';
      }
      return data.length > 200 ? data.substring(0, 200) + '...' : data;
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        if (key.toLowerCase().includes('key') || key.toLowerCase().includes('token') || key.toLowerCase().includes('password')) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = value;
        }
      }
      return sanitized;
    }
    
    return data;
  }
}

/**
 * File Processing Utilities
 */
export class FileProcessor {
  static determineProcessingMethod(fileBuffer: Buffer): 'base64' | 'multipart' {
    const fileSizeMB = fileBuffer.length / (1024 * 1024);
    return fileSizeMB < 5 ? 'base64' : 'multipart';
  }
  
  static formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} Bytes`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  }
  
  static createFormData(fileBuffer: Buffer, filename: string, method: 'base64' | 'multipart'): FormData {
    const formData = new FormData();
    
    if (method === 'base64') {
      const base64Data = fileBuffer.toString('base64');
      const base64String = `data:application/pdf;base64,${base64Data}`;
      formData.append('base64Image', base64String);
    } else {
      formData.append('file', fileBuffer, {
        filename: filename,
        contentType: 'application/pdf'
      });
    }
    
    // OCR.space configuration
    formData.append('apikey', EnvironmentConfig.validateApiKey());
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');
    formData.append('detectOrientation', 'true');
    formData.append('scale', 'true');
    formData.append('OCREngine', '2'); // Engine 2 for better accuracy
    formData.append('filetype', 'PDF');
    formData.append('isTable', 'true'); // Enable table detection
    
    return formData;
  }
}

/**
 * OCR.space API Client
 */
export class OcrSpaceApiClient {
  private static readonly API_URL = 'https://api.ocr.space/parse/image';
  private static readonly TIMEOUT = 60000; // 60 seconds
  
  static async extractText(fileBuffer: Buffer, filename: string): Promise<{
    success: boolean;
    extractedText?: string;
    error?: string;
    rawResponse?: any;
  }> {
    const processingMethod = FileProcessor.determineProcessingMethod(fileBuffer);
    
    SecureLogger.log('DEBUG', 'API configuration prepared', {
      filename,
      provider: 'OCR.space',
      processingMethod,
      apiUrl: this.API_URL,
      ocrEngine: '2',
      language: 'eng',
      isTableDetectionEnabled: true,
      hasApiKey: true
    });
    
    try {
      const formData = FileProcessor.createFormData(fileBuffer, filename, processingMethod);
      
      SecureLogger.log('DEBUG', 'Making OCR.space API request', {
        filename,
        url: this.API_URL,
        timeout: this.TIMEOUT
      });
      
      const response = await fetch(this.API_URL, {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders(),
        timeout: this.TIMEOUT
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const responseData = await response.json();
      
      SecureLogger.log('DEBUG', 'OCR response received', {
        filename,
        responseLength: JSON.stringify(responseData).length,
        hasText: !!(responseData.ParsedResults && responseData.ParsedResults[0]?.ParsedText),
        processingTimeMs: responseData.ProcessingTimeInMilliseconds,
        provider: 'OCR.space',
        responseTime: new Date().toISOString()
      });
      
      // Check for processing errors
      if (responseData.IsErroredOnProcessing) {
        const errorMsg = Array.isArray(responseData.ErrorMessage) 
          ? responseData.ErrorMessage.join(', ') 
          : responseData.ErrorMessage || 'Unknown OCR processing error';
        throw new Error(`OCR.space processing error: ${errorMsg}`);
      }
      
      // Extract text from response
      const extractedText = this.parseResponse(responseData);
      
      if (!extractedText || extractedText.trim().length === 0) {
        SecureLogger.log('DEBUG', 'OCR returned empty or no text', { filename });
        throw new Error('No text could be extracted from the document');
      }
      
      SecureLogger.log('DEBUG', 'OCR text extraction successful', {
        filename,
        textLength: extractedText.length,
        hasContent: extractedText.trim().length > 0
      });
      
      return {
        success: true,
        extractedText,
        rawResponse: responseData
      };
      
    } catch (error: any) {
      SecureLogger.log('DEBUG', 'OCR extraction attempt failed', {
        filename,
        error: error.message,
        isRetryable: this.isRetryableError(error)
      });
      
      return {
        success: false,
        error: `OCR.space API request failed: ${error.message}`,
        rawResponse: null
      };
    }
  }
  
  private static parseResponse(responseData: any): string {
    try {
      let extractedText = '';
      
      if (responseData.ParsedResults && Array.isArray(responseData.ParsedResults)) {
        extractedText = responseData.ParsedResults
          .map((result: any) => result.ParsedText || '')
          .filter((text: string) => text.trim())
          .join('\n')
          .trim();
      }
      
      return extractedText;
    } catch (error) {
      SecureLogger.log('DEBUG', 'Error parsing OCR response', { error: error.message });
      return '';
    }
  }
  
  private static isRetryableError(error: any): boolean {
    const retryableErrors = [
      'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED',
      'Network request failed', 'Request timeout', 'HTTP 429', 'HTTP 500', 'HTTP 502', 'HTTP 503'
    ];
    
    return retryableErrors.some(retryableError => 
      error.message?.includes(retryableError) || error.code === retryableError
    );
  }
}

/**
 * Retry Handler with Exponential Backoff
 */
export class RetryHandler {
  static async withExponentialBackoff<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        SecureLogger.log('DEBUG', 'Attempting OCR extraction', { 
          filename: 'current-file', 
          attempt, 
          maxAttempts 
        });
        
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        if (attempt < maxAttempts && this.isRetryableError(error)) {
          const delay = baseDelay * Math.pow(2, attempt - 1);
          SecureLogger.log('DEBUG', `Retrying after ${delay}ms delay`, { attempt });
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          if (!this.isRetryableError(error)) {
            SecureLogger.log('INFO', 'Error is not retryable, failing immediately', {
              filename: 'current-file',
              attempt,
              error: error.message
            });
          }
          break;
        }
      }
    }
    
    if (lastError) {
      SecureLogger.log('INFO', 'All retry attempts exhausted', {
        filename: 'current-file',
        totalAttempts: maxAttempts,
        finalError: lastError.message
      });
    }
    
    throw lastError || new Error('Max retries exceeded');
  }
  
  private static isRetryableError(error: any): boolean {
    const retryableErrors = [
      'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED',
      'Network request failed', 'Request timeout', 'HTTP 429', 'HTTP 500', 'HTTP 502', 'HTTP 503'
    ];
    
    return retryableErrors.some(retryableError => 
      error.message?.includes(retryableError) || error.code === retryableError
    );
  }
}

/**
 * Pharmaceutical Data Parser - Enhanced Multi-Format Support
 */
export class PharmaceuticalParser {
  static parseStructuredData(text: string): any {
    SecureLogger.log('DEBUG', 'Starting pharmaceutical data parsing', {
      textLength: text.length,
      hasContent: text.trim().length > 0
    });
    
    const result: any = {
      company_name: 'Unknown Company',
      report_title: 'Stock Report',
      date_range: 'Unknown Period'
    };
    
    try {
      // Enhanced company name detection
      const companyPatterns = [
        /^([A-Z\s]+MEDICINES?)$/im,
        /^([A-Z\s]+MEDICAL\s+STORES?).*$/im,
        /^([A-Z\s]+PHARMA).*$/im,
        /^([A-Z\s]+PHARMACEUTICALS?).*$/im,
        /^([A-Z\s]+HEALTHCARE).*$/im
      ];
      
      const lines = text.split('\n');
      for (const line of lines) {
        for (const pattern of companyPatterns) {
          const match = line.trim().match(pattern);
          if (match) {
            result.company_name = match[1].trim();
            SecureLogger.log('DEBUG', 'Company name detected', { 
              company: result.company_name,
              pattern: pattern.source 
            });
            break;
          }
        }
        if (result.company_name !== 'Unknown Company') break;
      }
      
      // Enhanced date range detection
      const datePatterns = [
        /\((\d{1,2}-\w{3}-\d{4})\s+TO\s+(\d{1,2}-\w{3}-\d{4})\)/i,
        /From\s*-->\s*(\d{1,2}-\w{3}-\d{2,4})\s+to\s+(\d{1,2}-\w{3}-\d{2,4})/i,
        /(\d{1,2}\/\d{1,2}\/\d{4})\s+to\s+(\d{1,2}\/\d{1,2}\/\d{4})/i,
        /(\d{4}-\d{1,2}-\d{1,2})\s+to\s+(\d{4}-\d{1,2}-\d{1,2})/i
      ];
      
      for (const pattern of datePatterns) {
        const match = text.match(pattern);
        if (match) {
          result.date_range = `${match[1]} TO ${match[2]}`;
          SecureLogger.log('DEBUG', 'Date range detected', { 
            dateRange: result.date_range,
            pattern: pattern.source 
          });
          break;
        }
      }
      
      // Parse pharmaceutical products with enhanced patterns
      this.parsePharmaceuticalProducts(text, result);
      
      SecureLogger.log('DEBUG', 'Pharmaceutical parsing completed', {
        company: result.company_name,
        dateRange: result.date_range,
        productCount: Object.keys(result).filter(key => key.startsWith('item_')).length / 9
      });
      
      return result;
      
    } catch (error: any) {
      SecureLogger.log('DEBUG', 'Pharmaceutical parsing error', { error: error.message });
      return result;
    }
  }
  
  private static parsePharmaceuticalProducts(text: string, result: any): void {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    const productPatterns = [
      /^([A-Z][A-Z\s\-0-9]+(TAB|TABLET|TABLETS|CAP|CAPSULE|SYRUP|GEL|CREAM|OD|D3|PM|SL|CD3|MAX|LITE|OZ|MOISTURIZING|DAILY))\s+(.+)/i,
      /^([A-Z][A-Z\s\-0-9]+)\s+(\d+.*)/i // Generic pattern for any pharmaceutical product
    ];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip header lines
      if (line.includes('MEDICINES') || line.includes('Stock Report') || 
          line.includes('Statement') || line.includes('TO') ||
          line.match(/^\d{2}-\w{3}-\d{4}/) || line === 'Item Name' ||
          line.includes('Opening') || line.includes('Purch') || line.includes('Sales') ||
          line.includes('TOTAL')) {
        continue;
      }
      
      for (const pattern of productPatterns) {
        const match = line.match(pattern);
        if (match) {
          const itemName = match[1].trim();
          const numbersText = match[2] || match[3] || '';
          
          // Extract numbers from the line
          const numbers = numbersText.match(/\d+\.?\d*/g);
          if (numbers && numbers.length >= 5) {
            const numericValues = numbers.map(n => parseFloat(n)).filter(n => !isNaN(n));
            
            if (numericValues.length >= 5) {
              const cleanItemName = itemName
                .replace(/\s+/g, '_')
                .replace(/[^A-Z0-9_]/g, '')
                .toUpperCase();
              
              // Map to pharmaceutical stock fields
              result[`item_${cleanItemName}_op`] = numericValues[0] || 0;
              result[`item_${cleanItemName}_pur`] = numericValues[1] || 0;
              result[`item_${cleanItemName}_sp`] = numericValues[2] || 0;
              result[`item_${cleanItemName}_cr`] = numericValues[3] || 0;
              result[`item_${cleanItemName}_sale`] = numericValues[4] || 0;
              result[`item_${cleanItemName}_sval`] = numericValues[5] || 0;
              result[`item_${cleanItemName}_ss`] = numericValues[6] || 0;
              result[`item_${cleanItemName}_c_stk`] = numericValues[7] || 0;
              result[`item_${cleanItemName}_c_val`] = numericValues[8] || 0;
              
              SecureLogger.log('DEBUG', 'Product parsed', {
                product: cleanItemName,
                valuesCount: numericValues.length
              });
            }
          }
          break;
        }
      }
    }
  }
}

/**
 * Main PDF Extraction Function
 */
export async function extractPDF(
  fileBuffer: Buffer,
  filename: string,
  outputType: 'flat-json' | 'structured-json'
): Promise<ExtractionResult> {
  const startTime = Date.now();
  const processingMethod = FileProcessor.determineProcessingMethod(fileBuffer);
  
  SecureLogger.log('INFO', 'PDF extraction started', {
    filename,
    fileSize: fileBuffer.length,
    processingMethod,
    provider: 'OCR.space',
    startTime: new Date().toISOString()
  });
  
  SecureLogger.log('INFO', 'Processing method determined', {
    filename,
    processingMethod,
    fileSize: fileBuffer.length,
    fileSizeFormatted: FileProcessor.formatFileSize(fileBuffer.length),
    provider: 'OCR.space',
    reason: processingMethod === 'base64' ? 'File size < 5MB' : 'File size >= 5MB'
  });
  
  try {
    // Validate environment
    EnvironmentConfig.validateApiKey();
    
    // Extract text with retry logic
    const ocrResult = await RetryHandler.withExponentialBackoff(
      () => OcrSpaceApiClient.extractText(fileBuffer, filename),
      3,
      1000
    );
    
    if (!ocrResult.success) {
      const duration = Date.now() - startTime;
      SecureLogger.log('INFO', 'PDF extraction completed', {
        filename,
        duration,
        success: false,
        attempts: 3,
        processingMethod,
        provider: 'OCR.space',
        endTime: new Date().toISOString()
      });
      
      return {
        success: false,
        provider: 'OCR.space',
        error: ocrResult.error,
        rawResponse: ocrResult.rawResponse,
        metadata: {
          duration,
          fileSize: fileBuffer.length,
          attempts: 3,
          processingMethod
        }
      };
    }
    
    const duration = Date.now() - startTime;
    
    // Prepare result based on output type
    let structuredData = undefined;
    let formatDetected = 'unknown';
    let confidence = 0.5;
    let parsingStrategy = 'raw-text';
    
    if (outputType === 'structured-json' && ocrResult.extractedText) {
      try {
        structuredData = PharmaceuticalParser.parseStructuredData(ocrResult.extractedText);
        formatDetected = 'comprehensive-pharmaceutical';
        confidence = 0.8;
        parsingStrategy = 'enhanced-pharmaceutical-parser';
      } catch (parseError: any) {
        SecureLogger.log('DEBUG', 'Structured parsing failed, using raw text', { 
          error: parseError.message 
        });
      }
    }
    
    SecureLogger.log('INFO', 'PDF extraction completed', {
      filename,
      duration,
      success: true,
      attempts: 1,
      processingMethod,
      provider: 'OCR.space',
      endTime: new Date().toISOString()
    });
    
    return {
      success: true,
      provider: 'OCR.space',
      extractedText: ocrResult.extractedText,
      structuredData,
      rawResponse: ocrResult.rawResponse,
      metadata: {
        duration,
        fileSize: fileBuffer.length,
        attempts: 1,
        processingMethod,
        formatDetected,
        confidence,
        parsingStrategy
      }
    };
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    SecureLogger.log('INFO', 'PDF extraction completed', {
      filename,
      duration,
      success: false,
      attempts: 3,
      processingMethod,
      provider: 'OCR.space',
      endTime: new Date().toISOString()
    });
    
    return {
      success: false,
      provider: 'OCR.space',
      error: error.message,
      metadata: {
        duration,
        fileSize: fileBuffer.length,
        attempts: 3,
        processingMethod
      }
    };
  }
}