/**
 * Comprehensive monitoring utilities for API routes
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { getMemoryUsage, checkMemoryUsage, getTimeoutForOperation, withTimeout } from './timeout'
import { logError, logPerformance, createErrorContext, AppError, ErrorType } from './error-logger'
import { ApiResponse } from './api-response'

export interface MonitoringOptions {
  operationType?: 'upload' | 'extract' | 'api' | 'database'
  enableMemoryMonitoring?: boolean
  enablePerformanceLogging?: boolean
  memoryCheckInterval?: number
  timeoutMs?: number
  maxMemoryMB?: number
}

export interface RequestMetrics {
  startTime: number
  endTime?: number
  duration?: number
  memoryBefore: any
  memoryAfter?: any
  memoryDelta?: any
  endpoint: string
  method: string
  statusCode?: number
  error?: Error
}

/**
 * Monitor API request performance and resource usage
 */
export function withMonitoring(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,
  options: MonitoringOptions = {}
) {
  return async (req: NextApiRequest, res: NextApiResponse<ApiResponse>) => {
    const {
      operationType = 'api',
      enableMemoryMonitoring = true,
      enablePerformanceLogging = true,
      memoryCheckInterval = 5000,
      timeoutMs,
      maxMemoryMB
    } = options

    const metrics: RequestMetrics = {
      startTime: Date.now(),
      memoryBefore: enableMemoryMonitoring ? getMemoryUsage() : null,
      endpoint: req.url || 'unknown',
      method: req.method || 'unknown'
    }

    let memoryMonitorInterval: NodeJS.Timeout | null = null

    try {
      // Start memory monitoring if enabled
      if (enableMemoryMonitoring) {
        memoryMonitorInterval = setInterval(() => {
          const memoryInfo = checkMemoryUsage(0.8, maxMemoryMB)
          
          // If memory is critical, log warning
          if (memoryInfo.percentageUsed > 90) {
            logError(
              new AppError(
                'Critical memory usage detected',
                ErrorType.MEMORY,
                503,
                createErrorContext(req, { memoryInfo })
              ),
              'warn' as any
            )
          }
        }, memoryCheckInterval)
      }

      // Determine timeout for operation
      const operationTimeout = timeoutMs || getTimeoutForOperation(operationType)

      // Execute handler with timeout
      await withTimeout(
        handler(req, res),
        operationTimeout,
        `${operationType} operation timed out after ${operationTimeout}ms`
      )

      // Record success metrics
      metrics.endTime = Date.now()
      metrics.duration = metrics.endTime - metrics.startTime
      metrics.statusCode = res.statusCode

      if (enableMemoryMonitoring) {
        metrics.memoryAfter = getMemoryUsage()
        metrics.memoryDelta = {
          heapUsedDelta: metrics.memoryAfter.heapUsedMB - metrics.memoryBefore.heapUsedMB,
          heapTotalDelta: metrics.memoryAfter.heapTotalMB - metrics.memoryBefore.heapTotalMB
        }
      }

      // Log performance metrics
      if (enablePerformanceLogging) {
        logPerformance(
          `${metrics.method} ${metrics.endpoint}`,
          metrics.duration,
          createErrorContext(req, {
            operationType,
            memoryUsage: metrics.memoryAfter,
            memoryDelta: metrics.memoryDelta
          })
        )
      }

    } catch (error) {
      // Record error metrics
      metrics.endTime = Date.now()
      metrics.duration = metrics.endTime - metrics.startTime
      metrics.error = error instanceof Error ? error : new Error(String(error))

      if (enableMemoryMonitoring) {
        metrics.memoryAfter = getMemoryUsage()
      }

      // Log error with full context
      const errorContext = createErrorContext(req, {
        operationType,
        metrics,
        memoryUsage: metrics.memoryAfter
      })

      logError(metrics.error, 'error' as any, errorContext)

      // Re-throw to be handled by error handler
      throw error

    } finally {
      // Clean up memory monitoring
      if (memoryMonitorInterval) {
        clearInterval(memoryMonitorInterval)
      }

      // Log final metrics if enabled
      if (enablePerformanceLogging && metrics.duration) {
        console.info('REQUEST_METRICS:', {
          endpoint: metrics.endpoint,
          method: metrics.method,
          duration: metrics.duration,
          statusCode: metrics.statusCode,
          memoryDelta: metrics.memoryDelta,
          operationType,
          timestamp: new Date().toISOString()
        })
      }
    }
  }
}

