# Comprehensive Error Handling and Monitoring

This document describes the comprehensive error handling and monitoring system implemented for the Vercel + Supabase migration.

## Overview

The monitoring system provides:
- **Timeout handling** for serverless function limits
- **Memory usage monitoring** for large file processing
- **Error logging and response formatting** across all API routes
- **Health check endpoint** for system monitoring
- **Performance monitoring** and metrics collection
- **Rate limiting** to prevent abuse
- **Global error handlers** for unhandled errors

## Components

### 1. Timeout Utilities (`lib/timeout.ts`)

Enhanced timeout utilities with serverless-specific optimizations:

```typescript
import { withTimeout, getTimeoutForOperation, checkMemoryUsage } from '../lib/timeout'

// Basic timeout wrapper
const result = await withTimeout(
  someAsyncOperation(),
  30000, // 30 seconds
  'Operation timed out'
)

// Get appropriate timeout for operation type
const timeout = getTimeoutForOperation('extract') // Returns 50s for Pro, 8s for Hobby

// Monitor memory usage
const memoryInfo = checkMemoryUsage() // Returns detailed memory information
```

### 2. Error Logging (`lib/error-logger.ts`)

Comprehensive error logging with context:

```typescript
import { logError, AppError, ErrorType, createErrorContext } from '../lib/error-logger'

// Create application error with context
const error = new AppError(
  'File processing failed',
  ErrorType.FILE_PROCESSING,
  422,
  { fileSize: 1024000, fileName: 'document.pdf' }
)

// Log error with request context
logError(error, 'error', createErrorContext(req, { additionalData: 'value' }))
```

### 3. Monitoring Middleware (`lib/monitoring.ts`)

Comprehensive monitoring for API routes:

```typescript
import { 
  withMonitoring, 
  withExtractionMonitoring, 
  withFileUploadMonitoring,
  withComprehensiveMonitoring 
} from '../lib/monitoring'

// Basic monitoring
export default withMonitoring(handler, {
  operationType: 'api',
  enableMemoryMonitoring: true,
  enablePerformanceLogging: true
})

// Specialized monitoring for file uploads
export default withFileUploadMonitoring(handler)

// Specialized monitoring for PDF extraction
export default withExtractionMonitoring(handler)

// Comprehensive monitoring with rate limiting
export default withComprehensiveMonitoring(handler, {
  operationType: 'api',
  enableRateLimit: true,
  rateLimitOptions: {
    maxRequests: 100,
    windowMs: 15 * 60 * 1000 // 15 minutes
  }
})
```

### 4. Health Check Endpoint (`pages/api/health.ts`)

Comprehensive health check endpoint at `/api/health`:

```bash
GET /api/health
```

Returns:
- Overall system status (`healthy`, `degraded`, `unhealthy`)
- Database connectivity and response time
- Memory usage and limits
- External service configuration status
- System uptime and version information

### 5. Initialization (`lib/init-monitoring.ts`)

Automatic initialization of global error handlers:

```typescript
import '../lib/init-monitoring' // Auto-initializes monitoring
```

This sets up:
- Global unhandled promise rejection handlers
- Uncaught exception handlers
- Process warning handlers
- Graceful shutdown handlers

## Usage Examples

### Basic API Route with Monitoring

```typescript
import { NextApiRequest, NextApiResponse } from 'next'
import { withComprehensiveMonitoring } from '../../lib/monitoring'
import { sendSuccess, sendError } from '../../lib/api-response'
import '../../lib/init-monitoring'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Your API logic here
    const data = await someOperation()
    sendSuccess(res, data)
  } catch (error) {
    // Error will be automatically logged and handled by monitoring middleware
    throw error
  }
}

export default withComprehensiveMonitoring(handler, {
  operationType: 'api',
  enableRateLimit: true
})
```

### File Upload API with Memory Monitoring

```typescript
import { withFileUploadMonitoring } from '../../lib/monitoring'
import { checkMemoryUsage, isMemoryCritical } from '../../lib/timeout'

async function uploadHandler(req: NextApiRequest, res: NextApiResponse) {
  // Check memory before processing
  if (isMemoryCritical()) {
    throw new AppError('Server memory critical', ErrorType.MEMORY, 503)
  }

  // Process file upload
  const result = await processFileUpload(req)
  
  // Monitor memory during processing
  checkMemoryUsage()
  
  sendSuccess(res, result)
}

export default withFileUploadMonitoring(uploadHandler)
```

