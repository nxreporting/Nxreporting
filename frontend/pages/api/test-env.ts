import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const apiKey = process.env.OCR_SPACE_API_KEY;
    
    res.status(200).json({
      success: true,
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length || 0,
      apiKeyFirst3: apiKey?.substring(0, 3) || 'undefined',
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}