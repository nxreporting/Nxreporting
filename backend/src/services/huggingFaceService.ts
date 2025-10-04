import { HfInference } from '@huggingface/inference';
import dotenv from 'dotenv';
import { extractPharmaDataWithOpenAI } from './openAIService';
import { extractPharmaDataWithNanonets } from './nanonetsService';

dotenv.config();

// Initialize Hugging Face client
const hf = new HfInference(process.env.HUGGINGFACE_API_TOKEN);

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
 * Extract structured pharma stock data from PDF using multi-AI approach + enhanced pattern matching
 */
export async function extractPharmaDataWithAI(pdfText: string, filePath?: string): Promise<StructuredPharmaResponse> {
  try {
    console.log('🏥 Starting multi-AI pharmaceutical data extraction...');
    console.log(`📜 PDF text length: ${pdfText.length} characters`);

    // Primary method: DocStrange PDF extraction (specialized document processing)
    if (filePath) {
      console.log('🔬 Trying DocStrange PDF extraction...');
      const nanonetsResult = await extractPharmaDataWithNanonets(filePath);
      
      if (nanonetsResult.success && nanonetsResult.data && nanonetsResult.data.length > 0) {
        console.log(`✅ DocStrange extraction successful! Found ${nanonetsResult.data.length} pharmaceutical items`);
        console.log('📋 Extracted items:', nanonetsResult.data.map((item: PharmaStockData) => `${item.itemName} (Qty: ${item.closingQty})`).join(', '));
        return nanonetsResult;
      }
      console.log('⚠️ DocStrange extraction failed/unavailable, trying other methods...');
    }

    // Secondary method: OpenAI GPT for text-based extraction
    console.log('🤖 Trying OpenAI GPT for pharmaceutical data extraction...');
    const openAIResult = await extractPharmaDataWithOpenAI(pdfText);
    
    if (openAIResult.success && openAIResult.data && openAIResult.data.length > 0) {
      console.log(`✅ OpenAI extraction successful! Found ${openAIResult.data.length} pharmaceutical items`);
      console.log('📋 Extracted items:', openAIResult.data.map((item: PharmaStockData) => `${item.itemName} (Qty: ${item.closingQty})`).join(', '));
      return openAIResult;
    }

    console.log('⚠️ AI extraction methods failed/unavailable, trying enhanced pattern extraction...');
    
    // Tertiary method: Enhanced pattern-based extraction
    const patternResult = extractPharmaDataWithPatterns(pdfText);
    
    if (patternResult.success && patternResult.data && patternResult.data.length > 0) {
      console.log(`✅ Enhanced pattern extraction successful! Found ${patternResult.data.length} pharmaceutical items`);
      return patternResult;
    }

    // Quaternary method: Advanced pattern extraction for different formats
    const advancedResult = extractAdvancedPharmaData(pdfText);
    
    if (advancedResult.success && advancedResult.data && advancedResult.data.length > 0) {
      console.log(`✅ Advanced extraction found ${advancedResult.data.length} items`);
      return advancedResult;
    }
    
    // Final fallback: Simplified pattern extraction
    const fallbackResult = extractSimplifiedPharmaData(pdfText);
    
    if (fallbackResult.success && fallbackResult.data && fallbackResult.data.length > 0) {
      console.log(`✅ Fallback extraction found ${fallbackResult.data.length} items`);
      return fallbackResult;
    }
    
    // Final response for PDFs that don't match pharmaceutical formats
    return {
      success: false,
      error: 'No pharmaceutical stock data detected. Please ensure this is a valid pharmaceutical inventory/stock report with tabular data.'
    };

  } catch (error) {
    console.error('❌ Extraction error:', error);
    
    // Emergency fallback to pattern extraction
    const patternResult = extractPharmaDataWithPatterns(pdfText);
    if (patternResult.success && patternResult.data && patternResult.data.length > 0) {
      console.log('✅ Using pattern extraction as emergency fallback');
      return patternResult;
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown extraction error'
    };
  }
}

