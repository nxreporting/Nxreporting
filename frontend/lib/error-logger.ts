/**
 * Comprehensive error logging and monitoring utilities
 */

export interface ErrorContext {
  requestId?: string
  userId?: string
  endpoint?: string
  method?: string
  userAgent?: string
  ip?: string
  timestamp?: string
  memoryUsage?: any
  additionalData?: Record<string, any>
  originalError?: any
}

export interface LoggedError {
  message: string
  stack?: string
  code?: string
  type: 'error' | 'warning' | 'info'
  context: ErrorContext
}

/**
 * Error types for categorization
 */
export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTH_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  DATABASE = 'DATABASE_ERROR',
  EXTERNAL_API = 'EXTERNAL_API_ERROR',
  FILE_PROCESSING = 'FILE_PROCESSING_ERROR',
  TIMEOUT = 'TIMEOUT_ERROR',
  MEMORY = 'MEMORY_ERROR',
  NETWORK = 'NETWORK_ERROR',
  INTERNAL = 'INTERNAL_ERROR',
  RATE_LIMIT = 'RATE_LIMIT_ERROR'
}

/**
 * Log levels
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

/**
 * Enhanced error class with context
 */
export class AppError extends Error {
  public readonly code: string
  public readonly statusCode: number
  public readonly context: ErrorContext
  public readonly isOperational: boolean

  constructor(
    message: string,
    code: string = ErrorType.INTERNAL,
    statusCode: number = 500,
    context: ErrorContext = {},
    isOperational: boolean = true
  ) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.statusCode = statusCode
    this.context = {
      ...context,
      timestamp: new Date().toISOString()
    }
    this.isOperational = isOperational

    // Capture stack trace
    Error.captureStackTrace(this, AppError)
  }
}

/**
 * Create context from Next.js API request
 */
