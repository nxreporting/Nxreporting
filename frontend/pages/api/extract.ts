import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import { promises as fs } from 'fs';
import { ocrService } from '../../lib/services/multiProviderOCRService';
import { DataFormatter } from '../../lib/utils/dataFormatter';
import { TextParser } from '../../lib/utils/textParser';
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

      // Extract data using multi-provider OCR service with timeout
      console.log('🔬 Starting PDF extraction with multi-provider OCR...');
      console.log('🔧 Providers: dots.ocr → Nanonets → OCR.space → Fallback');
      
      const extractionResult = await withTimeout(
        ocrService.extractFromBuffer(fileBuffer, file.originalFilename || 'document.pdf'),
        40000, // 40 second timeout (leave 5s buffer for response)
        'PDF extraction timed out'
      );
      
      console.log('📊 Extraction result:', { 
        success: extractionResult.success, 
        provider: extractionResult.provider,
        hasData: !!extractionResult.data,
        hasText: !!extractionResult.extractedText,
        textLength: extractionResult.extractedText?.length || 0
      });

      if (extractionResult.success) {
        console.log('✅ PDF extraction completed successfully');
        console.log(`📊 Provider used: ${extractionResult.provider || 'unknown'}`);
        console.log(`📜 Text extracted: ${extractionResult.extractedText?.length || 0} characters`);
        console.log(`⏱️ Total duration: ${extractionResult.metadata?.duration || 0}ms`);
        console.log(`🔄 Total attempts: ${extractionResult.metadata?.attempts || 0}`);
        
        // Format the data for better readability with timeout protection
        let formattedData = null;
        let summary = null;
        let brandAnalysis = null;
        let detailedBrandReport = null;
        let formatError = null;
        let savedExtraction = null;
        
        try {
          console.log('🔄 Starting data formatting...');
          checkMemoryUsage();
          
          // Check if we have raw text that needs parsing first
          let dataToFormat = extractionResult.data;
          
          // If the data doesn't have structured fields but we have extracted text, parse it
          const hasStructuredData = dataToFormat && (
            Object.keys(dataToFormat).some(key => key.startsWith('item_')) ||
            dataToFormat.company_name ||
            dataToFormat.Company_Name ||
            dataToFormat.company?.name
          );
          
          if (!hasStructuredData && extractionResult.extractedText) {
            console.log('🔄 Raw text detected, parsing into structured format...');
            console.log('📄 Text preview:', extractionResult.extractedText.substring(0, 200) + '...');
            
            try {
              const parsedData = TextParser.parseStockReportText(extractionResult.extractedText);
              console.log('✅ Text parsing completed, found fields:', Object.keys(parsedData).length);
              console.log('📊 Sample parsed fields:', Object.keys(parsedData).slice(0, 10));
              dataToFormat = parsedData;
            } catch (parseError) {
              console.error('❌ Text parsing failed:', parseError);
              // Continue with original data
            }
          }
          
          formattedData = await withTimeout(
            Promise.resolve(DataFormatter.formatStockReport(dataToFormat)),
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
              company: { name: rawData.company_name || rawData.Company_Name || rawData.company?.name || 'Unknown Company' },
              report: { 
                title: rawData.report_title || rawData.Report_Type || 'Stock Report',
                dateRange: rawData.date_range || rawData.report_date_range || 'Unknown Period',
                generatedAt: new Date().toISOString()
              },
              items: rawData.items || [],
              summary: {
                totalItems: rawData.items?.length || 0,
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

        // Save to database if we have a valid file upload record
        try {
          if (storageUrl) {
            console.log('💾 Saving extraction data to database...');
            
            // Import database service
            const { getDatabaseService } = await import('../../lib/services/databaseService');
            const dbService = getDatabaseService();
            
            // First, create file record if it doesn't exist
            let fileRecord;
            try {
              fileRecord = await dbService.saveUploadedFile(
                file.originalFilename || 'document.pdf',
                generateSafeFilename(file.originalFilename || 'document.pdf'),
                storageUrl,
                file.mimetype || 'application/pdf',
                file.size,
                'system' // Default user ID - you might want to get this from JWT token
              );
            } catch (fileError) {
              console.warn('⚠️ File record creation failed, using temporary ID');
              fileRecord = { id: 'temp-' + Date.now() };
            }

            // Save extraction data
            savedExtraction = await dbService.saveExtractionData({
              fileId: fileRecord.id,
              userId: 'system', // Default user ID - you might want to get this from JWT token
              rawData: extractionResult.data,
              structuredData: formattedData,
              extractedText: extractionResult.extractedText,
              ocrProvider: extractionResult.provider,
              metadata: {
                confidence: extractionResult.metadata?.confidence,
                duration: extractionResult.metadata?.duration,
                fileSize: extractionResult.metadata?.fileSize,
                tables: extractionResult.metadata?.tables,
                fields: extractionResult.metadata?.fields,
              }
            });

            console.log(`✅ Extraction data saved to database: ${savedExtraction.id}`);
          }
        } catch (dbError: any) {
          console.error('❌ Database save failed:', dbError.message);
          // Don't fail the entire request if database save fails
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
          extractionId: savedExtraction?.id,
          metadata: {
            originalFilename: file.originalFilename,
            fileSize: file.size,
            outputType: outputType,
            processedAt: new Date().toISOString(),
            storageUrl: storageUrl,
            ocrProvider: extractionResult.provider || 'unknown',
            extractedTextLength: extractionResult.extractedText?.length || 0,
            confidence: extractionResult.metadata?.confidence,
            tables: extractionResult.metadata?.tables,
            fields: extractionResult.metadata?.fields,
            formattingStatus: {
              formattedData: !!formattedData,
              summary: !!summary,
              brandAnalysis: !!brandAnalysis,
              detailedBrandReport: !!detailedBrandReport
            },
            databaseSaved: !!savedExtraction
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