/**
 * Try Kimi K2 AI extraction (free model for better pharmaceutical data extraction)
 */
async function tryKimiK2Extraction(pdfText: string): Promise<StructuredPharmaResponse> {
  try {
    // Only proceed if we have an API token
    if (!process.env.HUGGINGFACE_API_TOKEN || process.env.HUGGINGFACE_API_TOKEN === 'your_huggingface_token_here') {
      console.log('⚠️ No valid AI API token, skipping Kimi K2 extraction');
      return { success: false, error: 'No AI token available' };
    }

    // Prepare optimized prompt for pharmaceutical data with Kimi K2
    const optimizedPrompt = `You are a pharmaceutical data extraction expert. Extract ONLY the pharmaceutical inventory data from this text and return a JSON array.

Required JSON format:
[{"itemName": "MEDICINE_NAME", "openingQty": 10, "purchaseQty": 5, "purchaseFree": 0, "salesQty": 8, "salesValue": 1200.50, "closingQty": 7, "closingValue": 900.25}]

Rules:
1. Extract only actual medicine/drug names from tabular data
2. Use integers for quantities, decimals for monetary values
3. Use null for missing data
4. Return ONLY the JSON array, no explanations
5. Focus on pharmaceutical inventory/stock data

Text to analyze:
${pdfText.substring(0, 2000)}`;

    console.log('🤖 Trying Kimi K2 model: moonshotai/Kimi-K2-Instruct-0905');
    
    // Kimi K2 uses conversational format, not text generation
    const messages = [
      {
        role: 'user',
        content: optimizedPrompt
      }
    ];
    
    const response = await hf.request({
      model: 'moonshotai/Kimi-K2-Instruct-0905',
      task: 'conversational',
      inputs: {
        past_user_inputs: [],
        generated_responses: [],
        text: optimizedPrompt
      },
      parameters: {
        max_length: 1000,
        temperature: 0.1
      }
    }) as any;
    
    if (response && response.generated_text) {
      console.log('✅ Kimi K2 model responded successfully');
      console.log('Response preview:', response.generated_text.substring(0, 300) + '...');
      
      // Try to extract JSON from response
      const jsonMatch = extractJSONFromResponse(response.generated_text);
      if (jsonMatch) {
        try {
          const extractedData = JSON.parse(jsonMatch);
          const validatedData = validatePharmaData(extractedData);
          
          if (validatedData.length > 0) {
            console.log(`✅ Kimi K2 extraction successful! Found ${validatedData.length} pharmaceutical items`);
            return {
              success: true,
              data: validatedData
            };
          } else {
            console.log('⚠️ Kimi K2 response contained no valid pharmaceutical data');
          }
        } catch (parseError) {
          console.log('❌ JSON parsing failed for Kimi K2 response:', parseError);
          console.log('Raw response:', response.generated_text);
        }
      } else {
        console.log('❌ No JSON found in Kimi K2 response');
        console.log('Raw response:', response.generated_text.substring(0, 500));
      }
    } else {
      console.log('❌ Kimi K2 model returned no response');
    }
    
    return {
      success: false,
      error: 'Kimi K2 model extraction failed'
    };

  } catch (error: any) {
    console.log('❌ Kimi K2 extraction failed:', error.message);
    if (error.message.includes('No Inference Provider')) {
      console.log('💡 Tip: Kimi K2 model might not be available or requires specific configuration');
    }
    return {
      success: false,
      error: 'Kimi K2 model not available'
    };
  }
}

/**
 * Try AI extraction (optional - requires paid HuggingFace account)
 */
