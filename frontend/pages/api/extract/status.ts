import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const status = {
      apiKeyConfigured: !!process.env.NANONETS_API_KEY,
      apiEndpoint: 'https://extraction-api.nanonets.com/extract',
      ready: !!process.env.NANONETS_API_KEY
    };
    
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
}