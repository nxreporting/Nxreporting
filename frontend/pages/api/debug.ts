import { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const envVars = {
      NODE_ENV: process.env.NODE_ENV,
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasNanonetsKey: !!process.env.NANONETS_API_KEY,
      jwtSecretLength: process.env.JWT_SECRET?.length || 0,
      databaseUrlStart: process.env.DATABASE_URL?.substring(0, 20) || 'not set'
    }

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: envVars,
      message: 'Debug endpoint working'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}