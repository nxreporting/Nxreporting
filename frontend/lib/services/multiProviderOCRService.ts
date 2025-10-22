/**
 * Multi-Provider OCR Service
 * Handles PDF text extraction using multiple OCR providers with fallback strategy
 * 
 * Providers (in order of preference):
 * 1. dots.ocr (SOTA accuracy)
 * 2. Nanonets API (pharmaceutical focus)
 * 3. OCR.space API (reliable backup)
 * 4. Fallback (file info only)
 */

// ============================================================================
// INTERFACES
// ============================================================================

export interface OCRResponse {
  success: boolean;
  data?: any;
  error?: string;
  extractedText?: string;
  rawResponse?: any;
  provider?: string;
  metadata?: {
    attempts?: number;
    duration?: number;
    fileSize?: number;
    confidence?: number;
    pages?: number;
    tables?: number;
    fields?: number;
    elements?: number;
    layoutElements?: number;
  };
}

interface OCRProvider {
  name: string;
  extract: (fileBuffer: Buffer, filename: string) => Promise<OCRResponse>;
  isConfigured: () => boolean | Promise<boolean>;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Retry function with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`⏳ Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

/**
 * Sanitize text for logging (remove sensitive data)
 */
function sanitizeForLog(text: string, maxLength: number = 200): string {
  if (!text) return '';
  return text.substring(0, maxLength) + (text.length > maxLength ? '...' : '');
}

// ============================================================================
// NANONETS PROVIDER
// ============================================================================

import { createNanonetsService } from './nanonetsService';

// ============================================================================
// DOTS OCR PROVIDER
// ============================================================================

import { createDotsOCRService } from './dotsOCRService';

class DotsOCRProvider implements OCRProvider {
  name = 'dots.ocr';
  private dotsOCRService: any;
  private configuredCache: boolean | null = null;
  private lastCheck: number = 0;
  private checkInterval = 30000; // Check every 30 seconds

  constructor() {
    try {
      this.dotsOCRService = createDotsOCRService();
    } catch (error) {
      console.warn('⚠️ dots.ocr service creation failed:', error);
      this.dotsOCRService = null;
    }
  }

  isConfigured(): boolean {
    // Return cached result if recent
    const now = Date.now();
    if (this.configuredCache !== null && (now - this.lastCheck) < this.checkInterval) {
      return this.configuredCache;
    }

    // Quick synchronous check - assume not configured if service creation failed
    if (!this.dotsOCRService) {
      this.configuredCache = false;
      this.lastCheck = now;
      return false;
    }

    // Assume configured for now, will be verified during extraction
    this.configuredCache = true;
    this.lastCheck = now;
    return true;
  }

  async extract(fileBuffer: Buffer, filename: string): Promise<OCRResponse> {
    console.log('🔧 dots.ocr: Starting document parsing...');
    const startTime = Date.now();

    try {
      // Check if service is available
      if (!this.dotsOCRService) {
        throw new Error('dots.ocr service not initialized');
      }

      // Check server availability
      const status = await this.dotsOCRService.getStatus();
      if (!status.available) {
        this.configuredCache = false; // Update cache
        throw new Error('dots.ocr server not available. Please start vLLM server.');
      }

      this.configuredCache = true; // Update cache

      // Use dots.ocr with layout and text extraction
      const result = await this.dotsOCRService.extractFromBuffer(fileBuffer, filename, {
        mode: 'layout_all' // Get both layout and text
      });

      if (result.success) {
        console.log(`✅ dots.ocr: Document parsing successful`);
        console.log(`📊 Data: ${result.extractedText?.length || 0} chars, ${result.layoutElements?.length || 0} elements`);

        return {
          success: true,
          data: result.structuredData || result.data,
          extractedText: result.extractedText,
          rawResponse: result.data,
          provider: this.name,
          metadata: {
            duration: result.metadata?.duration || (Date.now() - startTime),
            fileSize: fileBuffer.length,
            confidence: result.metadata?.confidence,
            pages: result.metadata?.pages,
            elements: result.metadata?.elementsCount || 0,
            layoutElements: result.layoutElements?.length || 0
          }
        };
      } else {
        throw new Error(result.error || 'dots.ocr extraction failed');
      }

    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`❌ dots.ocr: Document parsing failed after ${duration}ms - ${error.message}`);

      // Update cache if it's a server availability issue
      if (error.message.includes('server not available') || error.message.includes('not initialized')) {
        this.configuredCache = false;
      }

      throw error;
    }
  }
}

class NanonetsProvider implements OCRProvider {
  name = 'Nanonets';
  private nanonetsService: any;

  constructor() {
    this.nanonetsService = createNanonetsService();
  }

  isConfigured(): boolean {
    return this.nanonetsService.isConfigured();
  }

  async extract(fileBuffer: Buffer, filename: string): Promise<OCRResponse> {
    if (!this.isConfigured()) {
      throw new Error('Nanonets API key not configured');
    }

    console.log('🔧 Nanonets: Starting enhanced extraction...');
    const startTime = Date.now();

    try {
      // Use enhanced Nanonets service with table and field extraction
      const result = await this.nanonetsService.extractFromBuffer(fileBuffer, filename, {
        extractTables: true,
        extractFields: true
      });

      if (result.success) {
        console.log(`✅ Nanonets: Enhanced extraction successful`);
        console.log(`📊 Data: ${result.extractedText?.length || 0} chars, ${result.tables?.length || 0} tables, ${Object.keys(result.fields || {}).length} fields`);

        return {
          success: true,
          data: result.structuredData || result.data,
          extractedText: result.extractedText,
          rawResponse: result.data,
          provider: this.name,
          metadata: {
            duration: result.metadata?.duration || (Date.now() - startTime),
            fileSize: fileBuffer.length,
            confidence: result.metadata?.confidence,
            pages: result.metadata?.pages,
            tables: result.tables?.length || 0,
            fields: Object.keys(result.fields || {}).length
          }
        };
      } else {
        throw new Error(result.error || 'Nanonets extraction failed');
      }

    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`❌ Nanonets: Enhanced extraction failed after ${duration}ms - ${error.message}`);
      throw error;
    }
  }
}

// ============================================================================
// OCR.SPACE PROVIDER
// ============================================================================

class OCRSpaceProvider implements OCRProvider {
  name = 'OCR.space';
  private apiKey: string;
  private apiUrl = 'https://api.ocr.space/parse/image';

  constructor() {
    this.apiKey = process.env.OCR_SPACE_API_KEY || 'helloworld';
  }

  isConfigured(): boolean {
    // OCR.space has a free tier, so it's always "configured"
    return true;
  }

  async extract(fileBuffer: Buffer, filename: string): Promise<OCRResponse> {
    console.log('🔧 OCR.space: Starting extraction...');
    const startTime = Date.now();

    try {
      const fileSizeMB = fileBuffer.length / (1024 * 1024);

      // Always use base64 encoding for better compatibility
      console.log(`📦 OCR.space: File (${fileSizeMB.toFixed(2)}MB), using base64 encoding`);

      const base64Data = fileBuffer.toString('base64');
      const base64String = `data:application/pdf;base64,${base64Data}`;

      // Prepare form data as URLSearchParams for better compatibility
      const formData = new URLSearchParams();
      formData.append('base64Image', base64String);
      formData.append('apikey', this.apiKey);
      formData.append('language', 'eng');
      formData.append('isOverlayRequired', 'false');
      formData.append('detectOrientation', 'true');
      formData.append('scale', 'true');
      formData.append('OCREngine', '2'); // Engine 2 for better accuracy
      formData.append('filetype', 'PDF');

      console.log('📡 OCR.space: Calling API...');

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`OCR.space HTTP error: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();

