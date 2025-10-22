/**
 * Simplified OCR Service for debugging 500 errors
 * Temporarily bypasses dots.ocr to isolate the issue
 */

export interface SimpleOCRResponse {
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

interface SimpleOCRProvider {
  name: string;
  extract: (fileBuffer: Buffer, filename: string) => Promise<SimpleOCRResponse>;
  isConfigured: () => boolean;
}

// ============================================================================
// NANONETS PROVIDER (SIMPLIFIED)
// ============================================================================

class SimpleNanonetsProvider implements SimpleOCRProvider {
  name = 'Nanonets';

  isConfigured(): boolean {
    const apiKey = process.env.NANONETS_API_KEY;
    return !!(apiKey && apiKey !== 'YOUR_NEW_NANONETS_API_KEY_HERE' && apiKey.length > 10);
  }

  async extract(fileBuffer: Buffer, filename: string): Promise<SimpleOCRResponse> {
    if (!this.isConfigured()) {
      throw new Error('Nanonets API key not configured');
    }

    console.log('🔧 Simple Nanonets: Starting extraction...');
    const startTime = Date.now();

    try {
      // Simplified Nanonets call without complex service
      const apiKey = process.env.NANONETS_API_KEY!;
      const modelId = process.env.NANONETS_MODEL_ID || 'bd442c54-71de-4057-a0b8-91c4c8b5e5e1';
      
      const formData = new URLSearchParams();
      const base64Data = fileBuffer.toString('base64');
      formData.append('file', `data:application/pdf;base64,${base64Data}`);

      const authString = Buffer.from(`${apiKey}:`).toString('base64');
      const url = `https://app.nanonets.com/api/v2/OCR/Model/${modelId}/LabelFile/`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`Nanonets API error: ${response.status}`);
      }

      const responseData = await response.json();
      
      // Simple text extraction
      let extractedText = '';
      if (responseData.result && Array.isArray(responseData.result)) {
        for (const page of responseData.result) {
          if (page.prediction && Array.isArray(page.prediction)) {
            const pageText = page.prediction
              .map((pred: any) => pred.ocr_text || pred.text || pred.label || '')
              .filter((text: string) => text.trim())
              .join(' ');
            
            if (pageText) {
              extractedText += pageText + '\n';
            }
          }
        }
      }

      console.log(`✅ Simple Nanonets: Success (${duration}ms, ${extractedText.length} chars)`);

      return {
        success: true,
        data: responseData,
        extractedText: extractedText.trim() || 'No text extracted',
        rawResponse: responseData,
        provider: this.name,
        metadata: {
          duration,
          fileSize: fileBuffer.length,
          confidence: 0.9
        }
      };

    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`❌ Simple Nanonets: Failed after ${duration}ms - ${error.message}`);
      throw error;
    }
  }
}

// ============================================================================
// OCR.SPACE PROVIDER (SIMPLIFIED)
// ============================================================================

class SimpleOCRSpaceProvider implements SimpleOCRProvider {
  name = 'OCR.space';
  private apiKey: string;
  private apiUrl = 'https://api.ocr.space/parse/image';

  constructor() {
    this.apiKey = process.env.OCR_SPACE_API_KEY || 'helloworld';
  }

  isConfigured(): boolean {
    return true; // Always available
  }

