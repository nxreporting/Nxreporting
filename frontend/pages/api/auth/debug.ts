import { NextApiRequest, NextApiResponse } from 'next'
import { sendSuccess, sendError } from '../../../lib/api-response'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return sendError(res, 'Method not allowed', 405, 'METHOD_NOT_ALLOWED')
  }

  try {
    // Check environment variables (without exposing sensitive values)
    const envCheck = {
      DATABASE_URL: !!process.env.DATABASE_URL,
      JWT_SECRET: !!process.env.JWT_SECRET,
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    }

    // Test database connection
    let dbStatus = 'unknown'
    try {
      const { prisma } = await import('../../../lib/prisma')
      await prisma.$queryRaw`SELECT 1`
      dbStatus = 'connected'
    } catch (dbError) {
      dbStatus = `error: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`
    }

    // Test JWT functionality
    let jwtStatus = 'unknown'
    try {
      const { generateToken, verifyToken } = await import('../../../lib/auth')
      const testToken = generateToken({ id: 'test', email: 'test@example.com', role: 'USER' })
      const decoded = verifyToken(testToken)
      jwtStatus = decoded.id === 'test' ? 'working' : 'verification_failed'
    } catch (jwtError) {
      jwtStatus = `error: ${jwtError instanceof Error ? jwtError.message : 'Unknown error'}`
    }

    sendSuccess(res, {
      environment: envCheck,
      database: dbStatus,
      jwt: jwtStatus,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Debug API error:', error)
    sendError(res, 'Debug check failed', 500, 'DEBUG_ERROR', 
      error instanceof Error ? error.message : 'Unknown error'
    )
  }
}