import { createMocks } from 'node-mocks-http'
import { NextApiRequest, NextApiResponse } from 'next'
import brandSearchHandler from '../../../pages/api/brands/search'
import brandIdentifyHandler from '../../../pages/api/brands/identify'
import brandStatsHandler from '../../../pages/api/brands/stats'
import divisionsHandler from '../../../pages/api/brands/divisions/index'

// Mock auth
jest.mock('../../../lib/auth', () => ({
  withAuth: jest.fn((handler) => (req: any, res: any) => {
    req.user = {
      id: 'user-1',
      email: 'test@example.com',
      role: 'USER',
    }
    return handler(req, res)
  }),
}))

// Mock brand database
jest.mock('../../../lib/data/branddatabase', () => ({
  brandDatabase: {
    searchBrands: jest.fn(),
    identifyBrand: jest.fn(),
    getBrandStats: jest.fn(),
    getDivisions: jest.fn(),
    addDivision: jest.fn(),
    updateDivision: jest.fn(),
    deleteDivision: jest.fn(),
  },
}))

import { brandDatabase } from '../../../lib/data/branddatabase'
const mockedBrandDatabase = brandDatabase as jest.Mocked<typeof brandDatabase>

describe('/api/brands/search', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should search brands successfully', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      query: { q: 'nike', limit: '10' },
    })

    const mockResults = [
      {
        id: 'brand-1',
        name: 'Nike',
        category: 'Footwear',
        division: 'Sports',
        confidence: 0.95,
      },
      {
        id: 'brand-2',
        name: 'Nike Air',
        category: 'Footwear',
        division: 'Sports',
        confidence: 0.88,
      },
    ]

    mockedBrandDatabase.searchBrands.mockResolvedValue(mockResults)

    await brandSearchHandler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.success).toBe(true)
    expect(data.data.brands).toHaveLength(2)
    expect(data.data.brands[0].name).toBe('Nike')
    expect(mockedBrandDatabase.searchBrands).toHaveBeenCalledWith('nike', 10)
  })

  it('should handle empty search results', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      query: { q: 'nonexistentbrand' },
    })

    mockedBrandDatabase.searchBrands.mockResolvedValue([])

    await brandSearchHandler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.success).toBe(true)
    expect(data.data.brands).toHaveLength(0)
  })

  it('should validate search query parameter', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      query: {}, // Missing 'q' parameter
    })

    await brandSearchHandler(req, res)

    expect(res._getStatusCode()).toBe(400)
    const data = JSON.parse(res._getData())
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('VALIDATION_ERROR')
  })
})

describe('/api/brands/identify', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should identify brand from product name', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        productName: 'Nike Air Max 270',
        context: 'Footwear product from inventory',
      },
    })

    const mockIdentification = {
      brand: {
        id: 'brand-1',
        name: 'Nike',
        category: 'Footwear',
        division: 'Sports',
      },
      confidence: 0.92,
      reasoning: 'Product name contains "Nike Air Max" which is a Nike product line',
      alternativeBrands: [
        {
          id: 'brand-2',
          name: 'Nike Air',
          confidence: 0.85,
        },
      ],
    }

    mockedBrandDatabase.identifyBrand.mockResolvedValue(mockIdentification)

    await brandIdentifyHandler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.success).toBe(true)
    expect(data.data.brand.name).toBe('Nike')
    expect(data.data.confidence).toBe(0.92)
    expect(data.data.alternativeBrands).toHaveLength(1)
  })

  it('should handle unidentifiable products', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        productName: 'Generic Product XYZ',
      },
    })

    mockedBrandDatabase.identifyBrand.mockResolvedValue(null)

    await brandIdentifyHandler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.success).toBe(true)
    expect(data.data.brand).toBeNull()
    expect(data.data.message).toContain('could not be identified')
  })

  it('should validate required product name', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {}, // Missing productName
    })

    await brandIdentifyHandler(req, res)

    expect(res._getStatusCode()).toBe(400)
    const data = JSON.parse(res._getData())
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('VALIDATION_ERROR')
  })
})

describe('/api/brands/stats', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return brand statistics', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      query: { period: '30d' },
    })

    const mockStats = {
      totalBrands: 150,
      totalDivisions: 12,
      topBrands: [
        { name: 'Nike', count: 45, percentage: 30.0 },
        { name: 'Adidas', count: 30, percentage: 20.0 },
        { name: 'Puma', count: 25, percentage: 16.7 },
      ],
      divisionBreakdown: [
        { division: 'Sports', count: 80, percentage: 53.3 },
        { division: 'Fashion', count: 40, percentage: 26.7 },
        { division: 'Electronics', count: 30, percentage: 20.0 },
      ],
      period: '30d',
      generatedAt: new Date().toISOString(),
    }

    mockedBrandDatabase.getBrandStats.mockResolvedValue(mockStats)

    await brandStatsHandler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.success).toBe(true)
    expect(data.data.totalBrands).toBe(150)
    expect(data.data.topBrands).toHaveLength(3)
    expect(data.data.divisionBreakdown).toHaveLength(3)
  })

  it('should handle different time periods', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      query: { period: '7d' },
    })

    mockedBrandDatabase.getBrandStats.mockResolvedValue({
      totalBrands: 50,
      totalDivisions: 8,
      topBrands: [],
      divisionBreakdown: [],
      period: '7d',
      generatedAt: new Date().toISOString(),
    })

    await brandStatsHandler(req, res)

    expect(res._getStatusCode()).toBe(200)
    expect(mockedBrandDatabase.getBrandStats).toHaveBeenCalledWith('7d')
  })
})

describe('/api/brands/divisions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should get all divisions', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
    })

    const mockDivisions = [
      {
        id: 'div-1',
        name: 'Sports',
        description: 'Sports and athletic products',
        brandCount: 45,
        createdAt: new Date(),
      },
      {
        id: 'div-2',
        name: 'Fashion',
        description: 'Fashion and lifestyle products',
        brandCount: 30,
        createdAt: new Date(),
      },
    ]

    mockedBrandDatabase.getDivisions.mockResolvedValue(mockDivisions)

    await divisionsHandler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.success).toBe(true)
    expect(data.data.divisions).toHaveLength(2)
    expect(data.data.divisions[0].name).toBe('Sports')
  })

  it('should create new division', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        name: 'Electronics',
        description: 'Electronic devices and gadgets',
      },
    })

    const mockNewDivision = {
      id: 'div-3',
      name: 'Electronics',
      description: 'Electronic devices and gadgets',
      brandCount: 0,
      createdAt: new Date(),
    }

    mockedBrandDatabase.addDivision.mockResolvedValue(mockNewDivision)

    await divisionsHandler(req, res)

    expect(res._getStatusCode()).toBe(201)
    const data = JSON.parse(res._getData())
    expect(data.success).toBe(true)
    expect(data.data.division.name).toBe('Electronics')
    expect(mockedBrandDatabase.addDivision).toHaveBeenCalledWith({
      name: 'Electronics',
      description: 'Electronic devices and gadgets',
    })
  })

  it('should validate division creation data', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        // Missing required 'name' field
        description: 'Some description',
      },
    })

    await divisionsHandler(req, res)

    expect(res._getStatusCode()).toBe(400)
    const data = JSON.parse(res._getData())
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('VALIDATION_ERROR')
  })
})