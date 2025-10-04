/**
 * Timeout utilities for serverless functions
 */

/**
 * Wrap a promise with a timeout
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 45000,
  timeoutMessage: string = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
    )
  ])
}

/**
 * Get appropriate timeout based on Vercel plan and operation type
 */
export function getTimeoutForOperation(operationType: 'upload' | 'extract' | 'api' | 'database'): number {
  const isProduction = process.env.NODE_ENV === 'production'
  const isPro = process.env.VERCEL_PLAN === 'pro'
  
  // Vercel timeout limits: Hobby = 10s, Pro = 60s (but we use conservative values)
  const baseTimeout = isPro ? 50000 : 8000 // 50s for Pro, 8s for Hobby
  
  switch (operationType) {
    case 'upload':
      return Math.min(baseTimeout, 30000) // Max 30s for uploads
    case 'extract':
      return baseTimeout // Full timeout for PDF extraction
    case 'api':
      return Math.min(baseTimeout, 15000) // Max 15s for API calls
    case 'database':
      return Math.min(baseTimeout, 10000) // Max 10s for DB operations
    default:
      return baseTimeout
  }
}

/**
 * Create a timeout promise that rejects after specified time
 */
export function createTimeout(
  timeoutMs: number,
  message: string = 'Timeout exceeded'
): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), timeoutMs)
  })
}

/**
 * Memory usage information
 */
export interface MemoryUsage {
  heapUsed: number
  heapTotal: number
  external: number
  rss: number
  arrayBuffers: number
  heapUsedMB: number
  heapTotalMB: number
  externalMB: number
  rssMB: number
  arrayBuffersMB: number
  percentageUsed: number
}

/**
 * Get detailed memory usage information
 */
export function getMemoryUsage(): MemoryUsage {
  const used = process.memoryUsage()
  const maxMemoryMB = getMaxMemoryLimit()
  const maxMemoryBytes = maxMemoryMB * 1024 * 1024
  
  return {
    heapUsed: used.heapUsed,
    heapTotal: used.heapTotal,
    external: used.external,
    rss: used.rss,
    arrayBuffers: used.arrayBuffers,
    heapUsedMB: Math.round(used.heapUsed / 1024 / 1024),
    heapTotalMB: Math.round(used.heapTotal / 1024 / 1024),
    externalMB: Math.round(used.external / 1024 / 1024),
    rssMB: Math.round(used.rss / 1024 / 1024),
    arrayBuffersMB: Math.round(used.arrayBuffers / 1024 / 1024),
    percentageUsed: Math.round((used.heapUsed / maxMemoryBytes) * 100)
  }
}

/**
 * Get maximum memory limit based on Vercel plan
 */
export function getMaxMemoryLimit(): number {
  const isPro = process.env.VERCEL_PLAN === 'pro'
  return isPro ? 3008 : 1024 // Pro: 3GB, Hobby: 1GB
}

/**
 * Monitor memory usage and warn if approaching limits
 */
export function checkMemoryUsage(
  warningThreshold: number = 0.8,
  maxMemoryMB?: number
): MemoryUsage {
  const memoryInfo = getMemoryUsage()
  const maxMemory = maxMemoryMB || getMaxMemoryLimit()
  const maxMemoryBytes = maxMemory * 1024 * 1024
  
  if (memoryInfo.heapUsed > maxMemoryBytes * warningThreshold) {
    console.warn('High memory usage detected:', {
      ...memoryInfo,
      threshold: Math.round(maxMemoryBytes * warningThreshold / 1024 / 1024) + 'MB',
      maxMemoryMB: maxMemory
    })
  }
  
  return memoryInfo
}

/**
 * Check if memory usage is critical (above 90%)
 */
export function isMemoryCritical(maxMemoryMB?: number): boolean {
  const memoryInfo = getMemoryUsage()
  const maxMemory = maxMemoryMB || getMaxMemoryLimit()
  const maxMemoryBytes = maxMemory * 1024 * 1024
  
  return memoryInfo.heapUsed > maxMemoryBytes * 0.9
}

/**
 * Force garbage collection if available (Node.js with --expose-gc flag)
 */
export function forceGarbageCollection(): void {
  if (global.gc) {
    console.log('Forcing garbage collection...')
    global.gc()
  } else {
    console.warn('Garbage collection not available. Run with --expose-gc flag.')
  }
}

/**
 * Execute function with timeout and memory monitoring
 */
export async function executeWithLimits<T>(
  fn: () => Promise<T>,
  options: {
    timeoutMs?: number
    maxMemoryMB?: number
    memoryCheckInterval?: number
  } = {}
): Promise<T> {
  const {
    timeoutMs = 45000,
    maxMemoryMB = 1024,
    memoryCheckInterval = 5000
  } = options

  // Start memory monitoring
  const memoryInterval = setInterval(() => {
    checkMemoryUsage(0.8, maxMemoryMB)
  }, memoryCheckInterval)

  try {
    const result = await withTimeout(fn(), timeoutMs)
    return result
  } finally {
    clearInterval(memoryInterval)
  }
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number
    initialDelayMs?: number
    maxDelayMs?: number
    backoffMultiplier?: number
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 10000,
    backoffMultiplier = 2
  } = options

  let lastError: Error
  let delay = initialDelayMs

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      if (attempt === maxRetries) {
        throw lastError
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay))
      delay = Math.min(delay * backoffMultiplier, maxDelayMs)
    }
  }

  throw lastError!
}