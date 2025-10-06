import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import { promises as fs } from 'fs';
import { extractPDF } from '../../lib/services/pdfExtractor';
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

      // Extract data using enhanced PDF extraction service with timeout
      console.log('🔬 Starting PDF extraction with enhanced multi-format parser...');
      console.log('🔧 Provider: OCR.space with intelligent pharmaceutical format detection');
      
      const extractionResult = await withTimeout(
        extractPDF(fileBuffer, file.originalFilename || 'document.pdf', outputType as 'flat-json' | 'structured-json'),
        40000, // 40 second timeout (leave 5s buffer for response)
        'PDF extraction timed out'
      );
      
      console.log('📊 Extraction result:', { 
        success: extractionResult.success, 
        provider: extractionResult.provider,
        hasStructuredData: !!extractionResult.structuredData,
        hasText: !!extractionResult.extractedText,
        textLength: extractionResult.extractedText?.length || 0,
        formatDetected: extractionResult.metadata?.formatDetected,
        confidence: extractionResult.metadata?.confidence,
        parsingStrategy: extractionResult.metadata?.parsingStrategy
      });

      if (extractionResult.success) {
        console.log('✅ PDF extraction completed successfully');
        console.log(`📊 Provider used: ${extractionResult.provider || 'unknown'}`);
        console.log(`📜 Text extracted: ${extractionResult.extractedText?.length || 0} characters`);
        console.log(`⏱️ Total duration: ${extractionResult.metadata?.duration || 0}ms`);
        console.log(`🔄 Total attempts: ${extractionResult.metadata?.attempts || 0}`);
        console.log(`🎯 Format detected: ${extractionResult.metadata?.formatDetected || 'unknown'}`);
        console.log(`📈 Parsing confidence: ${extractionResult.metadata?.confidence || 0}`);
        console.log(`🔧 Strategy used: ${extractionResult.metadata?.parsingStrategy || 'unknown'}`);
        
        // Format the data for better readability with timeout protection
        let formattedData = null;
        let summary = null;
        let brandAnalysis = null;
        let detailedBrandReport = null;
        let formatError = null;
        
        try {
          console.log('🔄 Starting data formatting...');
          checkMemoryUsage();
          
          // Use structured data from the new extractPDF function if available
          let dataToFormat = extractionResult.structuredData || null;
          
          // If no structured data but we have extracted text, use the raw text
          if (!dataToFormat && extractionResult.extractedText) {
            console.log('🔄 No structured data available, using raw text for formatting...');
            console.log('📄 Text preview:', extractionResult.extractedText.substring(0, 200) + '...');
            
            // Create minimal data structure for formatting
            dataToFormat = {
              company_name: 'Unknown Company',
              report_title: 'Stock Report',
              date_range: 'Unknown Period',
              raw_text: extractionResult.extractedText
            };
          }
          
          if (dataToFormat) {
            formattedData = await withTimeout(
              Promise.resolve(DataFormatter.formatStockReport(dataToFormat)),
              5000,
              'Data formatting timed out'
            );
            
            summary = DataFormatter.generateSummary(formattedData);
            brandAnalysis = DataFormatter.generateBrandWiseAnalysis(formattedData);
            detailedBrandReport = DataFormatter.generateDetailedBrandReport(formattedData);
          }
          
          console.log('✅ Data formatting completed successfully');
        } catch (error: any) {
          console.error('❌ Data formatting failed:', error);
          formatError = error.message;
          
          // Create fallback formatted data
          try {
            const rawData = extractionResult.structuredData || {};
            formattedData = {
              company: { name: rawData.company_name || 'Unknown Company' },
              report: { 
                title: rawData.report_title || 'Stock Report',
                dateRange: rawData.date_range || 'Unknown Period',
                generatedAt: new Date().toISOString()
              },
              items: [],
              summary: {
                totalItems: 0,
                totalSalesValue: 0,
                totalClosingValue: 0
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
          data: extractionResult.structuredData || extractionResult.extractedText,
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
            ocrProvider: extractionResult.provider || 'unknown',
            extractedTextLength: extractionResult.extractedText?.length || 0,
            formatDetected: extractionResult.metadata?.formatDetected,
            confidence: extractionResult.metadata?.confidence,
            parsingStrategy: extractionResult.metadata?.parsingStrategy,
            processingMethod: extractionResult.metadata?.processingMethod,
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
        console.error('🔍 Provider attempted:', extractionResult.provider || 'unknown');
        console.error('🔍 Raw response:', extractionResult.rawResponse);
        
        // Provide more helpful error message based on provider
        let userFriendlyError = extractionResult.error || 'PDF extraction failed';
        
        if (extractionResult.provider === 'none' || extractionResult.error?.includes('All OCR providers failed')) {
          userFriendlyError = 'All PDF processing services are currently unavailable. Please try again later or contact support.';
        } else if (extractionResult.error?.includes('OCR.space')) {
          userFriendlyError = 'OCR service temporarily unavailable. Please try again in a moment.';
        } else if (extractionResult.error?.includes('Nanonets')) {
          userFriendlyError = 'Primary OCR service unavailable. Trying alternative providers...';
        } else if (extractionResult.error?.includes('too large')) {
          userFriendlyError = 'File is too large. Please upload a PDF smaller than 50MB.';
        }
        
        sendError(res, userFriendlyError, 500, 'EXTRACTION_FAILED', {
          originalFilename: file.originalFilename,
          fileSize: file.size,
          outputType: outputType,
          processedAt: new Date().toISOString(),
          provider: extractionResult.provider,
          technicalError: process.env.NODE_ENV === 'development' ? extractionResult.error : undefined
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