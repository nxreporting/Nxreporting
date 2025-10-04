import { NextApiRequest, NextApiResponse } from 'next';
import { sendSuccess, sendError } from '../../lib/api-response';

// Simple test endpoint to verify the extract API structure
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return sendError(res, 'Method not allowed', 405, 'METHOD_NOT_ALLOWED');
  }

  try {
    // Test all the imports and utilities
    const { nanonetsService } = await import('../../lib/services/nanonetsExtractionService');
    const { DataFormatter } = await import('../../lib/utils/dataFormatter');
    const { uploadFile, validateFile } = await import('../../lib/storage');
    const { withTimeout } = await import('../../lib/timeout');

    const status = {
      nanonetsService: nanonetsService.getStatus(),
      dataFormatter: !!DataFormatter,
      storageUtils: { uploadFile: !!uploadFile, validateFile: !!validateFile },
      timeoutUtils: !!withTimeout,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        nanonetsConfigured: !!process.env.NANONETS_API_KEY,
        storageProvider: process.env.STORAGE_PROVIDER || 'vercel',
        supabaseConfigured: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
        vercelBlobConfigured: !!process.env.BLOB_READ_WRITE_TOKEN
      }
    };

    sendSuccess(res, {
      message: 'Extract API dependencies test successful',
      status,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Extract API test failed:', error);
    sendError(res, 'Extract API test failed', 500, 'TEST_FAILED', error.message);
  }
}