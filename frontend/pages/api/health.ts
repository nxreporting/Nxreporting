import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../lib/prisma'
import { getMemoryUsage, getMaxMemoryLimit, isMemoryCritical } from '../../lib/timeout'
import { createSuccessResponse, createErrorResponse, ApiResponse } from '../../lib/api-response'

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  environment: string
  uptime: number
  checks: {
    database: {
      status: 'up' | 'down'
      responseTime?: number
      error?: string
    }
    memory: {
      status: 'normal' | 'warning' | 'critical'
      usage: {
        heapUsedMB: number
        heapTotalMB: number
        percentageUsed: number
        maxMemoryMB: number
      }
    }
    disk: {
      status: 'available' | 'limited'
      note: string
    }
    external_services: {
      nanonets: {
        status: 'unknown' | 'configured'
        configured: boolean
      }
      openai: {
        status: 'unknown' | 'configured'
        configured: boolean
      }
    }
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<HealthCheckResponse>>
) {
  if (req.method !== 'GET') {
    return res.status(405).json(createErrorResponse('Method not allowed', 'METHOD_NOT_ALLOWED'))
  }

  const startTime = Date.now()
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'

  // Database health check
  let databaseCheck: HealthCheckResponse['checks']['database']
  try {
    const dbStartTime = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const dbResponseTime = Date.now() - dbStartTime
    
    databaseCheck = {
      status: 'up',
      responseTime: dbResponseTime
    }
    
    if (dbResponseTime > 1000) {
      overallStatus = 'degraded'
    }
  } catch (error) {
    databaseCheck = {
      status: 'down',
      error: error instanceof Error ? error.message : 'Database connection failed'
    }
    overallStatus = 'unhealthy'
  }

  // Memory health check
  const memoryUsage = getMemoryUsage()
  const maxMemory = getMaxMemoryLimit()
  const isCritical = isMemoryCritical(maxMemory)
  
  let memoryStatus: 'normal' | 'warning' | 'critical' = 'normal'
  if (isCritical) {
    memoryStatus = 'critical'
    overallStatus = 'unhealthy'
  } else if (memoryUsage.percentageUsed > 70) {
    memoryStatus = 'warning'
    if (overallStatus === 'healthy') {
      overallStatus = 'degraded'
    }
  }

  const memoryCheck: HealthCheckResponse['checks']['memory'] = {
    status: memoryStatus,
    usage: {
      heapUsedMB: memoryUsage.heapUsedMB,
      heapTotalMB: memoryUsage.heapTotalMB,
      percentageUsed: memoryUsage.percentageUsed,
      maxMemoryMB: maxMemory
    }
  }

  // Disk check (Vercel has ephemeral storage)
  const diskCheck: HealthCheckResponse['checks']['disk'] = {
    status: 'limited',
    note: 'Vercel serverless functions have ephemeral storage'
  }

  // External services check
  const externalServicesCheck: HealthCheckResponse['checks']['external_services'] = {
    nanonets: {
      status: process.env.NANONETS_API_KEY ? 'configured' : 'unknown',
      configured: !!process.env.NANONETS_API_KEY
    },
    openai: {
      status: process.env.OPENAI_API_KEY ? 'configured' : 'unknown',
      configured: !!process.env.OPENAI_API_KEY
    }
  }

  const healthData: HealthCheckResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    checks: {
      database: databaseCheck,
      memory: memoryCheck,
      disk: diskCheck,
      external_services: externalServicesCheck
    }
  }

  // Set appropriate HTTP status code
  let statusCode = 200
  if (overallStatus === 'degraded') {
    statusCode = 200 // Still operational but with warnings
  } else if (overallStatus === 'unhealthy') {
    statusCode = 503 // Service unavailable
  }

  // Log health check if there are issues
  if (overallStatus !== 'healthy') {
    console.warn('HEALTH_CHECK_WARNING:', {
      status: overallStatus,
      issues: {
        database: databaseCheck.status !== 'up',
        memory: memoryCheck.status !== 'normal'
      },
      timestamp: healthData.timestamp
    })
  }

  return res.status(statusCode).json(createSuccessResponse(healthData))
}

// Disable body parsing for this endpoint
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}