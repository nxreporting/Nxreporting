# Design Document: Vercel + Supabase Migration

## Overview

This design document outlines the architectural transformation of the PDF Data Extraction & Reporting System from a traditional Express.js backend hosted on Railway with PlanetScale database to a modern serverless architecture using Vercel for full-stack deployment and Supabase for database services.

The migration involves converting the Express.js API server to Next.js API routes, migrating from PlanetScale MySQL to Supabase PostgreSQL, implementing serverless-compatible file handling, and establishing automated Git-based deployments.

## Architecture

### Current Architecture
```
Frontend (Next.js) → Railway (Express.js) → PlanetScale (MySQL)
                                        ↓
                                   File Storage (Local)
```

### Target Architecture
```
Vercel (Next.js + API Routes) → Supabase (PostgreSQL)
                            ↓
                    Vercel Blob Storage / Supabase Storage
```

### Key Architectural Changes

1. **Backend Consolidation**: Express.js server routes converted to Next.js API routes
2. **Database Migration**: PlanetScale MySQL → Supabase PostgreSQL  
3. **File Storage**: Local filesystem → Vercel Blob or Supabase Storage
4. **Deployment**: Manual Railway deployment → Automated Vercel Git deployment
5. **Environment**: Traditional server → Serverless functions

## Components and Interfaces

### 1. Next.js API Routes Structure

The existing Express.js routes will be converted to Next.js API routes with the following mapping:

```
backend/src/routes/auth.ts     → frontend/pages/api/auth/[...auth].ts
backend/src/routes/files.ts    → frontend/pages/api/files/[...files].ts
backend/src/routes/data.ts     → frontend/pages/api/data/[...data].ts
backend/src/routes/reports.ts  → frontend/pages/api/reports/[...reports].ts
backend/src/routes/extract.ts  → frontend/pages/api/extract.ts
backend/src/routes/brands.ts   → frontend/pages/api/brands/[...brands].ts
```

### 2. Database Layer Migration

**Prisma Schema Compatibility**:
- Current PostgreSQL schema is already compatible with Supabase
- No schema changes required, only connection string update
- Existing migrations can be applied to Supabase database

**Connection Management**:
```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### 3. File Upload and Storage System

**Current Implementation Issues**:
- Uses multer with local filesystem storage
- Incompatible with Vercel's ephemeral filesystem
- Files stored in `/uploads` directory

**Serverless Solution**:
```typescript
// lib/storage.ts
import { put } from '@vercel/blob'

export async function uploadFile(file: File): Promise<string> {
  const blob = await put(file.name, file, {
    access: 'public',
  })
  return blob.url
}
```

**Alternative: Supabase Storage**:
```typescript
// lib/supabase-storage.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function uploadToSupabase(file: File): Promise<string> {
  const { data, error } = await supabase.storage
    .from('pdf-uploads')
    .upload(`${Date.now()}-${file.name}`, file)
  
  if (error) throw error
  return data.path
}
```

### 4. Authentication System Migration

**Current JWT Implementation**:
- Custom JWT generation and validation
- Middleware-based authentication
- User management via Prisma

**Serverless Adaptation**:
```typescript
// lib/auth.ts
import jwt from 'jsonwebtoken'
import { NextApiRequest } from 'next'

export function verifyToken(req: NextApiRequest): any {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) throw new Error('No token provided')
  
  return jwt.verify(token, process.env.JWT_SECRET!)
}

