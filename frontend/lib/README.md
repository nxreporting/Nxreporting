# Shared Utilities for Serverless Environment

This directory contains shared utilities and configuration for the serverless migration from Railway + PlanetScale to Vercel + Supabase.

## Files Overview

### Core Utilities

- **`prisma.ts`** - Serverless-optimized Prisma client configuration
- **`auth.ts`** - JWT authentication utilities for API routes
- **`api-response.ts`** - Standardized API response helpers
- **`storage.ts`** - File storage utilities (Vercel Blob or Supabase Storage)
- **`config.ts`** - Environment configuration and validation
- **`timeout.ts`** - Timeout and memory management utilities for serverless functions

### Supporting Files

- **`index.ts`** - Main export file for all utilities
- **`README.md`** - This documentation file

## Usage Examples

### Prisma Client

```typescript
import { prisma, connectToDatabase } from '../lib/prisma'

// Use in API routes
const users = await prisma.user.findMany()

// Check connection
const { success, error } = await connectToDatabase()
```

### Authentication

```typescript
import { withAuth, generateToken, verifyToken } from '../lib/auth'

// Protect API routes
export default withAuth(async (req, res) => {
  // req.user is now available
  console.log('User:', req.user)
})

// Generate tokens
const token = generateToken({ id: '1', email: 'user@example.com', role: 'USER' })
```

### API Responses

```typescript
import { sendSuccess, sendError, withErrorHandling } from '../lib/api-response'

export default withErrorHandling(async (req, res) => {
  const data = await someOperation()
  sendSuccess(res, data, 200)
})
```

### File Storage

```typescript
import { uploadFile, deleteFile, validateFile } from '../lib/storage'

// Upload file
const result = await uploadFile(file, 'document.pdf')
if (result.success) {
  console.log('File uploaded:', result.url)
}

// Validate file
const validation = validateFile(file, { maxSize: 50 * 1024 * 1024 })
if (!validation.valid) {
  console.error('Validation failed:', validation.error)
}
```

### Configuration

```typescript
import { getConfig, isDevelopment, getFunctionTimeout } from '../lib/config'

const config = getConfig()
const timeout = getFunctionTimeout()
```

### Timeout Management

```typescript
import { withTimeout, executeWithLimits } from '../lib/timeout'

// Add timeout to operations
const result = await withTimeout(longRunningOperation(), 30000)

// Execute with memory monitoring
const result = await executeWithLimits(async () => {
  return await processLargeFile()
}, { timeoutMs: 45000, maxMemoryMB: 1024 })
```

## Environment Variables

The utilities expect the following environment variables:

### Required
- `DATABASE_URL` - Supabase PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT token signing

### Optional
- `JWT_EXPIRES_IN` - JWT token expiration (default: '7d')
- `STORAGE_PROVIDER` - 'vercel' or 'supabase' (default: 'vercel')
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage token
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `SUPABASE_STORAGE_BUCKET` - Supabase storage bucket name
- `NANONETS_API_KEY` - Nanonets API key for PDF extraction
- `OPENAI_API_KEY` - OpenAI API key
- `MAX_FILE_SIZE_MB` - Maximum file size in MB (default: 50)
- `VERCEL_FUNCTION_TIMEOUT` - Function timeout in seconds

## Migration Notes

These utilities are designed to replace the Express.js backend functionality with Next.js API routes:

1. **Database**: Prisma client optimized for serverless with connection pooling
2. **Authentication**: JWT-based auth compatible with existing tokens
3. **File Storage**: Cloud storage instead of local filesystem
4. **Error Handling**: Standardized responses with proper HTTP status codes
5. **Timeouts**: Built-in timeout and memory management for serverless constraints

## Testing

Basic tests are available in `__tests__/utilities.test.ts`. Run with:

```bash
npm run test:utilities
```

## Dependencies

The utilities require these packages:
- `@prisma/client` - Database ORM
- `jsonwebtoken` - JWT token handling
- `@vercel/blob` - Vercel Blob storage
- `@supabase/supabase-js` - Supabase client
- `formidable` - File upload parsing