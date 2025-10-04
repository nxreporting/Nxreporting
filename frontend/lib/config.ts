/**
 * Configuration utilities for serverless environment
 * Centralizes environment variable handling and validation
 */

export interface ServerlessConfig {
  database: {
    url: string
  }
  jwt: {
    secret: string
    expiresIn: string
  }
  storage: {
    provider: 'vercel' | 'supabase'
    vercel?: {
      token: string
    }
    supabase?: {
      url: string
      serviceRoleKey: string
      bucket: string
    }
  }
  external: {
    nanonetsApiKey?: string
    openaiApiKey?: string
  }
  app: {
    environment: 'development' | 'production' | 'test'
    logLevel: 'error' | 'warn' | 'info' | 'debug'
  }
}

/**
 * Validate required environment variables
 */
function validateRequiredEnvVars(): void {
  const required = [
    'DATABASE_URL',
    'JWT_SECRET'
  ]

  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}

/**
 * Get validated configuration
 */
export function getConfig(): ServerlessConfig {
  validateRequiredEnvVars()

  const storageProvider = (process.env.STORAGE_PROVIDER as 'vercel' | 'supabase') || 'vercel'

  const config: ServerlessConfig = {
    database: {
      url: process.env.DATABASE_URL!
    },
    jwt: {
      secret: process.env.JWT_SECRET!,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    },
    storage: {
      provider: storageProvider
    },
    external: {
      nanonetsApiKey: process.env.NANONETS_API_KEY,
      openaiApiKey: process.env.OPENAI_API_KEY
    },
    app: {
      environment: (process.env.NODE_ENV as any) || 'development',
      logLevel: (process.env.LOG_LEVEL as any) || 'info'
    }
  }

  // Add storage-specific configuration
  if (storageProvider === 'vercel') {
    config.storage.vercel = {
      token: process.env.BLOB_READ_WRITE_TOKEN || ''
    }
  } else if (storageProvider === 'supabase') {
    config.storage.supabase = {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      bucket: process.env.SUPABASE_STORAGE_BUCKET || 'pdf-uploads'
    }
  }

  return config
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * Check if running in test mode
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test'
}

/**
 * Get database URL with connection pooling if available
 */
export function getDatabaseUrl(): string {
  // Use connection pooling URL if available (for Supabase)
  return process.env.DATABASE_POOLER_URL || process.env.DATABASE_URL!
}

/**
 * Get function timeout based on Vercel plan
 */
export function getFunctionTimeout(): number {
  // Hobby plan: 10s, Pro plan: 60s, Enterprise: 900s
  const timeout = process.env.VERCEL_FUNCTION_TIMEOUT
  if (timeout) {
    return parseInt(timeout, 10) * 1000 // Convert to milliseconds
  }
  
  // Default to 45 seconds (safe for most plans)
  return 45000
}

/**
 * Get maximum file size for uploads
 */
export function getMaxFileSize(): number {
  const maxSize = process.env.MAX_FILE_SIZE_MB
  if (maxSize) {
    return parseInt(maxSize, 10) * 1024 * 1024 // Convert MB to bytes
  }
  
  // Default to 50MB
  return 50 * 1024 * 1024
}