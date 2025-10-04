import fs from 'fs';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import { extractPharmaDataWithAI, PharmaStockData } from './huggingFaceService';

export interface ExtractedData {
  raw: {
    text: string;
    pages: number;
    info?: any;
  };
  structured: {
    title?: string;
    dates?: string[];
    numbers?: number[];
    tables?: any[];
    metadata?: any;
  };
  aiExtracted?: {
    pharmaData?: PharmaStockData[];
    success: boolean;
    error?: string;
  };
}

export async function extractPDFData(filePath: string, useAI: boolean = false): Promise<ExtractedData> {
  try {
    console.log(`📄 Starting PDF extraction for: ${filePath}`);
    console.log(`🤖 AI extraction enabled: ${useAI}`);
    
    // Read PDF file
    const dataBuffer = fs.readFileSync(filePath);
    
    // Parse PDF
    const pdfData = await pdfParse(dataBuffer);
    
    // Extract basic information
    const rawData = {
      text: pdfData.text,
      pages: pdfData.numpages,
      info: pdfData.info
    };

    console.log(`📊 Extracted ${rawData.text.length} characters from ${rawData.pages} pages`);

    // Structure the data (basic extraction)
    const structuredData = await structureData(pdfData.text);

    const result: ExtractedData = {
      raw: rawData,
      structured: structuredData
    };

    // If AI extraction is enabled, use multi-AI approach for pharmaceutical data
    if (useAI && rawData.text.length > 0) {
      console.log('🚀 Starting multi-AI pharmaceutical data extraction...');
      try {
        const aiResult = await extractPharmaDataWithAI(rawData.text, filePath);
        result.aiExtracted = aiResult;
        
        if (aiResult.success && aiResult.data) {
          console.log('✅ AI extraction successful!');
          console.log('📋 Extracted pharma data:', JSON.stringify(aiResult.data, null, 2));
        } else {
          console.log('⚠️ AI extraction failed:', aiResult.error);
        }
      } catch (aiError) {
        console.error('❌ AI extraction error:', aiError);
        result.aiExtracted = {
          success: false,
          error: aiError instanceof Error ? aiError.message : 'AI extraction failed'
        };
      }
    }

    return result;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error(`Failed to extract PDF data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function structureData(text: string) {
  const structured: any = {};

  try {
    // Extract dates (enhanced pattern matching)
    const datePatterns = [
      /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,        // MM/DD/YYYY
      /\b\d{1,2}-\d{1,2}-\d{4}\b/g,         // MM-DD-YYYY
      /\b\d{4}-\d{2}-\d{2}\b/g,             // YYYY-MM-DD
      /\b\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b/gi, // DD MMM YYYY
      /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi // Month DD, YYYY
    ];
    
    let dates: string[] = [];
    datePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        dates = [...dates, ...matches];
      }
    });
    structured.dates = [...new Set(dates)]; // Remove duplicates

    // Extract numbers (enhanced patterns for various formats)
    const numberPatterns = [
      /\$[\d,]+\.?\d*/g,                     // Currency: $1,234.56
      /\b\d{1,3}(?:,\d{3})*(?:\.\d{2})?\b/g, // Numbers with commas: 1,234.56
      /\b\d+\.\d{2}\b/g,                     // Decimal numbers: 123.45
      /\b\d{4,}\b/g,                         // Large numbers: 12345
      /\b\d+%\b/g                            // Percentages: 25%
    ];
    
    let numbers: string[] = [];
    numberPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        numbers = [...numbers, ...matches];
      }
    });
    
    // Convert to numbers where possible and categorize
    const processedNumbers = numbers.map(num => {
      const cleaned = num.replace(/[$,%]/g, '');
      const parsed = parseFloat(cleaned);
      return {
        original: num,
        value: isNaN(parsed) ? null : parsed,
        type: num.includes('$') ? 'currency' : 
              num.includes('%') ? 'percentage' : 
              num.includes(',') ? 'formatted' : 'number'
      };
    }).filter(item => item.value !== null);
    
    structured.numbers = processedNumbers.map(item => item.value);
    structured.numberDetails = processedNumbers;

    // Extract potential title (first meaningful line)
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    if (lines.length > 0) {
      // Try to find a meaningful title (not just numbers or short text)
      const titleCandidate = lines.find(line => 
        line.trim().length > 10 && 
        !/^\d+$/.test(line.trim()) &&
        !line.includes('Page ') &&
        !line.includes('www.')
      );
      structured.title = titleCandidate ? titleCandidate.trim() : lines[0].trim();
    }

    // Enhanced table detection
    const tableLines = lines.filter(line => {
      const parts = line.split(/\s{2,}|\t/);
      return parts.length >= 3 && parts.every(part => part.trim().length > 0);
    });

    if (tableLines.length > 0) {
      structured.tables = tableLines.slice(0, 15).map(line => {
        return line.split(/\s{2,}|\t/).map(cell => cell.trim());
      });
    }

    // Extract emails and phone numbers
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const phonePattern = /\b(?:\+?1[-.]?)?\(?([0-9]{3})\)?[-.]?([0-9]{3})[-.]?([0-9]{4})\b/g;
    
    structured.emails = text.match(emailPattern) || [];
    structured.phones = text.match(phonePattern) || [];

    // Extract key-value pairs (common in forms and documents)
    const keyValuePattern = /([A-Za-z\s]+):\s*([^\n]+)/g;
    const keyValuePairs: { [key: string]: string } = {};
    let match;
    while ((match = keyValuePattern.exec(text)) !== null) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (key.length > 1 && value.length > 0) {
        keyValuePairs[key] = value;
      }
    }
    structured.keyValuePairs = keyValuePairs;

    // Enhanced metadata
    structured.metadata = {
      wordCount: text.split(/\s+/).length,
      lineCount: lines.length,
      characterCount: text.length,
      hasNumbers: structured.numbers.length > 0,
      hasDates: structured.dates.length > 0,
      hasTables: structured.tables && structured.tables.length > 0,
      hasEmails: structured.emails.length > 0,
      hasPhones: structured.phones.length > 0,
      hasKeyValuePairs: Object.keys(keyValuePairs).length > 0,
      extractionTimestamp: new Date().toISOString(),
      documentType: detectDocumentType(text, structured)
    };

  } catch (error) {
    console.error('Data structuring error:', error);
    // Return basic structure even if advanced parsing fails
    structured.metadata = {
      wordCount: text.split(/\s+/).length,
      extractionError: error instanceof Error ? error.message : 'Unknown error',
      extractionTimestamp: new Date().toISOString()
    };
  }

  return structured;
}

// Helper function to detect document type
function detectDocumentType(text: string, structured: any): string {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('invoice') || lowerText.includes('bill')) {
    return 'invoice';
  }
  if (lowerText.includes('receipt')) {
    return 'receipt';
  }
  if (lowerText.includes('contract') || lowerText.includes('agreement')) {
    return 'contract';
  }
  if (lowerText.includes('report') || lowerText.includes('analysis')) {
    return 'report';
  }
  if (lowerText.includes('statement') && lowerText.includes('bank')) {
    return 'bank_statement';
  }
  if (structured.tables && structured.tables.length > 0) {
    return 'tabular_document';
  }
  if (structured.keyValuePairs && Object.keys(structured.keyValuePairs).length > 5) {
    return 'form';
  }
  
  return 'document';
}

// Advanced extraction using Hugging Face AI
export async function extractWithAI(text: string, prompt?: string): Promise<any> {
  try {
    console.log('🤖 Using Hugging Face AI for text extraction...');
    const result = await extractPharmaDataWithAI(text);
    return result;
  } catch (error) {
    console.error('AI extraction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'AI extraction failed',
      note: 'AI extraction using Hugging Face Mistral-7B model'
    };
  }
}