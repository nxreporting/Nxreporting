// Note: Using browser FormData API for serverless compatibility

// Interface for OCR API response
export interface NanonetsResponse {
  success: boolean;
  data?: any;
  error?: string;
  extractedText?: string;
  rawResponse?: any;
  provider?: string; // Which OCR provider was used
}

/**
 * Service class for Nanonets PDF extraction API
 * Handles file uploads and extraction using the Nanonets API
 * Optimized for serverless environments with cloud storage support
 */
export class NanonetsExtractionService {
  private apiKey: string;
  private baseUrl: string = 'https://app.nanonets.com/api/v2/OCR/Model';
  private defaultModelId: string = 'bd442c54-71de-4057-a0b8-91c4c8b5e5e1'; // Default OCR model

  constructor() {
    this.apiKey = process.env.NANONETS_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('⚠️ NANONETS_API_KEY not found in environment variables');
    }
  }

  /**
   * Try Nanonets OCR API with proper configuration
   */
  private async tryNanonetsOCR(
    fileBuffer: Buffer, 
    filename: string, 
    outputType: string
  ): Promise<NanonetsResponse> {
    if (!this.apiKey) {
      throw new Error('Nanonets API key not configured');
    }

    console.log('🔧 Trying Nanonets OCR with corrected configuration...');

    // Try multiple approaches for Nanonets
    const attempts = [
      {
        name: 'Default OCR Model',
        modelId: this.defaultModelId,
        url: `${this.baseUrl}/${this.defaultModelId}/LabelFile/`
      },
      {
        name: 'Create New Model',
        modelId: null,
        url: null
      }
    ];

    for (const attempt of attempts) {
      try {
        console.log(`🔄 Attempting: ${attempt.name}`);

        if (attempt.name === 'Create New Model') {
          // Try to create a new model first
          const newModelId = await this.createNewModel();
          if (!newModelId) continue;
          
          attempt.modelId = newModelId;
          attempt.url = `${this.baseUrl}/${newModelId}/LabelFile/`;
        }

        const formData = new FormData();
        const uint8Array = new Uint8Array(fileBuffer);
        const blob = new Blob([uint8Array], { type: 'application/pdf' });
        formData.append('file', blob, filename);

        console.log(`📡 Making request to: ${attempt.url}`);

        const response = await fetch(attempt.url!, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${Buffer.from(this.apiKey + ':').toString('base64')}`,
          },
          body: formData
        });

        console.log(`📬 Response: ${response.status} ${response.statusText}`);

        if (response.ok) {
          const responseData = await response.json();
          console.log('✅ Nanonets OCR successful!');
          console.log('📊 Nanonets response data:', JSON.stringify(responseData).substring(0, 500));
          
          const extractedText = this.extractTextFromNanonetsResponse(responseData);
          console.log('📜 Extracted text length:', extractedText.length);
          console.log('📜 Extracted text preview:', extractedText.substring(0, 200));
          
          return {
            success: true,
            data: responseData,
            extractedText: extractedText,
            rawResponse: responseData,
            provider: 'Nanonets'
          };
        } else {
          const errorText = await response.text();
          console.log(`❌ Nanonets HTTP error: ${response.status} - ${errorText}`);
          console.log(`❌ ${attempt.name} failed: ${response.status} - ${errorText}`);
        }

      } catch (error: any) {
        console.log(`❌ ${attempt.name} error: ${error.message}`);
      }
    }

    throw new Error('All Nanonets attempts failed');
  }

  /**
   * Create a new OCR model
   */
  private async createNewModel(): Promise<string | null> {
    try {
      console.log('🔧 Creating new Nanonets OCR model...');
      
      const response = await fetch(`${this.baseUrl}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(this.apiKey + ':').toString('base64')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model_type: 'ocr',
          categories: ['text']
        })
      });

      if (response.ok) {
        const newModel = await response.json();
        console.log('✅ Created model:', newModel.model_id);
        return newModel.model_id;
      } else {
        const errorText = await response.text();
        console.log('❌ Failed to create model:', errorText);
        return null;
      }
    } catch (error) {
      console.log('❌ Model creation error:', error);
      return null;
    }
  }

  /**
   * Extract text from Nanonets response format
   */
  private extractTextFromNanonetsResponse(responseData: any): string {
    try {
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

      return extractedText.trim() || 'No text extracted from document';
    } catch (error) {
      console.warn('⚠️ Error extracting text from Nanonets response:', error);
      return JSON.stringify(responseData, null, 2);
    }
  }

  /**
   * Try OCR.space API - Working solution!
   */
  private async tryOCRSpaceAPI(
    fileBuffer: Buffer, 
    filename: string, 
    outputType: string
  ): Promise<NanonetsResponse> {
    console.log('🔄 Trying OCR.space API...');
    
    // OCR.space has a free tier with 'helloworld' key
    const ocrSpaceApiKey = process.env.OCR_SPACE_API_KEY || 'helloworld';
    
    // Create proper FormData for serverless environment
    const formData = new FormData();
    
    // For PDF files, use base64 encoding which is more reliable with OCR.space
    if (filename.toLowerCase().endsWith('.pdf')) {
      console.log('📄 Processing PDF file with base64 encoding...');
      const base64Data = fileBuffer.toString('base64');
      const base64String = `data:application/pdf;base64,${base64Data}`;
      
      formData.append('base64Image', base64String);
      formData.append('apikey', ocrSpaceApiKey);
      formData.append('language', 'eng');
      formData.append('isOverlayRequired', 'false');
      formData.append('detectOrientation', 'false');
      formData.append('scale', 'true');
      formData.append('OCREngine', '2'); // Use OCR Engine 2 for better accuracy
      formData.append('filetype', 'PDF'); // Explicitly specify file type for PDFs
    } else {
      console.log('🖼️ Processing image file with blob...');
      // Convert Buffer to Blob for image files
      const uint8Array = new Uint8Array(fileBuffer);
      const blob = new Blob([uint8Array], { type: 'application/pdf' });
      
      formData.append('file', blob, filename);
      formData.append('apikey', ocrSpaceApiKey);
      formData.append('language', 'eng');
      formData.append('isOverlayRequired', 'false');
      formData.append('detectOrientation', 'false');
      formData.append('scale', 'true');
      formData.append('OCREngine', '2'); // Use OCR Engine 2 for better accuracy
    }

    console.log('📡 Making OCR.space request...');

    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`OCR.space HTTP error: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json();
    console.log('📊 OCR.space response received');

    if (responseData.IsErroredOnProcessing) {
      const errorMsg = Array.isArray(responseData.ErrorMessage) 
        ? responseData.ErrorMessage.join(', ') 
        : responseData.ErrorMessage;
      throw new Error(`OCR.space processing error: ${errorMsg}`);
    }

    // Extract text from OCR.space response
    let extractedText = '';
    if (responseData.ParsedResults && responseData.ParsedResults.length > 0) {
      extractedText = responseData.ParsedResults
        .map((result: any) => result.ParsedText || '')
        .filter((text: string) => text.trim())
        .join('\n')
        .trim();
    }

    if (!extractedText) {
      throw new Error('No text extracted from document');
    }

    console.log('✅ OCR.space extraction successful!');
    console.log(`📜 Extracted ${extractedText.length} characters`);

    return {
      success: true,
      data: responseData,
      extractedText: extractedText,
      rawResponse: responseData
    };
  }

  /**
   * Fallback OCR method - returns basic file info
   */
  private async tryFallbackOCR(
    fileBuffer: Buffer, 
    filename: string, 
    outputType: string
  ): Promise<NanonetsResponse> {
    // This is a basic fallback that doesn't actually do OCR
    // but provides some file information
    const fileSizeMB = (fileBuffer.length / (1024 * 1024)).toFixed(2);
    
    const fallbackData = {
      message: 'OCR extraction not available - using fallback',
      filename: filename,
      fileSize: `${fileSizeMB} MB`,
      timestamp: new Date().toISOString(),
      note: 'Please configure OCR API keys for text extraction'
    };

    return {
      success: true,
      data: fallbackData,
      extractedText: `File: ${filename}\nSize: ${fileSizeMB} MB\nNote: OCR not available - please configure API keys`,
      rawResponse: fallbackData
    };
  }

  /**
   * Extract data from PDF using multiple OCR providers with fallback
   * @param fileBuffer - Buffer containing the PDF file data
   * @param filename - Original filename for the PDF
   * @param outputType - Type of output ('flat-json', 'markdown', 'json')
   * @returns Promise<NanonetsResponse>
   */
  async extractFromBuffer(
    fileBuffer: Buffer,
    filename: string,
    outputType: 'flat-json' | 'markdown' | 'json' = 'flat-json'
  ): Promise<NanonetsResponse> {
    try {
      console.log('🔬 Starting PDF extraction from buffer...');
      console.log(`📄 File: ${filename}`);
      console.log(`📊 Output type: ${outputType}`);

      // Check file size (most APIs have size limits)
      const fileSizeMB = fileBuffer.length / (1024 * 1024);
      console.log(`📏 File size: ${fileSizeMB.toFixed(2)} MB`);

      if (fileSizeMB > 50) { // 50MB limit for most APIs
        return {
          success: false,
          error: `File too large: ${fileSizeMB.toFixed(2)}MB. Maximum size is 50MB.`
        };
      }

      // Try multiple OCR providers in order of preference
      // Nanonets first - better for pharmaceutical document extraction
      const providers = [
        { name: 'Nanonets', method: this.tryNanonetsOCR.bind(this) },
        { name: 'OCR.space', method: this.tryOCRSpaceAPI.bind(this) },
        { name: 'Fallback', method: this.tryFallbackOCR.bind(this) }
      ];

      for (const provider of providers) {
        try {
          console.log(`🔄 Trying ${provider.name}...`);
          console.log(`📊 Provider method:`, provider.method.name);
          
          const result = await provider.method(fileBuffer, filename, outputType);
          
          console.log(`📊 ${provider.name} result:`, {
            success: result.success,
            hasData: !!result.data,
            hasText: !!result.extractedText,
            textLength: result.extractedText?.length || 0,
            error: result.error
          });
          
          if (result.success) {
            console.log(`✅ ${provider.name} succeeded!`);
            console.log(`📜 Extracted text preview:`, result.extractedText?.substring(0, 200));
            result.provider = provider.name;
            return result;
          } else {
            console.log(`❌ ${provider.name} failed: ${result.error}`);
          }
        } catch (providerError: any) {
          console.log(`❌ ${provider.name} error: ${providerError.message}`);
          console.log(`📊 Error stack:`, providerError.stack);
        }
      }

      // If all providers failed
      return {
        success: false,
        error: 'All OCR providers failed. Please check your API keys and try again.',
        provider: 'none'
      };

    } catch (error: any) {
      console.error('❌ PDF extraction failed:', error);
      
      return {
        success: false,
        error: `Extraction failed: ${error.message}`,
        rawResponse: error,
        provider: 'error'
      };
    }
  }

  /**
   * Extract data from PDF using cloud storage URL
   * @param fileUrl - URL to the PDF file in cloud storage
   * @param outputType - Type of output ('flat-json', 'markdown', 'json')
   * @returns Promise<NanonetsResponse>
   */
  async extractFromUrl(
    fileUrl: string,
    outputType: 'flat-json' | 'markdown' | 'json' = 'flat-json'
  ): Promise<NanonetsResponse> {
    try {
      console.log('🔬 Starting Nanonets PDF extraction from URL...');
      console.log(`📄 URL: ${fileUrl}`);
      console.log(`📊 Output type: ${outputType}`);

      // Validate API key
      if (!this.apiKey) {
        return {
          success: false,
          error: 'Nanonets API key not configured'
        };
      }

      // Download file from URL first
      console.log('📥 Downloading file from cloud storage...');
      const fileResponse = await fetch(fileUrl);
      
      if (!fileResponse.ok) {
        return {
          success: false,
          error: `Failed to download file from URL: ${fileResponse.status} ${fileResponse.statusText}`
        };
      }

      const fileBuffer = Buffer.from(await fileResponse.arrayBuffer());
      const filename = fileUrl.split('/').pop() || 'document.pdf';

      // Use buffer extraction method
      return this.extractFromBuffer(fileBuffer, filename, outputType);

    } catch (error: any) {
      console.error('❌ Nanonets URL extraction failed:', error);
      
      return {
        success: false,
        error: `URL extraction failed: ${error.message}`,
        rawResponse: error
      };
    }
  }

  /**
   * Legacy method for backward compatibility - extracts from file path
   * @param filePath - Path to the PDF file to extract
   * @param outputType - Type of output ('flat-json', 'markdown', 'json')
   * @returns Promise<NanonetsResponse>
   */
  async extractFromPDF(
    filePath: string, 
    outputType: 'flat-json' | 'markdown' | 'json' = 'flat-json'
  ): Promise<NanonetsResponse> {
    try {
      // For serverless environments, we need to read the file as buffer
      const fs = await import('fs');
      
      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          error: `File not found: ${filePath}`
        };
      }

      const fileBuffer = fs.readFileSync(filePath);
      const filename = filePath.split('/').pop() || 'document.pdf';

      return this.extractFromBuffer(fileBuffer, filename, outputType);

    } catch (error: any) {
      console.error('❌ Nanonets file extraction failed:', error);
      
      return {
        success: false,
        error: `File extraction failed: ${error.message}`,
        rawResponse: error
      };
    }
  }

  /**
   * Extract text content from Nanonets OCR API response
   * @param responseData - Raw response from Nanonets OCR API
   * @param outputType - The output type that was requested
   * @returns Extracted text content or empty string
   */
  private extractTextFromResponse(responseData: any, outputType: string): string {
    try {
      console.log('🔍 Extracting text from Nanonets response...');
      
      // Nanonets OCR API returns data in result array
      if (responseData.result && Array.isArray(responseData.result)) {
        let allText = '';
        
        for (const page of responseData.result) {
          if (page.prediction && Array.isArray(page.prediction)) {
            // Extract text from each prediction
            const pageText = page.prediction
              .map((pred: any) => {
                // Try different text fields that Nanonets might use
                return pred.ocr_text || pred.text || pred.label || '';
              })
              .filter((text: string) => text.trim())
              .join(' ');
            
            if (pageText) {
              allText += pageText + '\n';
            }
          }
        }
        
        if (allText.trim()) {
          console.log('✅ Extracted text length:', allText.length);
          return allText.trim();
        }
      }
      
      // Fallback: try other common fields
      if (responseData.text) {
        return responseData.text;
      }
      
      if (responseData.content) {
        return responseData.content;
      }
      
      if (responseData.extracted_text) {
        return responseData.extracted_text;
      }
      
      // If no text found, return structured data as JSON
      console.log('⚠️ No text found, returning structured data');
      return JSON.stringify(responseData, null, 2);
      
    } catch (error) {
      console.warn('⚠️ Failed to extract text from response:', error);
      return JSON.stringify(responseData, null, 2);
    }
  }

  /**
   * Get API status and validate configuration
   * @returns Status information
   */
  getStatus() {
    return {
      apiKeyConfigured: !!this.apiKey,
      apiEndpoint: this.baseUrl,
      ready: !!this.apiKey
    };
  }
}

// Export a singleton instance for convenience
export const nanonetsService = new NanonetsExtractionService();

// Export the class for custom instances
export default NanonetsExtractionService;