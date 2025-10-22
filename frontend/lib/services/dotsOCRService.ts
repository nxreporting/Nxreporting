/**
 * dots.ocr Service Integration
 * High-performance document layout parsing with unified OCR
 * 
 * Features:
 * - Layout detection + text extraction in one model
 * - Superior table and formula parsing
 * - Multilingual support (100+ languages)
 * - Structured JSON output with bounding boxes
 */

// ============================================================================
// INTERFACES
// ============================================================================

export interface DotsOCRConfig {
  baseUrl?: string;
  modelName?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface DotsOCRResponse {
  success: boolean;
  data?: any;
  extractedText?: string;
  structuredData?: any;
  layoutElements?: DotsOCRElement[];
  error?: string;
  provider: string;
  metadata?: {
    duration: number;
    fileSize: number;
    confidence?: number;
    pages?: number;
    elementsCount?: number;
  };
}

export interface DotsOCRElement {
  bbox: [number, number, number, number]; // [x1, y1, x2, y2]
  category: string; // Text, Table, Formula, Picture, etc.
  text?: string;
  confidence?: number;
}

export interface DotsOCRLayoutData {
  elements: DotsOCRElement[];
  page_width: number;
  page_height: number;
  reading_order: number[];
}

// ============================================================================
// DOTS OCR SERVICE CLASS
// ============================================================================

export class DotsOCRService {
  private config: DotsOCRConfig;
  private baseUrl: string;

  constructor(config: DotsOCRConfig = {}) {
    this.config = {
      baseUrl: 'http://localhost:8000',
      modelName: 'model',
      temperature: 0.1,
      maxTokens: 16384,
      ...config
    };
    this.baseUrl = this.config.baseUrl!;
  }

  /**
   * Check if service is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.warn('⚠️ dots.ocr server not available:', error);
      return false;
    }
  }

  /**
   * Extract data from PDF using dots.ocr
   */
  async extractFromBuffer(
    fileBuffer: Buffer,
    filename: string,
    options: {
      mode?: 'layout_all' | 'layout_only' | 'ocr_only' | 'grounding';
      bbox?: [number, number, number, number];
      language?: string;
    } = {}
  ): Promise<DotsOCRResponse> {
    console.log('🔧 dots.ocr: Starting document parsing...');
    const startTime = Date.now();

    try {
      // Check if server is available
      if (!(await this.isAvailable())) {
        throw new Error('dots.ocr server is not available. Please start the vLLM server.');
      }

      // Convert buffer to base64 image
      const base64Image = `data:application/pdf;base64,${fileBuffer.toString('base64')}`;
      
      // Select prompt based on mode
      const prompt = this.getPrompt(options.mode || 'layout_all', options.bbox);

      // Prepare API request
      const messages = [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: base64Image }
            },
            {
              type: 'text',
              text: `<|img|><|imgpad|><|endofimg|>${prompt}`
            }
          ]
        }
      ];

      console.log(`📡 dots.ocr: Calling API (mode: ${options.mode || 'layout_all'})...`);
      console.log(`📄 File: ${filename} (${(fileBuffer.length / 1024).toFixed(2)} KB)`);

      // Call dots.ocr API
      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer dummy' // dots.ocr doesn't require real auth
        },
        body: JSON.stringify({
          model: this.config.modelName,
          messages: messages,
          temperature: this.config.temperature,
          max_completion_tokens: this.config.maxTokens,
          top_p: 1.0
        })
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ dots.ocr: HTTP ${response.status} - ${errorText}`);
        throw new Error(`dots.ocr API error: ${response.status} - ${errorText}`);
      }

      const responseData = await response.json();
      const content = responseData.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No content returned from dots.ocr API');
      }

      // Process the response
      const processedResult = this.processDotsOCRResponse(content, options.mode || 'layout_all');

      console.log(`✅ dots.ocr: Success (${duration}ms)`);
      console.log(`📊 Extracted: ${processedResult.extractedText?.length || 0} chars, ${processedResult.layoutElements?.length || 0} elements`);

      return {
        success: true,
        data: responseData,
        extractedText: processedResult.extractedText,
        structuredData: processedResult.structuredData,
        layoutElements: processedResult.layoutElements,
        provider: 'dots.ocr',
        metadata: {
          duration,
          fileSize: fileBuffer.length,
          confidence: processedResult.confidence,
          pages: 1, // dots.ocr processes one page at a time
          elementsCount: processedResult.layoutElements?.length || 0
        }
      };

    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`❌ dots.ocr: Failed after ${duration}ms - ${error.message}`);
      throw error;
    }
  }

  /**
   * Get appropriate prompt for different modes
   */
  private getPrompt(mode: string, bbox?: [number, number, number, number]): string {
    const prompts = {
      layout_all: `Please output the layout information from the PDF image, including each layout element's bbox, its category, and the corresponding text content within the bbox.