export function withAuth(handler: Function) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const user = verifyToken(req)
      req.user = user
      return handler(req, res)
    } catch (error) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
  }
}
```

### 5. PDF Processing Service Migration

**Current Nanonets Integration**:
- File-based processing with local storage
- Synchronous processing within Express routes

**Serverless Constraints & Solutions**:
- 10-second timeout limit for Hobby plan (50s for Pro)
- Memory limitations (1GB default)
- No persistent filesystem

**Optimized Implementation**:
```typescript
// pages/api/extract.ts
import { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import { nanonetsService } from '../../lib/services/nanonetsService'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Parse multipart form data
    const form = formidable({
      maxFileSize: 50 * 1024 * 1024, // 50MB
      keepExtensions: true,
    })

    const [fields, files] = await form.parse(req)
    const file = Array.isArray(files.file) ? files.file[0] : files.file

    if (!file) {
      return res.status(400).json({ error: 'No file provided' })
    }

    // Process with Nanonets (optimized for serverless)
    const result = await nanonetsService.extractFromBuffer(
      await fs.readFile(file.filepath),
      file.originalFilename || 'document.pdf'
    )

    // Clean up temporary file
    await fs.unlink(file.filepath)

    return res.json(result)
  } catch (error) {
    console.error('Extraction error:', error)
    return res.status(500).json({ error: 'Processing failed' })
  }
}
```

## Data Models

### Database Schema Compatibility

The existing Prisma schema is fully compatible with Supabase PostgreSQL:

```prisma
// No changes required to existing schema
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL") // Will point to Supabase
}

// All existing models remain unchanged
model User { ... }
model UploadedFile { ... }
model ExtractedData { ... }
model AuditLog { ... }
```

### File Storage Data Model

**New File Reference System**:
```typescript
// Update UploadedFile model to support cloud storage
model UploadedFile {
  id            String   @id @default(cuid())
  originalName  String
  filename      String
  path          String   // Now stores cloud storage URL
  storageType   String   @default("vercel_blob") // "vercel_blob" | "supabase"
  mimetype      String
  size          Int
  uploadedAt    DateTime @default(now())
  
  // Relations remain unchanged
  uploadedBy   User   @relation(fields: [uploadedById], references: [id])
  uploadedById String
  extractedData ExtractedData[]

  @@map("uploaded_files")
}
```

## Error Handling

### Serverless Function Error Patterns

**Timeout Handling**:
```typescript
// lib/timeout-handler.ts
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 45000
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Function timeout')), timeoutMs)
    )
  ])
}
```

**Memory Management**:
```typescript
// lib/memory-monitor.ts
export function checkMemoryUsage() {
  const used = process.memoryUsage()
  const maxMemory = 1024 * 1024 * 1024 // 1GB
  
  if (used.heapUsed > maxMemory * 0.8) {
    console.warn('High memory usage detected:', used)
    // Implement cleanup or early return
  }
}
```

**Database Connection Pooling**:
```typescript
// lib/prisma.ts - Enhanced with connection management
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

// Ensure connections are properly closed
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})
```

### Error Response Standardization

```typescript
// lib/api-response.ts
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
  }
}

export function createErrorResponse(
  message: string,
  code?: string,
  details?: any
): ApiResponse {
  return {
    success: false,
    error: { message, code, details },
    metadata: {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID()
    }
  }
}
```

## Testing Strategy

### 1. API Route Testing

**Unit Tests for API Routes**:
```typescript
// __tests__/api/extract.test.ts
import handler from '../../pages/api/extract'
import { createMocks } from 'node-mocks-http'

describe('/api/extract', () => {
  it('should handle PDF upload and extraction', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      // Mock file upload
    })

    await handler(req, res)
    
    expect(res._getStatusCode()).toBe(200)
    expect(JSON.parse(res._getData())).toMatchObject({
      success: true,
      data: expect.any(Object)
    })
  })
})
```

### 2. Database Migration Testing

**Migration Validation**:
```typescript
// scripts/validate-migration.ts
import { PrismaClient } from '@prisma/client'