async function tryAIExtraction(pdfText: string): Promise<StructuredPharmaResponse> {
  try {
    // Only proceed if we have an API token
    if (!process.env.HUGGINGFACE_API_TOKEN || process.env.HUGGINGFACE_API_TOKEN === 'your_huggingface_token_here') {
      console.log('⚠️ No valid AI API token, skipping AI extraction');
      return { success: false, error: 'No AI token available' };
    }

    // Prepare optimized prompt for pharmaceutical data
    const optimizedPrompt = `Extract pharmaceutical inventory data from this text and return ONLY a JSON array.

Format required:
[{"itemName": "medicine_name", "openingQty": 20, "purchaseQty": 10, "salesQty": 15, "salesValue": 1500, "closingQty": 15, "closingValue": 1200}]

Rules:
- Only extract actual medicine/drug names
- Use integers for quantities, decimals for values
- Use null for missing data

Text: ${pdfText.substring(0, 1500)}`;

    // Try the best available free models for pharmaceutical extraction
    const aiModels = [
      { name: 'meta-llama/Llama-3.1-8B-Instruct', params: { max_new_tokens: 800, temperature: 0.1 } },
      { name: 'google/gemma-3-270m', params: { max_new_tokens: 600, temperature: 0.1 } },
      { name: 'Qwen/Qwen3-Next-80B-A3B-Instruct', params: { max_new_tokens: 1000, temperature: 0.1 } },
      { name: 'unsloth/Qwen3-Next-80B-A3B-Instruct', params: { max_new_tokens: 800, temperature: 0.1 } },
      { name: 'openai-community/gpt2', params: { max_new_tokens: 200, temperature: 0.1 } }
    ];

    for (const model of aiModels) {
      try {
        console.log(`🤖 Trying AI model: ${model.name}`);
        
        const response = await hf.textGeneration({
          model: model.name,
          inputs: optimizedPrompt,
          parameters: model.params
        });
        
        if (response && response.generated_text) {
          console.log(`✅ Model ${model.name} responded`);
          
          // Try to extract JSON from response
          const jsonMatch = extractJSONFromResponse(response.generated_text);
          if (jsonMatch) {
            try {
              const extractedData = JSON.parse(jsonMatch);
              const validatedData = validatePharmaData(extractedData);
              
              if (validatedData.length > 0) {
                console.log(`✅ AI extraction successful with model ${model.name}! Found ${validatedData.length} items`);
                return {
                  success: true,
                  data: validatedData
                };
              }
            } catch (parseError) {
              console.log(`❌ JSON parsing failed for ${model.name}:`, parseError);
            }
          }
        }
      } catch (error: any) {
        console.log(`❌ Model ${model.name} failed:`, error.message);
        if (error.message.includes('No Inference Provider')) {
          console.log('💡 Tip: This model requires a paid HuggingFace Pro account for inference');
        }
        continue;
      }
    }
    
    return {
      success: false,
      error: 'AI models not available with free account'
    };

  } catch (error) {
    console.log('❌ AI extraction completely failed:', error);
    return {
      success: false,
      error: 'AI extraction failed'
    };
  }
}

/**
 * Advanced pharmaceutical data extraction for better accuracy
 */
