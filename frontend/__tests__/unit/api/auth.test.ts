import { createMocks } from 'node-mocks-http'
import { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import loginHandler from '../../../pages/api/auth/login'
import registerHandler from '../../../pages/api/auth/register'
import meHandler from '../../../pages/api/auth/me'
import { prisma } from '../../../lib/prisma'
import { generateToken } from '../../../lib/auth'

// Mock bcrypt
jest.mock('bcryptjs')
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>

// Mock auth utilities
jest.mock('../../../lib/auth', () => ({
  generateToken: jest.fn(),
  verifyToken: jest.fn(),
  withAuth: jest.fn((handler) => handler),
}))

describe('/api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should login successfully with valid credentials', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'password123',
      },
    })

    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'USER',
      password: 'hashedpassword',
    }

    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
    mockedBcrypt.compare.mockResolvedValue(true)
    ;(generateToken as jest.Mock).mockReturnValue('mock-jwt-token')

    await loginHandler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.success).toBe(true)
    expect(data.data.user.email).toBe('test@example.com')
    expect(data.data.token).toBe('mock-jwt-token')
    expect(data.data.user.password).toBeUndefined()
  })

  it('should reject invalid credentials', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'wrongpassword',
      },
    })

    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

    await loginHandler(req, res)

    expect(res._getStatusCode()).toBe(401)
    const data = JSON.parse(res._getData())
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('INVALID_CREDENTIALS')
  })

  it('should validate email format', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        email: 'invalid-email',
        password: 'password123',
      },
    })

    await loginHandler(req, res)

    expect(res._getStatusCode()).toBe(400)
    const data = JSON.parse(res._getData())
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('VALIDATION_ERROR')
  })

  it('should reject non-POST methods', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
    })

    await loginHandler(req, res)

    expect(res._getStatusCode()).toBe(405)
    const data = JSON.parse(res._getData())
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('METHOD_NOT_ALLOWED')
  })
})

describe('/api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should register a new user successfully', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      },
    })

    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null) // User doesn't exist
    mockedBcrypt.hash.mockResolvedValue('hashedpassword')
    ;(prisma.user.create as jest.Mock).mockResolvedValue({
      id: '2',
      email: 'newuser@example.com',
      name: 'New User',
      role: 'USER',
    })
    ;(generateToken as jest.Mock).mockReturnValue('mock-jwt-token')

    await registerHandler(req, res)

    expect(res._getStatusCode()).toBe(201)
    const data = JSON.parse(res._getData())
    expect(data.success).toBe(true)
    expect(data.data.user.email).toBe('newuser@example.com')
    expect(data.data.token).toBe('mock-jwt-token')
  })

  it('should reject duplicate email registration', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Existing User',
      },
    })

    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: '1',
      email: 'existing@example.com',
    })

    await registerHandler(req, res)

    expect(res._getStatusCode()).toBe(409)
    const data = JSON.parse(res._getData())
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('USER_EXISTS')
  })
})

describe('/api/auth/me', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return user profile for authenticated user', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      headers: {
        authorization: 'Bearer valid-token',
      },
    })

    // Mock authenticated user
    ;(req as any).user = {
      id: '1',
      email: 'test@example.com',
      role: 'USER',
    }

    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'USER',
      createdAt: new Date(),
    }

    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

    await meHandler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.success).toBe(true)
    expect(data.data.user.email).toBe('test@example.com')
  })
})