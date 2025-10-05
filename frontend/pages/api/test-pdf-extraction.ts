import { NextApiRequest, NextApiResponse } from 'next';
import { nanonetsService } from '../../lib/services/nanonetsExtractionService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔍 Testing PDF extraction service...');
    
    // Create a minimal test PDF buffer
    const testPDFBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n179\n%%EOF');
    
    console.log('📄 Created test PDF buffer, size:', testPDFBuffer.length, 'bytes');
    
    // Test the extraction service
    const result = await nanonetsService.extractFromBuffer(
      testPDFBuffer,
      'test-document.pdf',
      'flat-json'
    );
    
    console.log('📊 Extraction result:', {
      success: result.success,
      provider: result.provider,
      hasText: !!result.extractedText,
      textLength: result.extractedText?.length || 0
    });
    
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'PDF extraction service is working correctly',
        provider: result.provider,
        extractedText: result.extractedText?.substring(0, 200) + (result.extractedText && result.extractedText.length > 200 ? '...' : ''),
        textLength: result.extractedText?.length || 0,
        config: {
          ocrSpaceConfigured: !!process.env.OCR_SPACE_API_KEY,
          nanonetsConfigured: !!process.env.NANONETS_API_KEY
        }
      });
    } else {
      return res.status(200).json({
        success: false,
        error: result.error || 'PDF extraction failed',
        provider: result.provider,
        config: {
          ocrSpaceConfigured: !!process.env.OCR_SPACE_API_KEY,
          nanonetsConfigured: !!process.env.NANONETS_API_KEY
        }
      });
    }

  } catch (error: any) {
    console.error('❌ PDF extraction test failed:', error);
    
    return res.status(500).json({
      success: false,
      error: `PDF extraction test failed: ${error.message}`,
      config: {
        ocrSpaceConfigured: !!process.env.OCR_SPACE_API_KEY,
        nanonetsConfigured: !!process.env.NANONETS_API_KEY
      }
    });
  }
}