function extractAdvancedPharmaData(text: string): StructuredPharmaResponse {
  try {
    console.log('🔍 Starting advanced pharmaceutical data extraction...');
    
    const data: PharmaStockData[] = [];
    const lines = text.split('\n');
    
    // Enhanced patterns for various pharmaceutical report formats
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines, headers, and too short lines
      if (!line || line.length < 5 || /^(ITEM|NAME|MEDICINE|DRUG|S\.?NO|SR\.?NO)/i.test(line)) continue;
      
      console.log(`Processing line ${i}: ${line}`);
      
      // Pattern 1: Enhanced tabular format with better medicine name detection
      // Example: "PARACETAMOL 500MG TAB 40 8 0 60 4881.60 12 0 0 0.00"
      const enhancedPattern = /^([A-Z][A-Z\s\d\-\.\/\(\)]{3,40})\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+([\d\.]+)\s+(\d+)/;
      const enhancedMatch = line.match(enhancedPattern);
      
      if (enhancedMatch) {
        const itemName = enhancedMatch[1].trim();
        const numbers = enhancedMatch.slice(2).map(n => parseFloat(n));
        
        console.log(`Found enhanced pattern: ${itemName} with ${numbers.length} numbers`);
        
        // Validate medicine name (should contain letters and be reasonable length)
        if (itemName.length > 2 && itemName.length < 50 && /[A-Z]/.test(itemName) && numbers.length >= 6) {
          data.push({
            itemName: itemName,
            openingQty: Math.round(numbers[0]) || null,
            purchaseQty: Math.round(numbers[1]) || null,
            purchaseFree: Math.round(numbers[2]) || null,
            salesQty: Math.round(numbers[3]) || null,
            salesValue: numbers[5] || null,
            closingQty: Math.round(numbers[6]) || null,
            closingValue: numbers[7] || null
          });
        }
        continue;
      }
      
      // Pattern 2: Alternative format with different spacing
      // Example: "AMOXICILLIN CAP\t\t75\t\t25\t\t5\t\t40\t\t2400.00\t\t65\t\t3900.00"
      const tabPattern = /^([A-Z][A-Z\s\d\-\.\/\(\)]{3,40})\s{2,}([\d\s\.]+)$/;
      const tabMatch = line.match(tabPattern);
      
      if (tabMatch) {
        const itemName = tabMatch[1].trim();
        const numbersPart = tabMatch[2];
        const numbers = numbersPart.match(/\d+(\.\d+)?/g)?.map(n => parseFloat(n)) || [];
        
        console.log(`Found tab pattern: ${itemName} with numbers: ${numbers}`);
        
        if (itemName.length > 2 && itemName.length < 50 && numbers.length >= 4) {
          data.push({
            itemName: itemName,
            openingQty: Math.round(numbers[0]) || null,
            purchaseQty: Math.round(numbers[1]) || null,
            purchaseFree: Math.round(numbers[2]) || null,
            salesQty: Math.round(numbers[3]) || null,
            salesValue: numbers[4] || null,
            closingQty: Math.round(numbers[5]) || null,
            closingValue: numbers[6] || null
          });
        }
        continue;
      }
      
      // Pattern 3: Space-separated with potential medicine names
      // Example: "CETIRIZINE 10MG 50 30 0 35 1750.00 45 2250.00"
      const spacePattern = /^([A-Z][A-Z\s\d\-\.\/\(\)]{3,30})\s+([\d\s\.]+)$/;
      const spaceMatch = line.match(spacePattern);
      
      if (spaceMatch) {
        const itemName = spaceMatch[1].trim();
        const numbersPart = spaceMatch[2];
        const numbers = numbersPart.match(/\d+(\.\d+)?/g)?.map(n => parseFloat(n)) || [];
        
        // More strict validation for space-separated format
        if (itemName.length > 3 && itemName.length < 40 && 
            /^[A-Z]/.test(itemName) && 
            !/^\d+$/.test(itemName) && 
            numbers.length >= 5) {
          
          console.log(`Found space pattern: ${itemName} with numbers: ${numbers}`);
          
          data.push({
            itemName: itemName,
            openingQty: Math.round(numbers[0]) || null,
            purchaseQty: Math.round(numbers[1]) || null,
            purchaseFree: Math.round(numbers[2] || 0) || null,
            salesQty: Math.round(numbers[3]) || null,
            salesValue: numbers[4] || null,
            closingQty: Math.round(numbers[5]) || null,
            closingValue: numbers[6] || null
          });
        }
      }
    }
    
    // Remove duplicates and validate
    const uniqueData = data.filter((item: PharmaStockData, index: number, self: PharmaStockData[]) => 
      index === self.findIndex(t => t.itemName === item.itemName)
    ).slice(0, 50); // Limit to 50 items max
    
    console.log(`📋 Advanced extraction completed. Found ${uniqueData.length} unique pharmaceutical items`);
    
    return {
      success: uniqueData.length > 0,
      data: uniqueData
    };
  } catch (error) {
    console.error('Advanced extraction error:', error);
    return {
      success: false,
      error: 'Advanced extraction failed'
    };
  }
}

/**
 * Simplified pharmaceutical data extraction for edge cases
 */
