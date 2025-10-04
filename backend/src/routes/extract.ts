import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { nanonetsService } from '../services/nanonetsExtractionService';
import { DataFormatter } from '../utils/dataFormatter';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || 'uploads';
    
    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `nanonets-${uniqueSuffix}${extension}`);
  }
});

// File filter - only allow PDFs
const fileFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype === 'application/pdf' || path.extname(file.originalname).toLowerCase() === '.pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed!'), false);
  }
};

// Configure multer with limits and filters
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 1 // Only one file at a time
  },
  fileFilter: fileFilter
});

/**
 * API route handler for PDF extraction using Nanonets
 * POST /api/extract
 */
export const extractPDF = async (req: Request, res: Response) => {
  try {
    console.log('📨 PDF extraction request received');
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No PDF file provided. Please upload a PDF file.'
      });
    }

    const uploadedFile = req.file;
    console.log(`📄 Processing file: ${uploadedFile.originalname}`);
    console.log(`📏 File size: ${(uploadedFile.size / 1024).toFixed(2)} KB`);

    // Get output type from request (default to flat-json)
    const outputType = (req.body.output_type as 'flat-json' | 'markdown' | 'json') || 'flat-json';
    console.log(`📊 Requested output type: ${outputType}`);

    // Extract data using Nanonets service
    const extractionResult = await nanonetsService.extractFromPDF(uploadedFile.path, outputType);

    // Clean up uploaded file after processing
    try {
      fs.unlinkSync(uploadedFile.path);
      console.log('🗑️ Temporary file cleaned up');
    } catch (cleanupError) {
      console.warn('⚠️ Failed to clean up temporary file:', cleanupError);
    }

    // Return extraction results
    if (extractionResult.success) {
      console.log('✅ PDF extraction completed successfully');
      
      // Format the data for better readability
      let formattedData = null;
      let summary = null;
      let brandAnalysis = null;
      let detailedBrandReport = null;
      let formatError = null;
      
      console.log('🔄 Starting data formatting process...');
      console.log('📊 Raw data structure:', Object.keys(extractionResult.data || {}).slice(0, 10));
      
      try {
        console.log('1️⃣ Attempting to format stock report...');
        formattedData = DataFormatter.formatStockReport(extractionResult.data);
        console.log('✅ Stock report formatted successfully');
        
        console.log('2️⃣ Attempting to generate summary...');
        summary = DataFormatter.generateSummary(formattedData);
        console.log('✅ Summary generated successfully');
        
        console.log('3️⃣ Attempting to generate brand analysis...');
        brandAnalysis = DataFormatter.generateBrandWiseAnalysis(formattedData);
        console.log('✅ Brand analysis generated successfully');
        
        console.log('4️⃣ Attempting to generate detailed brand report...');
        detailedBrandReport = DataFormatter.generateDetailedBrandReport(formattedData);
        console.log('✅ Detailed brand report generated successfully');
        
      } catch (error: any) {
        console.error('❌ Data formatting failed:', error);
        console.error('❌ Error stack:', error.stack);
        formatError = error.message;
        
        // Try to create a basic fallback format
        try {
          console.log('🔄 Attempting fallback formatting...');
          const rawData = extractionResult.data;
          
          formattedData = {
            company: { name: rawData.company_name || rawData.Company_Name || 'Unknown Company' },
            report: { 
              title: rawData.report_title || rawData.Report_Type || 'Stock Report',
              dateRange: rawData.date_range || rawData.report_date_range || rawData.Report_Date || 'Unknown Period',
              generatedAt: new Date().toISOString()
            },
            items: [],
            summary: {
              totalItems: 0,
              totalSalesValue: rawData.total_sales_value || 0,
              totalClosingValue: rawData.total_closing_value || 0
            }
          };
          
          summary = `📊 **${formattedData.company.name}** - ${formattedData.report.title}\n📅 Period: ${formattedData.report.dateRange}\n⚠️ Detailed analysis unavailable due to formatting error: ${formatError}`;
          brandAnalysis = [];
          detailedBrandReport = 'Detailed report unavailable due to formatting error.';
          
          console.log('✅ Fallback formatting completed');
        } catch (fallbackError) {
          console.error('❌ Even fallback formatting failed:', fallbackError);
        }
      }
      
      const response = {
        success: true,
        message: 'PDF extracted successfully',
        data: extractionResult.data,
        formattedData: formattedData,
        summary: summary,
        brandAnalysis: brandAnalysis,
        detailedBrandReport: detailedBrandReport,
        extractedText: extractionResult.extractedText,
        formatError: formatError,
        metadata: {
          originalFilename: uploadedFile.originalname,
          fileSize: uploadedFile.size,
          outputType: outputType,
          processedAt: new Date().toISOString(),
          formattingStatus: {
            formattedData: !!formattedData,
            summary: !!summary,
            brandAnalysis: !!brandAnalysis,
            detailedBrandReport: !!detailedBrandReport
          }
        }
      };
      
      console.log('📤 Sending response with formatting status:', response.metadata.formattingStatus);
      return res.json(response);
    } else {
      console.error('❌ PDF extraction failed:', extractionResult.error);
      
      return res.status(500).json({
        success: false,
        error: extractionResult.error,
        metadata: {
          originalFilename: uploadedFile.originalname,
          fileSize: uploadedFile.size,
          outputType: outputType,
          processedAt: new Date().toISOString()
        }
      });
    }

  } catch (error: any) {
    console.error('❌ PDF extraction route error:', error);
    
    // Clean up file if it exists
    if (req.file?.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.warn('⚠️ Failed to clean up file after error:', cleanupError);
      }
    }

    return res.status(500).json({
      success: false,
      error: 'Internal server error during PDF extraction',
      details: error.message
    });
  }
};

/**
 * API route handler for getting extraction service status
 * GET /api/extract/status
 */
export const getExtractionStatus = (req: Request, res: Response) => {
  try {
    const status = nanonetsService.getStatus();
    
    return res.json({
      success: true,
      status: {
        ...status,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get extraction status',
      details: error.message
    });
  }
};

// Export the multer upload middleware for use in routes
export const uploadMiddleware = upload.single('file');