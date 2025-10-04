import { createMocks } from 'node-mocks-http'
import { NextApiRequest, NextApiResponse } from 'next'
import healthHandler from '../../../pages/api/health'
import { prisma } from '../../../lib/prisma'

describe('/api/health', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return healthy status when all services are working', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
    })

    // Mock successful database connection
    ;(prisma.$queryRaw as jest.Mock).mockResolvedValue([{ result: 1 }])

    await healthHandler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.success).toBe(true)
    expect(data.data.status).toBe('healthy')
    expect(data.data.services.database.status).toBe('healthy')
    expect(data.data.services.database.responseTime).toBeGreaterThan(0)
    expect(data.data.timestamp).toBeDefined()
    expect(data.data.uptime).toBeGreaterThan(0)
  })

  it('should return unhealthy status when database is down', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
    })

    // Mock database connection failure
    ;(prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('Connection refused'))

    await healthHandler(req, res)

    expect(res._getStatusCode()).toBe(503)
    const data = JSON.parse(res._getData())
    expect(data.success).toBe(false)
    expect(data.data.status).toBe('unhealthy')
    expect(data.data.services.database.status).toBe('unhealthy')
    expect(data.data.services.database.error).toBe('Connection refused')
  })

  it('should include environment information', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
    })

    ;(prisma.$queryRaw as jest.Mock).mockResolvedValue([{ result: 1 }])

    await healthHandler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.data.environment).toBe('test')
    expect(data.data.version).toBeDefined()
  })

  it('should handle detailed health check query parameter', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      query: { detailed: 'true' },
    })

    ;(prisma.$queryRaw as jest.Mock).mockResolvedValue([{ result: 1 }])

    await healthHandler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.data.services).toBeDefined()
    expect(data.data.services.database).toBeDefined()
    expect(data.data.memory).toBeDefined()
    expect(data.data.memory.used).toBeGreaterThan(0)
    expect(data.data.memory.total).toBeGreaterThan(0)
  })

  it('should reject non-GET methods', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
    })

    await healthHandler(req, res)

    expect(res._getStatusCode()).toBe(405)
    const data = JSON.parse(res._getData())
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('METHOD_NOT_ALLOWED')
  })

  it('should handle database timeout', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
    })

    // Mock database timeout
    ;(prisma.$queryRaw as jest.Mock).mockImplementation(() => {
      return new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Query timeout')), 100)
      })
    })

    await healthHandler(req, res)

    expect(res._getStatusCode()).toBe(503)
    const data = JSON.parse(res._getData())
    expect(data.success).toBe(false)
    expect(data.data.status).toBe('unhealthy')
    expect(data.data.services.database.status).toBe('unhealthy')
  })
})