function extractSimplifiedPharmaData(text: string): StructuredPharmaResponse {
  try {
    console.log('🔍 Starting simplified pharmaceutical data extraction...');
    
    const data: PharmaStockData[] = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Look for any line with a potential medicine name and numbers
      if (trimmed.length > 5 && /^[A-Z]/.test(trimmed) && /\d/.test(trimmed)) {
        const words = trimmed.split(/\s+/);
        const itemName = words[0];
        const numbers = trimmed.match(/\d+(\.\d+)?/g)?.map(n => parseFloat(n)) || [];
        
        if (itemName.length > 2 && numbers.length >= 2) {
          data.push({
            itemName: itemName,
            openingQty: Math.round(numbers[0]) || null,
            purchaseQty: Math.round(numbers[1]) || null,
            purchaseFree: null,
            salesQty: Math.round(numbers[2]) || null,
            salesValue: numbers[3] || null,
            closingQty: Math.round(numbers[4]) || null,
            closingValue: numbers[5] || null
          });
        }
      }
    }
    
    const cleanedData = data.filter((item: PharmaStockData, index: number, self: PharmaStockData[]) => 
      index === self.findIndex(t => t.itemName === item.itemName)
    ).slice(0, 20); // Limit to 20 items
    
    return {
      success: cleanedData.length > 0,
      data: cleanedData
    };
  } catch (error) {
    return {
      success: false,
      error: 'Simplified extraction failed'
    };
  }
}

/**
 * Extract JSON array from AI response text
 */