  async extract(fileBuffer: Buffer, filename: string): Promise<SimpleOCRResponse> {
    console.log('🔧 Simple OCR.space: Starting extraction...');
    const startTime = Date.now();

    try {
      const base64Data = fileBuffer.toString('base64');
      const base64String = `data:application/pdf;base64,${base64Data}`;

      const formData = new URLSearchParams();
      formData.append('base64Image', base64String);
      formData.append('apikey', this.apiKey);
      formData.append('language', 'eng');
      formData.append('isOverlayRequired', 'false');
      formData.append('detectOrientation', 'true');
      formData.append('scale', 'true');
      formData.append('OCREngine', '2');
      formData.append('filetype', 'PDF');

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

      if (responseData.IsErroredOnProcessing) {
        const errorMsg = Array.isArray(responseData.ErrorMessage) 
          ? responseData.ErrorMessage.join(', ') 
          : responseData.ErrorMessage || 'Unknown error';
        throw new Error(`OCR.space processing error: ${errorMsg}`);
      }

      let extractedText = '';
      if (responseData.ParsedResults && Array.isArray(responseData.ParsedResults)) {
        extractedText = responseData.ParsedResults
          .map((result: any) => result.ParsedText || '')
          .filter((text: string) => text.trim())
          .join('\n')
          .trim();
      }

      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No text extracted from document');
      }

      console.log(`✅ Simple OCR.space: Success (${duration}ms, ${extractedText.length} chars)`);

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
      console.error(`❌ Simple OCR.space: Failed after ${duration}ms - ${error.message}`);
      throw error;
    }
  }
}

// ============================================================================
// FALLBACK PROVIDER
// ============================================================================

class SimpleFallbackProvider implements SimpleOCRProvider {
  name = 'Fallback';

  isConfigured(): boolean {
    return true;
  }

  async extract(fileBuffer: Buffer, filename: string): Promise<SimpleOCRResponse> {
    console.log('🔧 Simple Fallback: Returning file info...');
    
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
// SIMPLE SERVICE CLASS
// ============================================================================

export class SimpleOCRService {
  private providers: SimpleOCRProvider[];

  constructor() {
    this.providers = [
      new SimpleNanonetsProvider(),
      new SimpleOCRSpaceProvider(),
      new SimpleFallbackProvider()
    ];
  }

  async extractFromBuffer(fileBuffer: Buffer, filename: string): Promise<SimpleOCRResponse> {
    console.log('🔬 SimpleOCR: Starting extraction...');
    console.log(`📄 File: ${filename}`);
    console.log(`📏 Size: ${(fileBuffer.length / 1024).toFixed(2)} KB`);

    const fileSizeMB = fileBuffer.length / (1024 * 1024);
    if (fileSizeMB > 50) {
      return {
        success: false,
        error: `File too large: ${fileSizeMB.toFixed(2)}MB. Maximum size is 50MB.`,
        provider: 'none'
      };
    }

    const overallStartTime = Date.now();

    for (const provider of this.providers) {
      if (!provider.isConfigured()) {
        console.log(`⏭️ ${provider.name}: Skipping (not configured)`);
        continue;
      }

      try {
        console.log(`🔄 ${provider.name}: Attempting extraction...`);
        
        const result = await provider.extract(fileBuffer, filename);

        if (result.success) {
          const overallDuration = Date.now() - overallStartTime;
          
          console.log(`✅ ${provider.name}: Extraction successful!`);
          console.log(`📊 Total time: ${overallDuration}ms`);
          console.log(`📜 Extracted text length: ${result.extractedText?.length || 0} characters`);
          
          result.metadata = {
            ...result.metadata,
            duration: overallDuration
          };

          return result;
        }

      } catch (error: any) {
        console.error(`❌ ${provider.name}: Failed - ${error.message}`);
        continue;
      }
    }

    const overallDuration = Date.now() - overallStartTime;
    console.error(`❌ SimpleOCR: All providers failed after ${overallDuration}ms`);

    return {
      success: false,
      error: 'All OCR providers failed. Please check API configuration and try again.',
      provider: 'none',
      metadata: {
        duration: overallDuration,
        fileSize: fileBuffer.length
      }
    };
  }

  async getStatus() {
    const providers = this.providers.map(provider => ({
      name: provider.name,
      configured: provider.isConfigured(),
      available: provider.isConfigured()
    }));

    return {
      ready: providers.some(p => p.configured),
      providers: providers,
      timestamp: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const simpleOCRService = new SimpleOCRService();