async function validateMigration() {
  const prisma = new PrismaClient()
  
  try {
    // Test basic operations
    const userCount = await prisma.user.count()
    const fileCount = await prisma.uploadedFile.count()
    
    console.log(`✅ Migration validated: ${userCount} users, ${fileCount} files`)
  } catch (error) {
    console.error('❌ Migration validation failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}
```

### 3. Integration Testing

**End-to-End API Testing**:
```typescript
// __tests__/integration/pdf-processing.test.ts
describe('PDF Processing Integration', () => {
  it('should complete full PDF upload and extraction flow', async () => {
    // 1. Upload PDF
    const uploadResponse = await fetch('/api/extract', {
      method: 'POST',
      body: formData
    })
    
    // 2. Verify extraction results
    expect(uploadResponse.ok).toBe(true)
    
    // 3. Check database persistence
    const extractedData = await prisma.extractedData.findFirst({
      where: { fileId: uploadedFile.id }
    })
    
    expect(extractedData).toBeTruthy()
  })
})
```

### 4. Performance Testing

**Serverless Function Performance**:
```typescript
// __tests__/performance/function-limits.test.ts
describe('Serverless Function Limits', () => {
  it('should process files within timeout limits', async () => {
    const startTime = Date.now()
    
    const response = await fetch('/api/extract', {
      method: 'POST',
      body: largePdfFormData
    })
    
    const duration = Date.now() - startTime
    expect(duration).toBeLessThan(45000) // 45s timeout
    expect(response.ok).toBe(true)
  })
})
```

## Deployment Configuration

### 1. Vercel Configuration

**vercel.json**:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "functions": {
    "pages/api/extract.js": {
      "maxDuration": 50
    }
  },
  "env": {
    "DATABASE_URL": "@database-url",
    "JWT_SECRET": "@jwt-secret",
    "NANONETS_API_KEY": "@nanonets-api-key"
  }
}
```

### 2. Environment Variables

**Production Environment Setup**:
```bash
# Supabase Configuration
DATABASE_URL="postgresql://postgres:[password]@[project-ref].supabase.co:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://[project-ref].supabase.co"
SUPABASE_SERVICE_ROLE_KEY="[service-role-key]"

# Authentication
JWT_SECRET="[secure-random-string]"
JWT_EXPIRES_IN="7d"

# External Services
NANONETS_API_KEY="[nanonets-api-key]"
OPENAI_API_KEY="[openai-api-key]"

# File Storage
BLOB_READ_WRITE_TOKEN="[vercel-blob-token]"
```

### 3. Build Configuration

**package.json Scripts**:
```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "postbuild": "prisma migrate deploy",
    "start": "next start",
    "dev": "next dev",
    "db:migrate": "prisma migrate deploy",
    "db:generate": "prisma generate"
  }
}
```

### 4. Git Deployment Workflow

**Automatic Deployment Triggers**:
- Push to `main` branch → Production deployment
- Push to `develop` branch → Preview deployment
- Pull requests → Preview deployments with unique URLs

**Build Process**:
1. Install dependencies (`npm ci`)
2. Generate Prisma client (`prisma generate`)
3. Run database migrations (`prisma migrate deploy`)
4. Build Next.js application (`next build`)
5. Deploy to Vercel edge network

## Migration Strategy

### Phase 1: Database Migration
1. Set up Supabase project
2. Export data from PlanetScale
3. Import data to Supabase
4. Update connection strings
5. Validate data integrity

### Phase 2: Backend Conversion
1. Create Next.js API routes structure
2. Convert Express routes to API handlers
3. Implement serverless-compatible file handling
4. Update authentication middleware
5. Test API functionality

### Phase 3: Deployment Setup
1. Configure Vercel project
2. Set up environment variables
3. Configure build settings
4. Test deployment pipeline
5. Set up monitoring

### Phase 4: Production Cutover
1. Update DNS/domain settings
2. Monitor application performance
3. Validate all functionality
4. Decommission Railway services

## Performance Considerations

### Serverless Optimization
- **Cold Start Mitigation**: Keep functions warm with minimal dependencies
- **Memory Optimization**: Monitor and optimize memory usage for large file processing
- **Timeout Management**: Implement proper timeout handling for long-running operations
- **Connection Pooling**: Use Prisma's connection pooling for database efficiency

### File Processing Optimization
- **Streaming**: Use streaming for large file uploads when possible
- **Compression**: Implement file compression before storage
- **Caching**: Cache frequently accessed extracted data
- **Batch Processing**: Consider background processing for large files

This design provides a comprehensive roadmap for migrating from Railway + PlanetScale to Vercel + Supabase while maintaining all existing functionality and improving deployment automation.