export function createErrorContext(req?: any, additionalData?: Record<string, any>): ErrorContext {
  const context: ErrorContext = {
    timestamp: new Date().toISOString(),
    additionalData
  }

  if (req) {
    context.endpoint = req.url
    context.method = req.method
    context.userAgent = req.headers?.['user-agent']
    context.ip = req.headers?.['x-forwarded-for'] || req.connection?.remoteAddress
    context.requestId = req.headers?.['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Add user info if available
    if (req.user) {
      context.userId = req.user.id
    }
  }

  return context
}

/**
 * Log error with context
 */
export function logError(
  error: Error | string,
  level: LogLevel = LogLevel.ERROR,
  context: ErrorContext = {}
): void {
  const errorMessage = typeof error === 'string' ? error : error.message
  const errorStack = typeof error === 'string' ? undefined : error.stack

  const logEntry: LoggedError = {
    message: errorMessage,
    stack: errorStack,
    code: error instanceof AppError ? error.code : undefined,
    type: level === LogLevel.ERROR ? 'error' : level === LogLevel.WARN ? 'warning' : 'info',
    context: {
      ...context,
      timestamp: context.timestamp || new Date().toISOString()
    }
  }

  // Log to console with appropriate level
  switch (level) {
    case LogLevel.ERROR:
      console.error('ERROR:', logEntry)
      break
    case LogLevel.WARN:
      console.warn('WARNING:', logEntry)
      break
    case LogLevel.INFO:
      console.info('INFO:', logEntry)
      break
    case LogLevel.DEBUG:
      console.debug('DEBUG:', logEntry)
      break
  }

  // In production, you might want to send to external logging service
  if (process.env.NODE_ENV === 'production' && level === LogLevel.ERROR) {
    // TODO: Integrate with external logging service (e.g., Sentry, LogRocket, etc.)
    sendToExternalLogger(logEntry)
  }
}

/**
 * Log performance metrics
 */
export function logPerformance(
  operation: string,
  duration: number,
  context: ErrorContext = {}
): void {
  const performanceLog = {
    operation,
    duration,
    timestamp: new Date().toISOString(),
    ...context
  }

  console.info('PERFORMANCE:', performanceLog)

  // Warn if operation is slow
  if (duration > 5000) { // 5 seconds
    console.warn('SLOW_OPERATION:', performanceLog)
  }
}

/**
 * Log memory usage
 */
export function logMemoryUsage(context: ErrorContext = {}): void {
  const memoryUsage = process.memoryUsage()
  const memoryLog = {
    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
    external: Math.round(memoryUsage.external / 1024 / 1024) + 'MB',
    rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB',
    timestamp: new Date().toISOString(),
    ...context
  }

  console.info('MEMORY_USAGE:', memoryLog)
}

/**
 * Create error from unknown type
 */
export function createErrorFromUnknown(error: unknown, defaultMessage: string = 'An unknown error occurred'): AppError {
  if (error instanceof AppError) {
    return error
  }
  
  if (error instanceof Error) {
    return new AppError(error.message, ErrorType.INTERNAL, 500, {}, true)
  }
  
  if (typeof error === 'string') {
    return new AppError(error, ErrorType.INTERNAL, 500, {}, true)
  }
  
  return new AppError(defaultMessage, ErrorType.INTERNAL, 500, { originalError: error }, true)
}

/**
 * Send error to external logging service (placeholder)
 */
function sendToExternalLogger(logEntry: LoggedError): void {
  // Placeholder for external logging service integration
  // Examples: Sentry, LogRocket, DataDog, etc.
  
  if (process.env.SENTRY_DSN) {
    // TODO: Integrate with Sentry
    console.log('Would send to Sentry:', logEntry)
  }
  
  if (process.env.LOGROCKET_APP_ID) {
    // TODO: Integrate with LogRocket
    console.log('Would send to LogRocket:', logEntry)
  }
}

/**
 * Middleware to catch and log unhandled errors
 */
export function setupGlobalErrorHandlers(): void {
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason: unknown, promise: Promise<any>) => {
    const error = createErrorFromUnknown(reason, 'Unhandled Promise Rejection')
    logError(error, LogLevel.ERROR, {
      additionalData: { 
        type: 'unhandledRejection',
        promise: promise.toString()
      }
    })
  })

  // Handle uncaught exceptions
  process.on('uncaughtException', (error: Error) => {
    logError(error, LogLevel.ERROR, {
      additionalData: { 
        type: 'uncaughtException'
      }
    })
    
    // In production, you might want to gracefully shutdown
    if (process.env.NODE_ENV === 'production') {
      console.error('Uncaught exception, shutting down gracefully...')
      process.exit(1)
    }
  })

  // Handle warnings
  process.on('warning', (warning: Error) => {
    logError(warning, LogLevel.WARN, {
      additionalData: { 
        type: 'processWarning'
      }
    })
  })
}

/**
 * Create standardized error responses for different error types
 */
export function getErrorResponse(error: AppError | Error): {
  message: string
  code: string
  statusCode: number
  details?: any
} {
  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: process.env.NODE_ENV === 'development' ? error.context : undefined
    }
  }

  // Handle specific error types
  if (error.message.includes('timeout') || error.message.includes('timed out')) {
    return {
      message: 'Operation timed out. Please try again.',
      code: ErrorType.TIMEOUT,
      statusCode: 408
    }
  }

  if (error.message.includes('memory') || error.message.includes('heap')) {
    return {
      message: 'Server is experiencing high load. Please try again later.',
      code: ErrorType.MEMORY,
      statusCode: 503
    }
  }

  if (error.message.includes('ECONNREFUSED') || error.message.includes('network')) {
    return {
      message: 'Network error occurred. Please check your connection.',
      code: ErrorType.NETWORK,
      statusCode: 503
    }
  }

  // Default internal server error
  return {
    message: process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'An internal server error occurred',
    code: ErrorType.INTERNAL,
    statusCode: 500,
    details: process.env.NODE_ENV === 'development' ? error.stack : undefined
  }
}