import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import { promises as fs } from 'fs';
import { PdfToCsvConverter } from '../../lib/services/pdfToCsv';
import { 
  sendSuccess, 
  sendError, 
  sendValidationError, 
  validateMethod
} from '../../lib/api-response';

// Disable body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
    maxDuration: 30, // 30 seconds should be enough for PDF processing
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Validate HTTP method
  if (!validateMethod(req, res, ['POST'])) {
    return;
  }

  console.log('📨 PDF to CSV conversion request received');

  let tempFilePath: string | null = null;

  try {
    // Parse form data
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

    // Validate file type
    if (file.mimetype !== 'application/pdf') {
      sendValidationError(res, 'Invalid file type. Please upload a PDF file.');
      return;
    }

    // Read file buffer
    const fileBuffer = await fs.readFile(file.filepath);
    
    // Convert PDF to CSV
    console.log('🔄 Starting PDF to CSV conversion...');
    const conversionResult = await PdfToCsvConverter.convertPdfToCsv(
      fileBuffer, 
      file.originalFilename || 'document.pdf'
    );
    
    if (conversionResult.success) {
      console.log('✅ PDF to CSV conversion successful');
      console.log(`📊 Extracted ${conversionResult.tableData?.length || 0} rows`);
      console.log(`⏱️ Processing time: ${conversionResult.metadata?.processingTime}ms`);
      
      const responseData = {
        message: 'PDF converted to CSV successfully',
        csvData: conversionResult.csvData,
        tableData: conversionResult.tableData,
        metadata: {
          originalFilename: file.originalFilename,
          fileSize: file.size,
          processedAt: new Date().toISOString(),
          ...conversionResult.metadata
        }
      };

      sendSuccess(res, responseData);
    } else {
      console.error('❌ PDF to CSV conversion failed:', conversionResult.error);
      
      sendError(res, conversionResult.error || 'PDF conversion failed', 500, 'CONVERSION_FAILED', {
        originalFilename: file.originalFilename,
        fileSize: file.size,
        processedAt: new Date().toISOString(),
        ...conversionResult.metadata
      });
    }

  } catch (error: any) {
    console.error('❌ PDF to CSV API error:', error);
    
    sendError(res, 'Internal server error during PDF conversion', 500, 'INTERNAL_ERROR', 
      process.env.NODE_ENV === 'development' ? error.message : undefined
    );
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