/**
 * Middleware specifically for file upload operations
 */
export function withFileUploadMonitoring(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
) {
  return withMonitoring(handler, {
    operationType: 'upload',
    enableMemoryMonitoring: true,
    enablePerformanceLogging: true,
    memoryCheckInterval: 2000, // Check memory more frequently for uploads
    maxMemoryMB: 1024 // Conservative limit for file uploads
  })
}

/**
 * Middleware specifically for PDF extraction operations
 */
export function withExtractionMonitoring(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
) {
  return withMonitoring(handler, {
    operationType: 'extract',
    enableMemoryMonitoring: true,
    enablePerformanceLogging: true,
    memoryCheckInterval: 3000,
    maxMemoryMB: 2048 // Allow more memory for extraction
  })
}

/**
 * Middleware for database operations
 */
export function withDatabaseMonitoring(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
) {
  return withMonitoring(handler, {
    operationType: 'database',
    enableMemoryMonitoring: false, // DB operations typically don't use much memory
    enablePerformanceLogging: true,
    timeoutMs: 10000 // 10 second timeout for DB operations
  })
}

/**
 * Rate limiting utilities
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>()

export function withRateLimit(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,
  options: {
    maxRequests?: number
    windowMs?: number
    keyGenerator?: (req: NextApiRequest) => string
  } = {}
) {
  const {
    maxRequests = 100,
    windowMs = 15 * 60 * 1000, // 15 minutes
    keyGenerator = (req) => req.headers['x-forwarded-for'] as string || 'unknown'
  } = options

  return async (req: NextApiRequest, res: NextApiResponse<ApiResponse>) => {
    const key = keyGenerator(req)
    const now = Date.now()
    
    const requestData = requestCounts.get(key)
    
    if (!requestData || now > requestData.resetTime) {
      // Reset or initialize counter
      requestCounts.set(key, {
        count: 1,
        resetTime: now + windowMs
      })
    } else {
      // Increment counter
      requestData.count++
      
      if (requestData.count > maxRequests) {
        // Rate limit exceeded
        const resetIn = Math.ceil((requestData.resetTime - now) / 1000)
        
        logError(
          new AppError(
            'Rate limit exceeded',
            ErrorType.RATE_LIMIT,
            429,
            createErrorContext(req, { 
              rateLimitKey: key,
              requestCount: requestData.count,
              maxRequests,
              resetIn
            })
          ),
          'warn' as any
        )

        return res.status(429).json({
          success: false,
          error: {
            message: 'Too many requests. Please try again later.',
            code: ErrorType.RATE_LIMIT
          },
          metadata: {
            timestamp: new Date().toISOString(),
            requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          }
        })
      }
    }

    // Clean up old entries periodically
    if (Math.random() < 0.01) { // 1% chance to clean up
      const cutoff = now - windowMs
      const entries = Array.from(requestCounts.entries())
      for (const [key, data] of entries) {
        if (data.resetTime < cutoff) {
          requestCounts.delete(key)
        }
      }
    }

    return handler(req, res)
  }
}

/**
 * Comprehensive middleware that combines monitoring, error handling, and rate limiting
 */
export function withComprehensiveMonitoring(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,
  options: MonitoringOptions & {
    enableRateLimit?: boolean
    rateLimitOptions?: Parameters<typeof withRateLimit>[1]
  } = {}
) {
  const { enableRateLimit = false, rateLimitOptions, ...monitoringOptions } = options

  let wrappedHandler = withMonitoring(handler, monitoringOptions)

  if (enableRateLimit) {
    wrappedHandler = withRateLimit(wrappedHandler, rateLimitOptions)
  }

  // Import and apply error handling
  return async (req: NextApiRequest, res: NextApiResponse<ApiResponse>) => {
    const { withErrorHandling } = await import('./api-response')
    return withErrorHandling(wrappedHandler)(req, res)
  }
}