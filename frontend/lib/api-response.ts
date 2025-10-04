import { NextApiResponse } from 'next'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    message: string
    code?: string
    details?: any
  }
  metadata?: {
    timestamp: string
    requestId: string
    pagination?: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
}

export interface PaginationParams {
  page: number
  limit: number
  total: number
}

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Create a successful API response
 */
export function createSuccessResponse<T>(
  data: T,
  pagination?: PaginationParams
): ApiResponse<T> {
  const response: ApiResponse<T> = {
    success: true,
    data,
    metadata: {
      timestamp: new Date().toISOString(),
      requestId: generateRequestId()
    }
  }

  if (pagination) {
    response.metadata!.pagination = {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit)
    }
  }

  return response
}

/**
 * Create an error API response
 */
export function createErrorResponse(
  message: string,
  code?: string,
  details?: any
): ApiResponse {
  return {
    success: false,
    error: { 
      message, 
      code, 
      details 
    },
    metadata: {
      timestamp: new Date().toISOString(),
      requestId: generateRequestId()
    }
  }
}

/**
 * Send a successful response
 */
export function sendSuccess<T>(
  res: NextApiResponse<ApiResponse<T>>,
  data: T,
  statusCode: number = 200,
  pagination?: PaginationParams
): void {
  const response = createSuccessResponse(data, pagination)
  res.status(statusCode).json(response)
}

/**
 * Send an error response
 */
export function sendError(
  res: NextApiResponse<ApiResponse>,
  message: string,
  statusCode: number = 500,
  code?: string,
  details?: any
): void {
  const response = createErrorResponse(message, code, details)
  res.status(statusCode).json(response)
}

/**
 * Send a validation error response
 */
export function sendValidationError(
  res: NextApiResponse<ApiResponse>,
  message: string = 'Validation failed',
  details?: any
): void {
  sendError(res, message, 400, 'VALIDATION_ERROR', details)
}

/**
 * Send an unauthorized error response
 */
export function sendUnauthorizedError(
  res: NextApiResponse<ApiResponse>,
  message: string = 'Unauthorized access'
): void {
  sendError(res, message, 401, 'UNAUTHORIZED')
}

/**
 * Send a forbidden error response
 */
export function sendForbiddenError(
  res: NextApiResponse<ApiResponse>,
  message: string = 'Access forbidden'
): void {
  sendError(res, message, 403, 'FORBIDDEN')
}

/**
 * Send a not found error response
 */
export function sendNotFoundError(
  res: NextApiResponse<ApiResponse>,
  message: string = 'Resource not found'
): void {
  sendError(res, message, 404, 'NOT_FOUND')
}

/**
 * Send a method not allowed error response
 */
export function sendMethodNotAllowedError(
  res: NextApiResponse<ApiResponse>,
  allowedMethods: string[] = []
): void {
  const message = allowedMethods.length 
    ? `Method not allowed. Allowed methods: ${allowedMethods.join(', ')}`
    : 'Method not allowed'
  
  sendError(res, message, 405, 'METHOD_NOT_ALLOWED', { allowedMethods })
}

/**
 * Send an internal server error response
 */
export function sendInternalServerError(
  res: NextApiResponse<ApiResponse>,
  message: string = 'Internal server error',
  details?: any
): void {
  // Log the error details for debugging (don't expose to client in production)
  if (process.env.NODE_ENV === 'development') {
    console.error('Internal Server Error:', details)
  }
  
  sendError(res, message, 500, 'INTERNAL_SERVER_ERROR', 
    process.env.NODE_ENV === 'development' ? details : undefined
  )
}

/**
 * Handle async API route errors with comprehensive logging
 */
export function withErrorHandling(
  handler: (req: any, res: NextApiResponse<ApiResponse>) => Promise<void>
) {
  return async (req: any, res: NextApiResponse<ApiResponse>) => {
    const startTime = Date.now()
    
    try {
      await handler(req, res)
      
      // Log successful request performance
      const duration = Date.now() - startTime
      if (duration > 1000) { // Log slow requests
        console.info('SLOW_REQUEST:', {
          endpoint: req.url,
          method: req.method,
          duration,
          timestamp: new Date().toISOString()
        })
      }
    } catch (error) {
      const duration = Date.now() - startTime
      
      // Import error logger dynamically to avoid circular dependencies
      const { logError, createErrorContext, getErrorResponse, createErrorFromUnknown } = 
        await import('./error-logger')
      
      const appError = createErrorFromUnknown(error)
      const context = createErrorContext(req, { duration })
      
      // Log the error with context
      logError(appError, 'error' as any, context)
      
      // Get standardized error response
      const errorResponse = getErrorResponse(appError)
      
      // Send error response
      sendError(
        res, 
        errorResponse.message, 
        errorResponse.statusCode, 
        errorResponse.code, 
        errorResponse.details
      )
    }
  }
}

/**
 * Validate HTTP method
 */
export function validateMethod(
  req: any,
  res: NextApiResponse<ApiResponse>,
  allowedMethods: string[]
): boolean {
  if (!allowedMethods.includes(req.method)) {
    sendMethodNotAllowedError(res, allowedMethods)
    return false
  }
  return true
}