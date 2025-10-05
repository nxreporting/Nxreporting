import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import { promises as fs } from 'fs';
import { nanonetsService } from '../../lib/services/nanonetsExtractionService';
import { DataFormatter } from '../../lib/utils/dataFormatter';
import { uploadFile, validateFile, generateSafeFilename } from '../../lib/storage';
import { withTimeout, executeWithLimits, checkMemoryUsage } from '../../lib/timeout';
import { 
  sendSuccess, 
  sendError, 
  sendValidationError, 
  validateMethod
} from '../../lib/api-response';
import { withExtractionMonitoring } from '../../lib/monitoring';
import '../../lib/init-monitoring'; // Initialize monitoring

// Disable body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
    // Set function timeout for Vercel (max 50s for Pro plan)
    maxDuration: 45,
  },
};

async function extractHandler(req: NextApiRequest, res: NextApiResponse) {
  // Validate HTTP method
  if (!validateMethod(req, res, ['POST'])) {
    return;
  }

  console.log('📨 PDF extraction request received');
  checkMemoryUsage();

  let tempFilePath: string | null = null;

  try {
    // Execute with timeout and memory limits
    await executeWithLimits(async () => {
      // Parse form data with serverless-optimized settings
      const form = formidable({
        uploadDir: '/tmp',
        keepExtensions: true,
        maxFileSize: 50 * 1024 * 1024, // 50MB
        maxFiles: 1,
        allowEmptyFiles: false,
        minFileSize: 1024, // Minimum 1KB
      });

      const [fields, files] = await form.parse(req);
      const file = Array.isArray(files.file) ? files.file[0] : files.file;

      if (!file) {
        sendValidationError(res, 'No PDF file provided. Please upload a PDF file.');
        return;
      }

      tempFilePath = file.filepath;

      console.log(`📄 Processing file: ${file.originalFilename}`);
      console.log(`📏 File size: ${(file.size / 1024).toFixed(2)} KB`);

      // Validate file type and size
      const fileValidation = validateFile(
        { 
          name: file.originalFilename || 'document.pdf',
          size: file.size,
          type: file.mimetype || 'application/pdf'
        } as File,
        {
          maxSize: 50 * 1024 * 1024, // 50MB
          allowedTypes: ['application/pdf']
        }
      );

      if (!fileValidation.valid) {
        sendValidationError(res, fileValidation.error);
        return;
      }

      // Get output type
      const outputType = (Array.isArray(fields.output_type) ? fields.output_type[0] : fields.output_type) || 'flat-json';

      // Read file buffer for processing
      const fileBuffer = await fs.readFile(file.filepath);
      
      // Upload to cloud storage for persistence (optional - can be skipped for immediate processing)
      let storageUrl: string | null = null;
      try {
        const safeFilename = generateSafeFilename(file.originalFilename || 'document.pdf');
        const uploadResult = await uploadFile(fileBuffer, safeFilename);
        
        if (uploadResult.success) {
          storageUrl = uploadResult.url!;
          console.log(`☁️ File uploaded to cloud storage: ${storageUrl}`);
        } else {
          console.warn('⚠️ Cloud storage upload failed, proceeding with buffer processing:', uploadResult.error);
        }
      } catch (uploadError) {
        console.warn('⚠️ Cloud storage upload error, proceeding with buffer processing:', uploadError);
      }

      // Extract data using Nanonets service with timeout
      console.log('🔬 Starting PDF extraction with timeout protection...');
      const extractionResult = await withTimeout(
        nanonetsService.extractFromBuffer(fileBuffer, file.originalFilename || 'document.pdf', outputType as any),
        40000, // 40 second timeout (leave 5s buffer for response)
        'PDF extraction timed out'
      );

      if (extractionResult.success) {
        console.log('✅ PDF extraction completed successfully');
        
        // Format the data for better readability with timeout protection
        let formattedData = null;
        let summary = null;
        let brandAnalysis = null;
        let detailedBrandReport = null;
        let formatError = null;
        
        try {
          console.log('🔄 Starting data formatting...');
          checkMemoryUsage();
          
          formattedData = await withTimeout(
            Promise.resolve(DataFormatter.formatStockReport(extractionResult.data)),
            5000,
            'Data formatting timed out'
          );
          
          summary = DataFormatter.generateSummary(formattedData);
          brandAnalysis = DataFormatter.generateBrandWiseAnalysis(formattedData);
          detailedBrandReport = DataFormatter.generateDetailedBrandReport(formattedData);
          
          console.log('✅ Data formatting completed successfully');
        } catch (error: any) {
          console.error('❌ Data formatting failed:', error);
          formatError = error.message;
          
          // Create fallback formatted data
          try {
            const rawData = extractionResult.data;
            formattedData = {
              company: { name: rawData.company_name || rawData.Company_Name || 'Unknown Company' },
              report: { 
                title: rawData.report_title || rawData.Report_Type || 'Stock Report',
                dateRange: rawData.date_range || rawData.report_date_range || 'Unknown Period',
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
          } catch (fallbackError) {
            console.error('❌ Even fallback formatting failed:', fallbackError);
          }
        }
        
        const responseData = {
          message: 'PDF extracted successfully',
          data: extractionResult.data,
          formattedData: formattedData,
          summary: summary,
          brandAnalysis: brandAnalysis,
          detailedBrandReport: detailedBrandReport,
          extractedText: extractionResult.extractedText,
          formatError: formatError,
          metadata: {
            originalFilename: file.originalFilename,
            fileSize: file.size,
            outputType: outputType,
            processedAt: new Date().toISOString(),
            storageUrl: storageUrl,
            formattingStatus: {
              formattedData: !!formattedData,
              summary: !!summary,
              brandAnalysis: !!brandAnalysis,
              detailedBrandReport: !!detailedBrandReport
            }
          }
        };

        sendSuccess(res, responseData);
      } else {
        console.error('❌ PDF extraction failed:', extractionResult.error);
        
        sendError(res, extractionResult.error || 'PDF extraction failed', 500, 'EXTRACTION_FAILED', {
          originalFilename: file.originalFilename,
          fileSize: file.size,
          outputType: outputType,
          processedAt: new Date().toISOString()
        });
      }
    }, {
      timeoutMs: 45000, // 45 second total timeout
      maxMemoryMB: 1024, // 1GB memory limit
      memoryCheckInterval: 5000 // Check memory every 5 seconds
    });

  } catch (error: any) {
    console.error('❌ PDF extraction API error:', error);
    
    if (error.message.includes('timeout') || error.message.includes('timed out')) {
      sendError(res, 'PDF processing timed out. Please try with a smaller file or contact support.', 408, 'TIMEOUT_ERROR');
    } else if (error.message.includes('memory')) {
      sendError(res, 'PDF processing failed due to memory constraints. Please try with a smaller file.', 413, 'MEMORY_ERROR');
    } else {
      sendError(res, 'Internal server error during PDF extraction', 500, 'INTERNAL_ERROR', 
        process.env.NODE_ENV === 'development' ? error.message : undefined
      );
    }
  } finally {
    // Clean up temporary file
    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath);
        console.log('🗑️ Temporary file cleaned up');
      } catch (cleanupError) {
        console.warn('⚠️ Failed to clean up temporary file:', cleanupError);
      }
    }
  }
}

// Export handler with comprehensive monitoring (includes error handling, performance monitoring, and memory monitoring)
export default withExtractionMonitoring(extractHandler);