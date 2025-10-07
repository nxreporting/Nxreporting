import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import { promises as fs } from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔍 Debug: Starting extraction test...');
    
    // Test environment variables
    const apiKey = process.env.OCR_SPACE_API_KEY;
    console.log('🔍 Debug: API key exists:', !!apiKey);
    console.log('🔍 Debug: API key length:', apiKey?.length || 0);
    
    // Test FormData import
    try {
      const FormData = require('form-data');
      console.log('🔍 Debug: FormData import successful');
    } catch (formDataError) {
      console.error('🔍 Debug: FormData import failed:', formDataError);
      return res.status(500).json({ 
        error: 'FormData import failed', 
        details: formDataError.message 
      });
    }
    
    // Test extractPDF import
    try {
      const { extractPDF } = require('../../lib/services/pdfExtractor');
      console.log('🔍 Debug: extractPDF import successful');
    } catch (extractError) {
      console.error('🔍 Debug: extractPDF import failed:', extractError);
      return res.status(500).json({ 
        error: 'extractPDF import failed', 
        details: extractError.message 
      });
    }
    
    // Parse form data
    const form = formidable({
      uploadDir: '/tmp',
      keepExtensions: true,
      maxFileSize: 50 * 1024 * 1024,
    });

    const [fields, files] = await form.parse(req);
    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    console.log('🔍 Debug: File parsed successfully:', {
      filename: file.originalFilename,
      size: file.size,
      type: file.mimetype
    });

    // Read file buffer
    const fileBuffer = await fs.readFile(file.filepath);
    console.log('🔍 Debug: File buffer created, size:', fileBuffer.length);

    // Test simple extraction call
    try {
      const { extractPDF } = require('../../lib/services/pdfExtractor');
      console.log('🔍 Debug: About to call extractPDF...');
      
      const result = await extractPDF(fileBuffer, file.originalFilename || 'test.pdf', 'flat-json');
      console.log('🔍 Debug: extractPDF completed:', { success: result.success });
      
      return res.status(200).json({
        debug: true,
        success: true,
        extractionResult: result,
        fileInfo: {
          filename: file.originalFilename,
          size: file.size,
          bufferSize: fileBuffer.length
        }
      });
      
    } catch (extractionError: any) {
      console.error('🔍 Debug: extractPDF failed:', extractionError);
      return res.status(500).json({ 
        error: 'extractPDF execution failed', 
        details: extractionError.message,
        stack: extractionError.stack
      });
    }

  } catch (error: any) {
    console.error('🔍 Debug: General error:', error);
    return res.status(500).json({ 
      error: 'Debug handler failed', 
      details: error.message,
      stack: error.stack
    });
  }
}