1. Bbox format: [x1, y1, x2, y2]

2. Layout Categories: The possible categories are ['Caption', 'Footnote', 'Formula', 'List-item', 'Page-footer', 'Page-header', 'Picture', 'Section-header', 'Table', 'Text', 'Title'].

3. Text Extraction & Formatting Rules:
    - Picture: For the 'Picture' category, the text field should be omitted.
    - Formula: Format its text as LaTeX.
    - Table: Format its text as HTML.
    - All Others (Text, Title, etc.): Format their text as Markdown.

4. Constraints:
    - The output text must be the original text from the image, with no translation.
    - All layout elements must be sorted according to human reading order.

5. Final Output: The entire output must be a single JSON object.`,

      layout_only: `Please detect and output the layout information from the PDF image, including each layout element's bbox and its category, but without extracting the text content.

1. Bbox format: [x1, y1, x2, y2]
2. Layout Categories: ['Caption', 'Footnote', 'Formula', 'List-item', 'Page-footer', 'Page-header', 'Picture', 'Section-header', 'Table', 'Text', 'Title']
3. Sort elements by human reading order
4. Output as a single JSON object`,

      ocr_only: `Please extract all text content from the PDF image in reading order. Format the output as clean, structured text without layout information.`,

      grounding: bbox 
        ? `Please extract the text content from the specified region [${bbox.join(', ')}] in the PDF image.`
        : `Please extract text content from the PDF image.`
    };

    return prompts[mode as keyof typeof prompts] || prompts.layout_all;
  }

  /**
   * Process dots.ocr API response
   */
  private processDotsOCRResponse(content: string, mode: string): {
    extractedText: string;
    structuredData: any;
    layoutElements: DotsOCRElement[];
    confidence: number;
  } {
    let extractedText = '';
    let structuredData: any = {};
    let layoutElements: DotsOCRElement[] = [];
    let confidence = 0;

    try {
      if (mode === 'ocr_only') {
        // Simple text extraction
        extractedText = content.trim();
        structuredData = { text: extractedText };
        confidence = 90; // Assume high confidence for text-only
      } else {
        // Parse JSON response for layout modes
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const layoutData = JSON.parse(jsonMatch[0]);
          
          // Extract layout elements
          if (layoutData.elements || layoutData.layout_elements) {
            const elements = layoutData.elements || layoutData.layout_elements;
            
            layoutElements = elements.map((element: any) => ({
              bbox: element.bbox || element.bounding_box,
              category: element.category || element.type || 'Text',
              text: element.text || element.content || '',
              confidence: element.confidence || 0.9
            }));

            // Calculate average confidence
            const confidenceSum = layoutElements.reduce((sum, el) => sum + (el.confidence || 0), 0);
            confidence = confidenceSum / layoutElements.length;

            // Extract text in reading order
            extractedText = layoutElements
              .filter(el => el.text && el.text.trim())
              .map(el => el.text)
              .join('\n\n');

            // Create structured data for pharmaceutical reports
            structuredData = this.createStructuredData(layoutElements);
          }
        } else {
          // Fallback: treat as plain text
          extractedText = content.trim();
          structuredData = { text: extractedText };
          confidence = 70; // Lower confidence for fallback
        }
      }

      return {
        extractedText,
        structuredData,
        layoutElements,
        confidence
      };

    } catch (error) {
      console.warn('⚠️ dots.ocr: Error processing response, using fallback');
      return {
        extractedText: content.trim(),
        structuredData: { raw: content },
        layoutElements: [],
        confidence: 50
      };
    }
  }

  /**
   * Create structured data for pharmaceutical/business reports
   */
  private createStructuredData(elements: DotsOCRElement[]): any {
    const structured: any = {
      company: {},
      report: {},
      items: [],
      summary: {},
      layout: {
        elements: elements,
        categories: this.categorizeElements(elements)
      }
    };

    try {
      // Extract company information from title/header elements
      const titleElements = elements.filter(el => 
        el.category === 'Title' || el.category === 'Section-header'
      );
      
      for (const element of titleElements) {
        const text = element.text || '';
        const companyMatch = text.match(/(?:company|firm|medicines?|pharma|ltd|limited|inc|corp)[:\s]*([A-Z][A-Z\s&.]+)/i);
        if (companyMatch) {
          structured.company.name = companyMatch[1].trim();
          break;
        }
      }

      // Extract tables for item data
      const tableElements = elements.filter(el => el.category === 'Table');
      for (const table of tableElements) {
        const items = this.extractItemsFromTable(table.text || '');
        structured.items.push(...items);
      }

      // Extract summary from text elements
      const textElements = elements.filter(el => el.category === 'Text');
      for (const element of textElements) {
        const text = element.text || '';
        
        // Look for totals
        const totalMatch = text.match(/total[:\s]*([0-9,]+\.?[0-9]*)/i);
        if (totalMatch) {
          structured.summary.total = parseFloat(totalMatch[1].replace(/,/g, ''));
        }
      }

      return structured;

    } catch (error) {
      console.warn('⚠️ dots.ocr: Error creating structured data');
      return { elements, raw: true };
    }
  }

  /**
   * Categorize elements by type
   */
  private categorizeElements(elements: DotsOCRElement[]): Record<string, number> {
    const categories: Record<string, number> = {};
    
    for (const element of elements) {
      const category = element.category || 'Unknown';
      categories[category] = (categories[category] || 0) + 1;
    }
    
    return categories;
  }

  /**
   * Extract items from HTML table text
   */
  private extractItemsFromTable(tableHtml: string): any[] {
    const items: any[] = [];

    try {
      // Simple HTML table parsing
      const rows = tableHtml.match(/<tr[^>]*>(.*?)<\/tr>/gi) || [];
      
      if (rows.length < 2) return items; // Need at least header + data

      // Extract headers
      const headerRow = rows[0];
      const headers = (headerRow.match(/<t[hd][^>]*>(.*?)<\/t[hd]>/gi) || [])
        .map(cell => cell.replace(/<[^>]*>/g, '').trim().toLowerCase());

      // Process data rows
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const cells = (row.match(/<t[hd][^>]*>(.*?)<\/t[hd]>/gi) || [])
          .map(cell => cell.replace(/<[^>]*>/g, '').trim());

        if (cells.length === 0) continue;

        const item: any = {};
        
        for (let j = 0; j < Math.min(headers.length, cells.length); j++) {
          const header = headers[j];
          const value = cells[j];

          if (value.trim()) {
            // Map pharmaceutical report fields
            if (header.includes('name') || header.includes('item') || header.includes('product')) {
              item.name = value;
            } else if (header.includes('opening') || header.includes('stock')) {
              item.opening = this.parseNumber(value);
            } else if (header.includes('sales') || header.includes('sold')) {
              item.sales = this.parseNumber(value);
            } else if (header.includes('closing') || header.includes('balance')) {
              item.closing = this.parseNumber(value);
            } else if (header.includes('value') || header.includes('amount')) {
              if (header.includes('sales')) {
                item.salesValue = this.parseNumber(value);
              } else if (header.includes('closing')) {
                item.closingValue = this.parseNumber(value);
              }
            } else {
              item[header] = value;
            }
          }
        }

        if (Object.keys(item).length > 0) {
          items.push(item);
        }
      }

    } catch (error) {
      console.warn('⚠️ dots.ocr: Error extracting items from table');
    }

    return items;
  }

  /**
   * Parse numeric values from text
   */
  private parseNumber(text: string): number {
    if (!text) return 0;
    
    const cleaned = text.replace(/[^\d.,\-]/g, '');
    const number = parseFloat(cleaned.replace(/,/g, ''));
    return isNaN(number) ? 0 : number;
  }

  /**
   * Get service status
   */
  async getStatus() {
    const available = await this.isAvailable();
    
    return {
      available,
      baseUrl: this.baseUrl,
      modelName: this.config.modelName,
      configured: true
    };
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create dots.ocr service instance
 */
export function createDotsOCRService(config?: DotsOCRConfig): DotsOCRService {
  return new DotsOCRService({
    baseUrl: process.env.DOTS_OCR_BASE_URL || 'http://localhost:8000',
    modelName: process.env.DOTS_OCR_MODEL_NAME || 'model',
    ...config
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export default DotsOCRService;