// Note: Using browser FormData API for serverless compatibility

// Interface for Nanonets API response
export interface NanonetsResponse {
  success: boolean;
  data?: any;
  error?: string;
  extractedText?: string;
  rawResponse?: any;
}

/**
 * Service class for Nanonets PDF extraction API
 * Handles file uploads and extraction using the Nanonets API
 * Optimized for serverless environments with cloud storage support
 */
export class NanonetsExtractionService {
  private apiKey: string;
  private baseUrl: string = 'https://extraction-api.nanonets.com/extract';

  constructor() {
    this.apiKey = process.env.NANONETS_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('⚠️ NANONETS_API_KEY not found in environment variables');
    }
  }

  /**
   * Extract data from PDF using Nanonets API with Buffer support for serverless
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
      console.log('🔬 Starting Nanonets PDF extraction from buffer...');
      console.log(`📄 File: ${filename}`);
      console.log(`📊 Output type: ${outputType}`);

      // Validate API key
      if (!this.apiKey) {
        return {
          success: false,
          error: 'Nanonets API key not configured'
        };
      }

      // Check file size (Nanonets has size limits)
      const fileSizeMB = fileBuffer.length / (1024 * 1024);
      console.log(`📏 File size: ${fileSizeMB.toFixed(2)} MB`);

      if (fileSizeMB > 50) { // 50MB limit for most APIs
        return {
          success: false,
          error: `File too large: ${fileSizeMB.toFixed(2)}MB. Maximum size is 50MB.`
        };
      }

      // Prepare form data for API request using FormData for serverless
      const formData = new FormData();
      
      // Create a Blob from the buffer for FormData (convert Buffer to Uint8Array)
      const uint8Array = new Uint8Array(fileBuffer);
      const blob = new Blob([uint8Array], { type: 'application/pdf' });
      formData.append('file', blob, filename);
      formData.append('output_type', outputType);

      const headers = {
        'Authorization': `Bearer ${this.apiKey}`,
      };

      console.log('📡 Sending request to Nanonets API...');

      // Make API request
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: headers,
        body: formData
      });

      console.log(`📬 Response status: ${response.status} ${response.statusText}`);

      // Handle non-200 responses
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Nanonets API error:', errorText);
        
        return {
          success: false,
          error: `Nanonets API error (${response.status}): ${errorText}`,
          rawResponse: {
            status: response.status,
            statusText: response.statusText,
            body: errorText
          }
        };
      }

      // Parse response
      const responseData = await response.json();
      console.log('✅ Nanonets API responded successfully');
      
      // Log response structure for debugging
      console.log('📋 Response keys:', Object.keys(responseData));
      
      return {
        success: true,
        data: responseData,
        extractedText: this.extractTextFromResponse(responseData, outputType),
        rawResponse: responseData
      };

    } catch (error: any) {
      console.error('❌ Nanonets extraction failed:', error);
      
      return {
        success: false,
        error: `Extraction failed: ${error.message}`,
        rawResponse: error
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
   * Extract text content from Nanonets API response
   * @param responseData - Raw response from Nanonets API
   * @param outputType - The output type that was requested
   * @returns Extracted text content or empty string
   */
  private extractTextFromResponse(responseData: any, outputType: string): string {
    try {
      // Handle different response formats based on output type
      if (outputType === 'markdown') {
        return responseData.markdown || responseData.text || '';
      }
      
      if (outputType === 'flat-json' || outputType === 'json') {
        // For JSON responses, try to extract text from various fields
        if (responseData.text) {
          return responseData.text;
        }
        
        if (responseData.content) {
          return responseData.content;
        }
        
        if (responseData.extracted_text) {
          return responseData.extracted_text;
        }
        
        // If it's structured data, stringify it
        if (typeof responseData === 'object') {
          return JSON.stringify(responseData, null, 2);
        }
      }
      
      return '';
    } catch (error) {
      console.warn('⚠️ Failed to extract text from response:', error);
      return '';
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