function extractJSONFromResponse(text: string): string | null {
  try {
    // Look for JSON array patterns
    const jsonPatterns = [
      /\[[\s\S]*?\]/,  // Find array pattern
      /\{[\s\S]*?\}/, // Find object pattern (in case it's a single object)
    ];

    for (const pattern of jsonPatterns) {
      const match = text.match(pattern);
      if (match) {
        // Try to parse to validate
        JSON.parse(match[0]);
        return match[0];
      }
    }

    // If no pattern matches, try to find JSON between common delimiters
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('[') || line.startsWith('{')) {
        // Try to find the end of JSON
        let jsonText = '';
        let bracketCount = 0;
        let inString = false;
        let escaped = false;

        for (let j = i; j < lines.length; j++) {
          const currentLine = lines[j];
          for (const char of currentLine) {
            jsonText += char;
            
            if (escaped) {
              escaped = false;
              continue;
            }
            
            if (char === '\\') {
              escaped = true;
              continue;
            }
            
            if (char === '"') {
              inString = !inString;
              continue;
            }
            
            if (!inString) {
              if (char === '[' || char === '{') bracketCount++;
              if (char === ']' || char === '}') bracketCount--;
              
              if (bracketCount === 0 && (char === ']' || char === '}')) {
                try {
                  JSON.parse(jsonText);
                  return jsonText;
                } catch {
                  // Continue looking
                }
              }
            }
          }
          jsonText += '\n';
        }
      }
    }

    return null;
  } catch (error) {
    console.error('JSON extraction error:', error);
    return null;
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

/**
 * Fallback pattern-based extraction for pharmaceutical data
 */
function extractPharmaDataWithPatterns(text: string): StructuredPharmaResponse {
  try {
    console.log('🔍 Starting enhanced pattern-based pharmaceutical data extraction...');
    console.log(`Text preview: ${text.substring(0, 200)}...`);
    
    const data: PharmaStockData[] = [];
    const lines = text.split('\n');
    
    // Enhanced patterns for different pharmaceutical report formats
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines and too short lines
      if (!line || line.length < 5) continue;
      
      console.log(`Processing line ${i}: ${line}`);
      
      // Pattern 1: Standard tabular format with clear columns
      // Example: "ACKNOTIN 20 40 8 0 60 4881.60 12 0 0 0.00"
      const standardPattern = /^([A-Z][A-Z\s\d\-\.]{2,25})\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+([\d\.]+)\s+(\d+)/;
      const standardMatch = line.match(standardPattern);
      
      if (standardMatch) {
        const itemName = standardMatch[1].trim();
        const numbers = standardMatch.slice(2).map(n => parseFloat(n));
        
        console.log(`Found standard pattern: ${itemName} with ${numbers.length} numbers`);
        
        if (itemName.length > 2 && numbers.length >= 6) {
          data.push({
            itemName: itemName,
            openingQty: Math.round(numbers[0]) || null,
            purchaseQty: Math.round(numbers[1]) || null,
            purchaseFree: Math.round(numbers[2]) || null,
            salesQty: Math.round(numbers[4]) || null,
            salesValue: numbers[5] || null,
            closingQty: Math.round(numbers[6]) || null,
            closingValue: numbers[7] || null
          });
        }
        continue;
      }
      
      // Pattern 2: Medicine name with scattered numbers
      // Example: "BECOCNX 60K TAB 50 50 10 0 60 4242.60 12 0 40 2828.40"
      const medicinePattern = /^([A-Z][A-Z\s\d\-\.]{3,30})\s+(.+)$/;
      const medicineMatch = line.match(medicinePattern);
      
      if (medicineMatch) {
        const potentialName = medicineMatch[1].trim();
        const numbersPart = medicineMatch[2];
        
        // Extract all numbers from the line
        const allNumbers = numbersPart.match(/\b\d+(\.\d+)?\b/g)?.map(n => parseFloat(n)) || [];
        
        // Filter reasonable numbers for pharmaceutical data
        const quantities = allNumbers.filter(n => n >= 0 && n <= 10000 && Number.isInteger(n));
        const values = allNumbers.filter(n => n > 0 && (n > 1000 || n.toString().includes('.')));
        
        console.log(`Found medicine pattern: ${potentialName}, quantities: ${quantities}, values: ${values}`);
        
        if (potentialName.length > 2 && quantities.length >= 4) {
          data.push({
            itemName: potentialName,
            openingQty: quantities[0] || null,
            purchaseQty: quantities[1] || null,
            purchaseFree: quantities[2] || null,
            salesQty: quantities[3] || null,
            salesValue: values[0] || null,
            closingQty: quantities[4] || null,
            closingValue: values[1] || null
          });
        }
        continue;
      }
      
      // Pattern 3: Simple format - just medicine name followed by numbers
      // Example: "CNX PLUS 100 50 75 1500 75"
      const simplePattern = /^([A-Z][A-Z\s]{2,20})\s+(\d+(?:\s+\d+){3,})$/;
      const simpleMatch = line.match(simplePattern);
      
      if (simpleMatch) {
        const itemName = simpleMatch[1].trim();
        const numbers = simpleMatch[2].split(/\s+/).map(n => parseInt(n)).filter(n => !isNaN(n));
        
        console.log(`Found simple pattern: ${itemName} with numbers: ${numbers}`);
        
        if (itemName.length > 2 && numbers.length >= 4) {
          data.push({
            itemName: itemName,
            openingQty: numbers[0] || null,
            purchaseQty: numbers[1] || null,
            purchaseFree: null,
            salesQty: numbers[2] || null,
            salesValue: numbers[3] || null,
            closingQty: numbers[4] || null,
            closingValue: numbers[5] || null
          });
        }
        continue;
      }
      
      // Pattern 4: Any line starting with capital letters that has multiple numbers
      if (/^[A-Z]/.test(line) && (line.match(/\d+/g) || []).length >= 3) {
        const words = line.split(/\s+/);
        const itemName = words[0];
        const numbers = line.match(/\d+(\.\d+)?/g)?.map(n => parseFloat(n)) || [];
        
        if (itemName.length > 2 && numbers.length >= 3) {
          console.log(`Found fallback pattern: ${itemName} with ${numbers.length} numbers`);
          
          data.push({
            itemName: itemName,
            openingQty: Math.round(numbers[0]) || null,
            purchaseQty: Math.round(numbers[1]) || null,
            purchaseFree: null,
            salesQty: Math.round(numbers[2]) || null,
            salesValue: numbers[3] || null,
            closingQty: Math.round(numbers[4]) || null,
            closingValue: numbers[5] || null
          });
        }
      }
    }
    
    // Clean and deduplicate data
    const cleanedData = data
      .filter((item, index, self) => 
        index === self.findIndex(t => t.itemName === item.itemName)
      )
      .filter(item => {
        // Filter out headers and invalid entries
        const name = item.itemName.toLowerCase();
        return !name.includes('stock') && 
               !name.includes('report') &&
               !name.includes('item') &&
               !name.includes('opening') &&
               !name.includes('closing') &&
               item.itemName.length > 2;
      })
      .map(item => ({
        ...item,
        itemName: item.itemName.replace(/\s+/g, ' ').trim()
      }));
    
    console.log(`🔍 Enhanced pattern extraction completed. Found ${cleanedData.length} pharmaceutical items`);
    
    if (cleanedData.length > 0) {
      console.log('Sample extracted items:');
      cleanedData.slice(0, 3).forEach(item => {
        console.log(`- ${item.itemName}: Opening=${item.openingQty}, Sales=${item.salesQty}, Value=${item.salesValue}`);
      });
    } else {
      console.log('No pharmaceutical items found. Text analysis:');
      console.log(`- Total lines: ${lines.length}`);
      console.log(`- Lines with numbers: ${lines.filter(line => /\d/.test(line)).length}`);
      console.log(`- Lines starting with capital: ${lines.filter(line => /^[A-Z]/.test(line.trim())).length}`);
    }
    
    return {
      success: cleanedData.length > 0,
      data: cleanedData
    };
  } catch (error) {
    console.error('Enhanced pattern extraction error:', error);
    return {
      success: false,
      error: 'Pattern extraction failed'
    };
  }
}

