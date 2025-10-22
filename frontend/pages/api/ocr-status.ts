import { NextApiRequest, NextApiResponse } from 'next';
import { ocrService } from '../../lib/services/multiProviderOCRService';
import { 
  sendSuccess, 
  sendError, 
  validateMethod
} from '../../lib/api-response';

/**
 * API endpoint to check OCR service status
 * GET /api/ocr-status - Get status of all OCR providers
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Validate HTTP method
    if (!validateMethod(req, res, ['GET'])) {
      return;
    }

    console.log('🔍 Checking OCR service status...');

    // Get service status
    const status = await ocrService.getStatus();

    // Add additional health checks
    const healthCheck = {
      ...status,
      serverTime: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      services: {
        dotsOCR: {
          configured: status.providers.find(p => p.name === 'dots.ocr')?.configured || false,
          available: status.providers.find(p => p.name === 'dots.ocr')?.available || false,
          url: process.env.DOTS_OCR_BASE_URL || 'http://localhost:8000'
        },
        nanonets: {
          configured: status.providers.find(p => p.name === 'Nanonets')?.configured || false,
          available: status.providers.find(p => p.name === 'Nanonets')?.available || false,
          hasApiKey: !!(process.env.NANONETS_API_KEY && process.env.NANONETS_API_KEY !== 'YOUR_NEW_NANONETS_API_KEY_HERE')
        },
        ocrSpace: {
          configured: status.providers.find(p => p.name === 'OCR.space')?.configured || false,
          available: status.providers.find(p => p.name === 'OCR.space')?.available || false,
          hasApiKey: !!(process.env.OCR_SPACE_API_KEY)
        }
      }
    };

    console.log('✅ OCR service status retrieved successfully');

    sendSuccess(res, healthCheck);

  } catch (error: any) {
    console.error('❌ OCR status check failed:', error.message);
    sendError(res, 'Failed to check OCR service status', 500, 'STATUS_CHECK_ERROR', 
      process.env.NODE_ENV === 'development' ? error.message : undefined
    );
  }
}