      // Check for processing errors
      if (responseData.IsErroredOnProcessing) {
        const errorMsg = Array.isArray(responseData.ErrorMessage)
          ? responseData.ErrorMessage.join(', ')
          : responseData.ErrorMessage || 'Unknown error';
        throw new Error(`OCR.space processing error: ${errorMsg}`);
      }

      // Extract text from response
      const extractedText = this.extractTextFromResponse(responseData);

      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No text extracted from document');
      }

      console.log(`✅ OCR.space: Success (${duration}ms, ${extractedText.length} chars)`);

      return {
        success: true,
        data: responseData,
        extractedText: extractedText,
        rawResponse: responseData,
        provider: this.name,
        metadata: {
          duration,
          fileSize: fileBuffer.length
        }
      };

    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`❌ OCR.space: Failed after ${duration}ms - ${error.message}`);
      throw error;
    }
  }

  private extractTextFromResponse(responseData: any): string {
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
      console.warn('⚠️ OCR.space: Error extracting text from response');
      return '';
    }
  }
}

// ============================================================================
// FALLBACK PROVIDER
// ============================================================================

class FallbackProvider implements OCRProvider {
  name = 'Fallback';

  isConfigured(): boolean {
    return true; // Always available
  }

  async extract(fileBuffer: Buffer, filename: string): Promise<OCRResponse> {
    console.log('🔧 Fallback: Returning file info (no OCR)...');

    const fileSizeMB = (fileBuffer.length / (1024 * 1024)).toFixed(2);

    const fallbackData = {
      message: 'OCR extraction not available',
      filename: filename,
      fileSize: `${fileSizeMB} MB`,
      timestamp: new Date().toISOString(),
      note: 'All OCR providers failed. Please check API configuration.'
    };

    return {
      success: true,
      data: fallbackData,
      extractedText: `File: ${filename}\nSize: ${fileSizeMB} MB\nNote: OCR not available - all providers failed`,
      rawResponse: fallbackData,
      provider: this.name,
      metadata: {
        fileSize: fileBuffer.length
      }
    };
  }
}

