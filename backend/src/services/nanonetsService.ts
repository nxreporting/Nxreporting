import fs from 'fs';
import { spawn } from 'child_process';
import path from 'path';

// Interface for structured pharma stock data (matching your existing structure)
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
 * Extract pharmaceutical data using DocStrange Python service
 */
export async function extractPharmaDataWithNanonets(filePath: string): Promise<StructuredPharmaResponse> {
  try {
    console.log('🔬 Starting DocStrange pharmaceutical data extraction...');
    console.log(`📄 Processing file: ${filePath}`);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return { success: false, error: 'PDF file not found' };
    }

    // Check file size (DocStrange limit)
    const stats = fs.statSync(filePath);
    const fileSizeMB = stats.size / (1024 * 1024);
    console.log(`📊 File size: ${fileSizeMB.toFixed(2)} MB`);
    
    if (fileSizeMB > 50) { // DocStrange free tier limit
      console.log('⚠️ File too large for DocStrange free tier');
      return { success: false, error: 'File size exceeds 50MB limit for DocStrange' };
    }

    // Get DocStrange API key from environment (optional)
    const apiKey = process.env.DOCSTRANGE_API_KEY || '';
    
    // Call Python DocStrange service
    const docStrangeResult = await callDocStrangePythonService(filePath, apiKey);
    
    if (docStrangeResult.success && docStrangeResult.data && docStrangeResult.data.length > 0) {
      console.log(`🎉 DocStrange extraction successful! Found ${docStrangeResult.data.length} pharmaceutical items`);
      console.log('📊 Extraction mode:', docStrangeResult.mode);
      console.log('📄 Text preview:', docStrangeResult.text_preview);
      
      return {
        success: true,
        data: docStrangeResult.data
      };
    } else {
      console.log('⚠️ DocStrange extraction failed or returned no data');
      console.log('Error:', docStrangeResult.error);
      
      return {
        success: false,
        error: docStrangeResult.error || 'DocStrange extraction failed'
      };
    }

  } catch (error: any) {
    console.error('❌ DocStrange extraction error:', error);
    return {
      success: false,
      error: `DocStrange error: ${error.message}`
    };
  }
}

/**
 * Call DocStrange Python service for document extraction
 */
async function callDocStrangePythonService(filePath: string, apiKey?: string): Promise<any> {
  return new Promise((resolve, reject) => {
    console.log('🐍 Calling DocStrange Python service...');
    
    // Get absolute path to Python script
    const scriptPath = path.join(__dirname, '../../docstrange_service.py');
    
    // Prepare arguments
    const args = [scriptPath, filePath];
    if (apiKey && apiKey.trim() !== '') {
      args.push(apiKey);
    }
    
    console.log('💻 Command:', 'python', args.join(' '));
    
    // Spawn Python process
    const pythonProcess = spawn('python', args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: path.dirname(scriptPath)
    });
    
    let stdout = '';
    let stderr = '';
    
    // Collect stdout
    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    // Collect stderr
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    // Handle process completion
    pythonProcess.on('close', (code) => {
      console.log('🐍 Python process completed with code:', code);
      
      if (stderr) {
        console.log('⚠️ Python stderr:', stderr);
      }
      
      if (code === 0 && stdout.trim()) {
        try {
          const result = JSON.parse(stdout.trim());
          console.log('✅ DocStrange Python service succeeded');
          resolve(result);
        } catch (parseError: any) {
          console.error('❌ Failed to parse Python output as JSON:', parseError);
          console.log('Raw output:', stdout);
          resolve({
            success: false,
            error: `Failed to parse DocStrange output: ${parseError.message || 'Unknown parsing error'}`
          });
        }
      } else {
        console.error('❌ DocStrange Python service failed');
        resolve({
          success: false,
          error: stderr || `Python process exited with code ${code}`
        });
      }
    });
    
    // Handle process errors
    pythonProcess.on('error', (error) => {
      console.error('❌ Python process error:', error);
      resolve({
        success: false,
        error: `Python process error: ${error.message}`
      });
    });
    
    // Set timeout (5 minutes for large files)
    setTimeout(() => {
      pythonProcess.kill('SIGTERM');
      resolve({
        success: false,
        error: 'DocStrange extraction timed out (5 minutes)'
      });
    }, 5 * 60 * 1000);
  });
}

/**
 * Extract pharmaceutical data from text using enhanced pattern matching
 */
function extractPharmaDataFromText(text: string): PharmaStockData[] {
  const data: PharmaStockData[] = [];
  const lines = text.split('\n');
  
  console.log('🔍 Analyzing text for pharmaceutical patterns...');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines, headers, and too short lines
    if (!line || line.length < 5 || /^(ITEM|NAME|MEDICINE|DRUG|S\.?NO|SR\.?NO)/i.test(line)) continue;
    
    // Enhanced pattern for pharmaceutical data with better medicine name detection
    // Example: "PARACETAMOL 500MG TAB 40 8 0 60 4881.60 12 0 0 0.00"
    const enhancedPattern = /^([A-Z][A-Z\s\d\-\.\(\)\/]{3,40})\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+([\d\.]+)\s+(\d+)/;
    const enhancedMatch = line.match(enhancedPattern);
    
    if (enhancedMatch) {
      const itemName = enhancedMatch[1].trim();
      const numbers = enhancedMatch.slice(2).map(n => parseFloat(n));
      
      // Validate medicine name and data quality
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
    }
    
    // Alternative pattern for space/tab separated data
    const altPattern = /^([A-Z][A-Z\s\d\-\.\(\)\/]{3,30})\s{2,}([\d\s\.]+)$/;
    const altMatch = line.match(altPattern);
    
    if (altMatch && !enhancedMatch) {
      const itemName = altMatch[1].trim();
      const numbersPart = altMatch[2];
      const numbers = numbersPart.match(/\d+(\.\d+)?/g)?.map(n => parseFloat(n)) || [];
      
      if (itemName.length > 2 && numbers.length >= 4) {
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
  
  // Remove duplicates and limit results
  const uniqueData = data.filter((item, index, self) => 
    index === self.findIndex(t => t.itemName === item.itemName)
  ).slice(0, 50);
  
  console.log(`📋 Extracted ${uniqueData.length} unique pharmaceutical items from text`);
  
  return uniqueData;
}