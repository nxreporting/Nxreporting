/**
 * Initialize monitoring and error handling for the application
 */

import { setupGlobalErrorHandlers } from './error-logger'

/**
 * Initialize comprehensive monitoring and error handling
 */
export function initializeMonitoring(): void {
  // Set up global error handlers
  setupGlobalErrorHandlers()

  // Log startup information
  console.info('MONITORING_INITIALIZED:', {
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    environment: process.env.NODE_ENV,
    vercelRegion: process.env.VERCEL_REGION,
    vercelPlan: process.env.VERCEL_PLAN,
    memoryLimit: process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE || 'unknown'
  })

  // Set up periodic health checks in development
  if (process.env.NODE_ENV === 'development') {
    setInterval(() => {
      const memoryUsage = process.memoryUsage()
      console.debug('PERIODIC_HEALTH_CHECK:', {
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memoryUsage: {
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
          external: Math.round(memoryUsage.external / 1024 / 1024) + 'MB'
        }
      })
    }, 60000) // Every minute in development
  }
}

/**
 * Graceful shutdown handler
 */
export function setupGracefulShutdown(): void {
  const gracefulShutdown = (signal: string) => {
    console.info(`GRACEFUL_SHUTDOWN_INITIATED: ${signal}`, {
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    })

    // Close database connections
    import('./prisma').then(({ prisma }) => {
      return prisma.$disconnect()
    }).catch(error => {
      console.error('Error disconnecting from database:', error)
    }).finally(() => {
      console.info('GRACEFUL_SHUTDOWN_COMPLETE:', {
        timestamp: new Date().toISOString(),
        signal
      })
      process.exit(0)
    })
  }

  // Handle different shutdown signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
  process.on('SIGINT', () => gracefulShutdown('SIGINT'))
  
  // Handle specific to Vercel
  process.on('SIGQUIT', () => gracefulShutdown('SIGQUIT'))
}

// Auto-initialize if this module is imported
if (typeof window === 'undefined') { // Only in Node.js environment
  initializeMonitoring()
  setupGracefulShutdown()
}