// ============================================================================
// MAIN SERVICE CLASS
// ============================================================================

export class MultiProviderOCRService {
  private providers: OCRProvider[];

  constructor() {
    // Initialize providers in order of preference
    // dots.ocr first for best accuracy, then Nanonets, then OCR.space
    this.providers = [
      new DotsOCRProvider(),
      new NanonetsProvider(),
      new OCRSpaceProvider(),
      new FallbackProvider()
    ];
  }

  /**
   * Extract text from PDF using multiple OCR providers with fallback
   * @param fileBuffer - Buffer containing the PDF file data
   * @param filename - Original filename for the PDF
   * @returns Promise<OCRResponse>
   */
  async extractFromBuffer(
    fileBuffer: Buffer,
    filename: string
  ): Promise<OCRResponse> {
    console.log('🔬 MultiProviderOCR: Starting extraction...');
    console.log(`📄 File: ${filename}`);
    console.log(`📏 Size: ${(fileBuffer.length / 1024).toFixed(2)} KB`);

    // Validate file size
    const fileSizeMB = fileBuffer.length / (1024 * 1024);
    if (fileSizeMB > 50) {
      return {
        success: false,
        error: `File too large: ${fileSizeMB.toFixed(2)}MB. Maximum size is 50MB.`,
        provider: 'none'
      };
    }

    const overallStartTime = Date.now();
    let totalAttempts = 0;

    // Try each provider in order
    for (const provider of this.providers) {
      // Skip providers that aren't configured
      const isConfigured = await Promise.resolve(provider.isConfigured());
      if (!isConfigured) {
        console.log(`⏭️ ${provider.name}: Skipping (not configured)`);
        continue;
      }

      try {
        console.log(`🔄 ${provider.name}: Attempting extraction...`);

        // Use retry logic for non-fallback providers
        const shouldRetry = provider.name !== 'Fallback';
        const maxRetries = shouldRetry ? 3 : 1;

        const result = await retryWithBackoff(
          () => provider.extract(fileBuffer, filename),
          maxRetries,
          1000 // 1 second base delay
        );

        totalAttempts += maxRetries;

        if (result.success) {
          const overallDuration = Date.now() - overallStartTime;

          console.log(`✅ ${provider.name}: Extraction successful!`);
          console.log(`📊 Total time: ${overallDuration}ms, Total attempts: ${totalAttempts}`);
          console.log(`📜 Extracted text length: ${result.extractedText?.length || 0} characters`);

          // Add overall metadata
          result.metadata = {
            ...result.metadata,
            attempts: totalAttempts,
            duration: overallDuration
          };

          // Track analytics (if available)
          this.trackAnalytics(provider.name, true, overallDuration, fileBuffer.length);

          return result;
        }

      } catch (error: any) {
        totalAttempts += 3; // Count failed retries
        console.error(`❌ ${provider.name}: All attempts failed - ${error.message}`);

        // Track analytics for failure
        this.trackAnalytics(provider.name, false, Date.now() - overallStartTime, fileBuffer.length);

        // Continue to next provider
        continue;
      }
    }

    // If all providers failed
    const overallDuration = Date.now() - overallStartTime;
    console.error(`❌ MultiProviderOCR: All providers failed after ${overallDuration}ms`);

    return {
      success: false,
      error: 'All OCR providers failed. Please check API configuration and try again.',
      provider: 'none',
      metadata: {
        attempts: totalAttempts,
        duration: overallDuration,
        fileSize: fileBuffer.length
      }
    };
  }