/**
 * Test which AI models are available and working with current API token
 */
export async function testAvailableModels(): Promise<void> {
  console.log('🧪 Testing available AI models with current API token...');
  
  const testModels = [
    'gpt2',
    'gpt2-medium', 
    'microsoft/DialoGPT-medium',
    'microsoft/DialoGPT-large',
    'google/flan-t5-small',
    'google/flan-t5-base',
    'google/flan-t5-large',
    'facebook/bart-base',
    'facebook/bart-large',
    'distilgpt2',
    'EleutherAI/gpt-neo-125M',
    'EleutherAI/gpt-neo-1.3B',
    'bigscience/bloom-560m',
    'bigscience/bloom-1b1'
  ];
  
  const workingModels: string[] = [];
  const failedModels: string[] = [];
  
  for (const modelName of testModels) {
    try {
      console.log(`Testing ${modelName}...`);
      
      const response = await hf.textGeneration({
        model: modelName,
        inputs: 'Extract: Medicine A 10 20 30',
        parameters: {
          max_new_tokens: 50,
          temperature: 0.1
        }
      });
      
      if (response && response.generated_text) {
        workingModels.push(modelName);
        console.log(`✅ ${modelName} - WORKING`);
      } else {
        failedModels.push(modelName);
        console.log(`❌ ${modelName} - No response`);
      }
    } catch (error: any) {
      failedModels.push(modelName);
      console.log(`❌ ${modelName} - ERROR: ${error.message}`);
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📈 MODEL TEST RESULTS:');
  console.log(`✅ Working models (${workingModels.length}):`);
  workingModels.forEach(model => console.log(`   - ${model}`));
  
  console.log(`\n❌ Failed models (${failedModels.length}):`);
  failedModels.forEach(model => console.log(`   - ${model}`));
  
  return;
}

/**
 * Test function to validate Hugging Face API connection
 */
export async function testHuggingFaceConnection(): Promise<boolean> {
  try {
    console.log('🧪 Testing Hugging Face API connection...');
    
    const response = await hf.textGeneration({
      model: 'gpt2',
      inputs: 'Hello, this is a test.',
      parameters: {
        max_new_tokens: 50,
        temperature: 0.1,
        return_full_text: false
      },
    });

    console.log('✅ Hugging Face API test successful');
    console.log('Response:', response.generated_text);
    return true;
  } catch (error) {
    console.error('❌ Hugging Face API test failed:', error);
    return false;
  }
}