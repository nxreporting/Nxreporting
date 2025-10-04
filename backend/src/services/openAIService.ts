import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize OpenAI client only if API key is available
let openai: OpenAI | null = null;

try {
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
} catch (error) {
  console.log('⚠️ OpenAI initialization skipped:', error instanceof Error ? error.message : 'Unknown error');
  openai = null;
}

// Interface for structured pharma stock data
export interface PharmaStockData {
  itemName: string;
  openingQty: number | null;
  purchaseQty: number | null;
  purchaseFree: number | null;
  salesQty: number | null;
  salesValue: number | null;
  closingQty: number | null;
  closingValue: number | null;
}

export interface StructuredPharmaResponse {
  success: boolean;
  data?: PharmaStockData[];
  error?: string;
}

/**
 * Extract pharmaceutical data using OpenAI GPT models
 */
export async function extractPharmaDataWithOpenAI(pdfText: string): Promise<StructuredPharmaResponse> {
  try {
    console.log('🤖 Starting OpenAI pharmaceutical data extraction...');
    console.log(`📜 PDF text length: ${pdfText.length} characters`);

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      console.log('⚠️ No OpenAI API key found, skipping OpenAI extraction');
      return { success: false, error: 'No OpenAI API key available' };
    }

    // Prepare optimized prompt for pharmaceutical data extraction
    const prompt = `You are a pharmaceutical data extraction expert. Extract ONLY the pharmaceutical inventory data from the following text and return it as a JSON array.

IMPORTANT INSTRUCTIONS:
1. Look for tabular data with medicine/drug names and quantities
2. Extract data in this exact JSON format:
[
  {
    "itemName": "MEDICINE_NAME",
    "openingQty": 10,
    "purchaseQty": 5,
    "purchaseFree": 0,
    "salesQty": 8,
    "salesValue": 1200.50,
    "closingQty": 7,
    "closingValue": 900.25
  }
]

3. Use integers for quantities, decimals for monetary values
4. Use null for missing data
5. Only extract actual medicine/drug names from inventory/stock data
6. Return ONLY the JSON array, no explanations or additional text

Text to analyze:
${pdfText.substring(0, 3000)}`;

    // Check if OpenAI is available
    if (!openai) {
      console.log('⚠️ OpenAI client not initialized, skipping OpenAI extraction');
      return { success: false, error: 'OpenAI client not available' };
    }

    console.log('📡 Calling OpenAI API...');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a pharmaceutical data extraction expert. Extract structured inventory data and return only valid JSON arrays."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.1
    });

    const response = completion.choices[0]?.message?.content;
    
    if (response) {
      console.log('✅ OpenAI responded successfully');
      console.log('Response preview:', response.substring(0, 300) + '...');
      
      try {
        // Parse the JSON response
        const parsedResponse = JSON.parse(response);
        
        // Handle both direct array and object with array property
        let extractedData = parsedResponse;
        if (parsedResponse.data && Array.isArray(parsedResponse.data)) {
          extractedData = parsedResponse.data;
        } else if (parsedResponse.items && Array.isArray(parsedResponse.items)) {
          extractedData = parsedResponse.items;
        } else if (!Array.isArray(parsedResponse)) {
          // If response is an object, try to find the array
          const arrayKey = Object.keys(parsedResponse).find(key => Array.isArray(parsedResponse[key]));
          if (arrayKey) {
            extractedData = parsedResponse[arrayKey];
          } else {
            throw new Error('No array found in OpenAI response');
          }
        }
        
        // Validate and structure the data
        const validatedData = validatePharmaData(extractedData);
        
        if (validatedData.length > 0) {
          console.log(`🎉 OpenAI extraction successful! Found ${validatedData.length} pharmaceutical items`);
          return {
            success: true,
            data: validatedData
          };
        } else {
          console.log('⚠️ OpenAI response contained no valid pharmaceutical data');
          return {
            success: false,
            error: 'No valid pharmaceutical data found in OpenAI response'
          };
        }
        
      } catch (parseError) {
        console.error('❌ Failed to parse OpenAI response:', parseError);
        console.log('Raw response:', response);
        return {
          success: false,
          error: 'Failed to parse OpenAI response as JSON'
        };
      }
    } else {
      console.log('❌ OpenAI returned empty response');
      return {
        success: false,
        error: 'OpenAI returned empty response'
      };
    }

  } catch (error: any) {
    console.error('❌ OpenAI extraction error:', error);
    
    if (error.code === 'insufficient_quota') {
      return {
        success: false,
        error: 'OpenAI API quota exceeded. Please check your billing settings.'
      };
    } else if (error.code === 'invalid_api_key') {
      return {
        success: false,
        error: 'Invalid OpenAI API key. Please check your configuration.'
      };
    } else {
      return {
        success: false,
        error: `OpenAI API error: ${error.message}`
      };
    }
  }
}

/**
 * Validate and sanitize pharma data structure
 */
function validatePharmaData(data: any): PharmaStockData[] {
  if (!Array.isArray(data)) {
    // If it's a single object, wrap it in an array
    data = [data];
  }

  return data
    .filter((item: any) => item && typeof item === 'object')
    .map((item: any): PharmaStockData => ({
      itemName: String(item.itemName || item.name || item.item || 'Unknown Item'),
      openingQty: parseNumberOrNull(item.openingQty || item.opening_qty || item.openingQuantity),
      purchaseQty: parseNumberOrNull(item.purchaseQty || item.purchase_qty || item.purchaseQuantity),
      purchaseFree: parseNumberOrNull(item.purchaseFree || item.purchase_free || item.freeQuantity),
      salesQty: parseNumberOrNull(item.salesQty || item.sales_qty || item.salesQuantity),
      salesValue: parseNumberOrNull(item.salesValue || item.sales_value || item.salesAmount),
      closingQty: parseNumberOrNull(item.closingQty || item.closing_qty || item.closingQuantity),
      closingValue: parseNumberOrNull(item.closingValue || item.closing_value || item.closingAmount),
    }))
    .filter((item: PharmaStockData) => item.itemName && item.itemName !== 'Unknown Item');
}

/**
 * Parse string/number to number or return null
 */
function parseNumberOrNull(value: any): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    return isNaN(value) ? null : value;
  }

  if (typeof value === 'string') {
    // Remove currency symbols and commas
    const cleaned = value.replace(/[₹$,\s]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  }

  return null;
}