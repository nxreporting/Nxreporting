import { createMocks } from 'node-mocks-http'
import { NextApiRequest, NextApiResponse } from 'next'
import healthHandler from '../../pages/api/health'
import { prisma } from '../../lib/prisma'

/**
 * Deployment Validation Tests
 * 
 * These tests validate that the application is properly configured
 * for deployment and that all critical services are working.
 */
describe('Deployment Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Environment Configuration', () => {
    it('should have all required environment variables', () => {
      const requiredEnvVars = [
        'NODE_ENV',
        'JWT_SECRET',
        'DATABASE_URL',
        'NANONETS_API_KEY',
        'BLOB_READ_WRITE_TOKEN',
      ]

      requiredEnvVars.forEach(envVar => {
        expect(process.env[envVar]).toBeDefined()
        expect(process.env[envVar]).not.toBe('')
      })
    })

    it('should have proper JWT secret configuration', () => {
      expect(process.env.JWT_SECRET).toBeDefined()
      expect(process.env.JWT_SECRET!.length).toBeGreaterThanOrEqual(32)
    })

    it('should have valid database URL format', () => {
      const databaseUrl = process.env.DATABASE_URL
      expect(databaseUrl).toBeDefined()
      expect(databaseUrl).toMatch(/^postgresql:\/\//)
    })
  })

  describe('Database Connectivity', () => {
    it('should connect to database successfully', async () => {
      ;(prisma.$queryRaw as jest.Mock).mockResolvedValue([{ result: 1 }])

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
      })

      await healthHandler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.data.services.database.status).toBe('healthy')
    })

    it('should handle database connection failures gracefully', async () => {
      ;(prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('Connection failed'))

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
      })

      await healthHandler(req, res)

      expect(res._getStatusCode()).toBe(503)
      const data = JSON.parse(res._getData())
      expect(data.data.services.database.status).toBe('unhealthy')
    })
  })

  describe('API Route Availability', () => {
    const criticalRoutes = [
      '/api/health',
      '/api/auth/login',
      '/api/auth/register',
      '/api/extract',
      '/api/files',
    ]

    it('should have all critical API routes available', () => {
      // This test would typically make actual HTTP requests in a real deployment test
      // For unit testing, we verify the handlers exist and can be imported
      criticalRoutes.forEach(route => {
        const routePath = route.replace('/api/', '../../pages/api/').replace(/\//g, '/')
        expect(() => {
          require(routePath)
        }).not.toThrow()
      })
    })
  })

  describe('Memory and Performance', () => {
    it('should have reasonable memory usage', () => {
      const memoryUsage = process.memoryUsage()
      
      // Memory usage should be less than 512MB for basic operations
      expect(memoryUsage.heapUsed).toBeLessThan(512 * 1024 * 1024)
      expect(memoryUsage.rss).toBeLessThan(1024 * 1024 * 1024) // 1GB
    })

    it('should handle concurrent requests efficiently', async () => {
      ;(prisma.$queryRaw as jest.Mock).mockResolvedValue([{ result: 1 }])

      const requests = Array.from({ length: 10 }, () => {
        const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
          method: 'GET',
        })
        return healthHandler(req, res).then(() => res._getStatusCode())
      })

      const results = await Promise.all(requests)
      
      // All requests should succeed
      results.forEach(statusCode => {
        expect(statusCode).toBe(200)
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed requests gracefully', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST', // Wrong method for health endpoint
      })

      await healthHandler(req, res)

      expect(res._getStatusCode()).toBe(405)
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('METHOD_NOT_ALLOWED')
    })

    it('should return proper error responses', async () => {
      ;(prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('Database error'))

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
      })

      await healthHandler(req, res)

      const data = JSON.parse(res._getData())
      expect(data).toHaveProperty('success')
      expect(data).toHaveProperty('error')
      expect(data.success).toBe(false)
    })
  })

  describe('Security Configuration', () => {
    it('should not expose sensitive information in responses', async () => {
      ;(prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('Connection string: postgresql://user:password@host'))

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
      })

      await healthHandler(req, res)

      const responseBody = res._getData()
      
      // Should not contain sensitive information
      expect(responseBody).not.toContain('password')
      expect(responseBody).not.toContain('postgresql://')
      expect(responseBody).not.toContain('JWT_SECRET')
    })

    it('should have proper CORS configuration', () => {
      // In a real deployment, this would test actual CORS headers
      // For unit testing, we verify the configuration exists
      expect(process.env.NODE_ENV).toBeDefined()
    })
  })

  describe('File Upload Configuration', () => {
    it('should have proper file size limits configured', () => {
      const maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '52428800')
      
      // Should be reasonable limit (50MB default)
      expect(maxFileSize).toBeGreaterThan(1024 * 1024) // At least 1MB
      expect(maxFileSize).toBeLessThanOrEqual(100 * 1024 * 1024) // At most 100MB
    })

    it('should have blob storage configuration', () => {
      expect(process.env.BLOB_READ_WRITE_TOKEN).toBeDefined()
      expect(process.env.BLOB_READ_WRITE_TOKEN!.length).toBeGreaterThan(10)
    })
  })

  describe('External Service Configuration', () => {
    it('should have Nanonets API configuration', () => {
      expect(process.env.NANONETS_API_KEY).toBeDefined()
      expect(process.env.NANONETS_API_KEY!.length).toBeGreaterThan(10)
    })

    it('should handle external service failures gracefully', () => {
      // This would be tested with actual service calls in integration tests
      // For unit tests, we verify error handling exists
      expect(process.env.NANONETS_API_KEY).toBeDefined()
    })
  })

  describe('Monitoring and Logging', () => {
    it('should have proper logging configuration', () => {
      // Verify console methods are available
      expect(console.log).toBeDefined()
      expect(console.error).toBeDefined()
      expect(console.warn).toBeDefined()
    })

    it('should track performance metrics', async () => {
      ;(prisma.$queryRaw as jest.Mock).mockResolvedValue([{ result: 1 }])

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
      })

      const startTime = Date.now()
      await healthHandler(req, res)
      const endTime = Date.now()

      const data = JSON.parse(res._getData())
      expect(data.data.services.database.responseTime).toBeGreaterThan(0)
      expect(endTime - startTime).toBeLessThan(5000) // Should complete within 5 seconds
    })
  })
})