  /**
   * Extract from file path (for backward compatibility)
   */
  async extractFromPDF(
    filePath: string
  ): Promise<OCRResponse> {
    try {
      const fs = await import('fs');

      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          error: `File not found: ${filePath}`,
          provider: 'none'
        };
      }

      const fileBuffer = fs.readFileSync(filePath);
      const filename = filePath.split('/').pop() || 'document.pdf';

      return this.extractFromBuffer(fileBuffer, filename);

    } catch (error: any) {
      console.error('❌ MultiProviderOCR: File extraction failed:', error.message);

      return {
        success: false,
        error: `File extraction failed: ${error.message}`,
        provider: 'none'
      };
    }
  }

  /**
   * Extract from cloud storage URL
   */
  async extractFromUrl(fileUrl: string): Promise<OCRResponse> {
    try {
      console.log('📥 MultiProviderOCR: Downloading file from URL...');

      const fileResponse = await fetch(fileUrl);

      if (!fileResponse.ok) {
        return {
          success: false,
          error: `Failed to download file: ${fileResponse.status} ${fileResponse.statusText}`,
          provider: 'none'
        };
      }

      const fileBuffer = Buffer.from(await fileResponse.arrayBuffer());
      const filename = fileUrl.split('/').pop() || 'document.pdf';

      return this.extractFromBuffer(fileBuffer, filename);

    } catch (error: any) {
      console.error('❌ MultiProviderOCR: URL extraction failed:', error.message);

      return {
        success: false,
        error: `URL extraction failed: ${error.message}`,
        provider: 'none'
      };
    }
  }

  /**
   * Get service status
   */
  async getStatus() {
    const providers = await Promise.all(
      this.providers.map(async provider => ({
        name: provider.name,
        configured: await Promise.resolve(provider.isConfigured()),
        available: await Promise.resolve(provider.isConfigured())
      }))
    );

    return {
      ready: providers.some(p => p.configured),
      providers: providers,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Track analytics (integrate with your analytics service)
   */
  private trackAnalytics(
    provider: string,
    success: boolean,
    duration: number,
    fileSize: number
  ): void {
    try {
      // Log for monitoring
      console.log(`📊 Analytics: ${provider} - ${success ? 'Success' : 'Failed'} - ${duration}ms`);

      // If you have Vercel Analytics or similar, track here
      if (typeof window !== 'undefined' && (window as any).va) {
        (window as any).va('track', 'ocr_extraction', {
          provider,
          success,
          duration,
          fileSize
        });
      }

      // You can also send to your own analytics endpoint
      // fetch('/api/analytics/track', { ... })

    } catch (error) {
      // Don't let analytics errors break the flow
      console.warn('⚠️ Analytics tracking failed:', error);
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

// Export singleton instance
export const ocrService = new MultiProviderOCRService();

// Export class for custom instances
export default MultiProviderOCRService;

// Export for backward compatibility (will be deprecated)
export const nanonetsService = ocrService;
export { ocrService as multiProviderOCRService };
