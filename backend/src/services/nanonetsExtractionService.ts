import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

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
   * Extract data from PDF using Nanonets API
   * @param filePath - Path to the PDF file to extract
   * @param outputType - Type of output ('flat-json', 'markdown', 'json')
   * @returns Promise<NanonetsResponse>
   */
  async extractFromPDF(
    filePath: string, 
    outputType: 'flat-json' | 'markdown' | 'json' = 'flat-json'
  ): Promise<NanonetsResponse> {
    try {
      console.log('🔬 Starting Nanonets PDF extraction...');
      console.log(`📄 File: ${filePath}`);
      console.log(`📊 Output type: ${outputType}`);

      // Validate API key
      if (!this.apiKey) {
        return {
          success: false,
          error: 'Nanonets API key not configured'
        };
      }

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          error: `File not found: ${filePath}`
        };
      }

      // Check file size (Nanonets has size limits)
      const stats = fs.statSync(filePath);
      const fileSizeMB = stats.size / (1024 * 1024);
      console.log(`📏 File size: ${fileSizeMB.toFixed(2)} MB`);

      if (fileSizeMB > 50) { // 50MB limit for most APIs
        return {
          success: false,
          error: `File too large: ${fileSizeMB.toFixed(2)}MB. Maximum size is 50MB.`
        };
      }

      // Prepare form data for API request
      const formData = new FormData();
      formData.append('file', fs.createReadStream(filePath));
      formData.append('output_type', outputType);

      const headers = {
        'Authorization': `Bearer ${this.apiKey}`,
        ...formData.getHeaders()
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
   * Extract from file buffer (useful for uploaded files)
   * @param fileBuffer - File buffer
   * @param filename - Original filename
   * @param outputType - Output type
   * @returns Promise<NanonetsResponse>
   */
  async extractFromBuffer(
    fileBuffer: Buffer,
    filename: string,
    outputType: 'flat-json' | 'markdown' | 'json' = 'flat-json'
  ): Promise<NanonetsResponse> {
    try {
      console.log('🔬 Starting Nanonets buffer extraction...');
      console.log(`📄 Filename: ${filename}`);
      console.log(`📊 Buffer size: ${(fileBuffer.length / 1024).toFixed(2)} KB`);

      // Validate API key
      if (!this.apiKey) {
        return {
          success: false,
          error: 'Nanonets API key not configured'
        };
      }

      // Check buffer size
      const fileSizeMB = fileBuffer.length / (1024 * 1024);
      if (fileSizeMB > 50) {
        return {
          success: false,
          error: `File too large: ${fileSizeMB.toFixed(2)}MB. Maximum size is 50MB.`
        };
      }

      // Prepare form data
      const formData = new FormData();
      formData.append('file', fileBuffer, {
        filename: filename,
        contentType: 'application/pdf'
      });
      formData.append('output_type', outputType);

      const headers = {
        'Authorization': `Bearer ${this.apiKey}`,
        ...formData.getHeaders()
      };

      console.log('📡 Sending buffer to Nanonets API...');

      // Make API request
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: headers,
        body: formData
      });

      console.log(`📬 Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Nanonets API error:', errorText);
        
        return {
          success: false,
          error: `Nanonets API error (${response.status}): ${errorText}`
        };
      }

      const responseData = await response.json();
      console.log('✅ Nanonets buffer extraction successful');
      
      return {
        success: true,
        data: responseData,
        extractedText: this.extractTextFromResponse(responseData, outputType),
        rawResponse: responseData
      };

    } catch (error: any) {
      console.error('❌ Nanonets buffer extraction failed:', error);
      
      return {
        success: false,
        error: `Buffer extraction failed: ${error.message}`
      };
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