### Database API with Performance Monitoring

```typescript
import { withDatabaseMonitoring } from '../../lib/monitoring'
import { logPerformance } from '../../lib/error-logger'

async function databaseHandler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now()
  
  const data = await prisma.user.findMany()
  
  // Log performance metrics
  logPerformance('database_query', Date.now() - startTime)
  
  sendSuccess(res, data)
}

export default withDatabaseMonitoring(databaseHandler)
```

## Configuration

### Environment Variables

```bash
# Error Logging
SENTRY_DSN=your_sentry_dsn_here
LOGROCKET_APP_ID=your_logrocket_id_here

# Vercel Configuration
VERCEL_PLAN=pro  # Affects timeout limits
VERCEL_REGION=iad1

# Application
NODE_ENV=production
```

### Vercel Function Configuration

```json
// vercel.json
{
  "functions": {
    "pages/api/extract.js": {
      "maxDuration": 50
    },
    "pages/api/health.js": {
      "maxDuration": 10
    }
  }
}
```

## Monitoring Features

### 1. Automatic Error Logging

All errors are automatically logged with:
- Request context (URL, method, user agent, IP)
- User information (if authenticated)
- Memory usage at time of error
- Stack traces (in development)
- Unique request IDs for tracking

### 2. Performance Monitoring

Tracks:
- Request duration
- Memory usage before/after requests
- Slow request warnings (>1s)
- Database query performance
- External API call performance

### 3. Memory Monitoring

For file processing operations:
- Real-time memory usage tracking
- Memory leak detection
- Critical memory warnings
- Automatic garbage collection suggestions

### 4. Rate Limiting

Configurable rate limiting:
- Per-IP request limits
- Sliding window algorithm
- Customizable limits per endpoint
- Automatic cleanup of old entries

### 5. Health Monitoring

Comprehensive health checks:
- Database connectivity
- Memory usage status
- External service configuration
- System uptime and version

## Best Practices

### 1. Use Appropriate Monitoring

```typescript
// For simple API routes
export default withComprehensiveMonitoring(handler)

// For file uploads
export default withFileUploadMonitoring(handler)

// For PDF extraction
export default withExtractionMonitoring(handler)

// For database operations
export default withDatabaseMonitoring(handler)
```

### 2. Handle Errors Gracefully

```typescript
try {
  const result = await riskyOperation()
  sendSuccess(res, result)
} catch (error) {
  // Let monitoring middleware handle the error
  throw error // Don't catch and re-throw unnecessarily
}
```

### 3. Monitor Critical Operations

```typescript
// Check memory before heavy operations
if (isMemoryCritical()) {
  throw new AppError('Server overloaded', ErrorType.MEMORY, 503)
}

// Use timeouts for external calls
const result = await withTimeout(
  externalApiCall(),
  getTimeoutForOperation('api')
)
```

### 4. Log Performance Metrics

```typescript
const startTime = Date.now()
const result = await heavyOperation()
logPerformance('heavy_operation', Date.now() - startTime)
```

## Troubleshooting

### Common Issues

1. **Memory Errors**: Check `/api/health` for memory status
2. **Timeout Errors**: Verify operation timeouts are appropriate for Vercel plan
3. **Rate Limit Errors**: Check rate limiting configuration
4. **Database Errors**: Monitor database connectivity in health checks

### Debugging

Enable detailed logging in development:

```typescript
// Development only
if (process.env.NODE_ENV === 'development') {
  console.debug('Detailed debug info:', debugData)
}
```

### Health Check Monitoring

Set up external monitoring to check `/api/health`:

```bash
# Example health check
curl https://your-app.vercel.app/api/health

# Expected response
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "checks": {
      "database": { "status": "up", "responseTime": 45 },
      "memory": { "status": "normal", "usage": {...} }
    }
  }
}
```

This monitoring system provides comprehensive observability for the Vercel + Supabase architecture while maintaining optimal performance and reliability.