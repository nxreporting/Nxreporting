import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Test endpoint for development hot reloading
  const timestamp = new Date().toISOString()
  
  return res.status(200).json({
    success: true,
    message: 'Development test endpoint - hot reloading works!',
    timestamp,
    method: req.method,
    hotReload: true,
    version: '1.0.0'
  })
}