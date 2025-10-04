import { createMocks } from 'node-mocks-http'
import { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import registerHandler from '../../pages/api/auth/register'
import loginHandler from '../../pages/api/auth/login'
import meHandler from '../../pages/api/auth/me'
import { prisma } from '../../lib/prisma'
import { generateToken, verifyToken } from '../../lib/auth'

// Mock bcrypt
jest.mock('bcryptjs')
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>

// Mock auth utilities
jest.mock('../../lib/auth', () => ({
  generateToken: jest.fn(),
  verifyToken: jest.fn(),
  withAuth: jest.fn((handler) => (req: any, res: any) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '')
      if (token === 'valid-token') {
        req.user = {
          id: 'user-1',
          email: 'test@example.com',
          role: 'USER',
        }
      } else {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } })
      }
      return handler(req, res)
    } catch (error) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized' } })
    }
  }),
}))

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should complete full registration and login flow', async () => {
    // Step 1: Register a new user
    const registerReq = createMocks<NextApiRequest, NextApiResponse>({
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
      id: 'user-1',
      email: 'newuser@example.com',
      name: 'New User',
      role: 'USER',
    })
    ;(generateToken as jest.Mock).mockReturnValue('registration-token')

    await registerHandler(registerReq.req, registerReq.res)

    expect(registerReq.res._getStatusCode()).toBe(201)
    const registerData = JSON.parse(registerReq.res._getData())
    expect(registerData.success).toBe(true)
    expect(registerData.data.user.email).toBe('newuser@example.com')
    expect(registerData.data.token).toBe('registration-token')

    // Step 2: Login with the registered user
    const loginReq = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        email: 'newuser@example.com',
        password: 'password123',
      },
    })

    const mockUser = {
      id: 'user-1',
      email: 'newuser@example.com',
      name: 'New User',
      role: 'USER',
      password: 'hashedpassword',
    }

    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
    mockedBcrypt.compare.mockResolvedValue(true)
    ;(generateToken as jest.Mock).mockReturnValue('login-token')

    await loginHandler(loginReq.req, loginReq.res)

    expect(loginReq.res._getStatusCode()).toBe(200)
    const loginData = JSON.parse(loginReq.res._getData())
    expect(loginData.success).toBe(true)
    expect(loginData.data.user.email).toBe('newuser@example.com')
    expect(loginData.data.token).toBe('login-token')

    // Step 3: Access protected route with token
    const meReq = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      headers: {
        authorization: 'Bearer valid-token',
      },
    })

    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'newuser@example.com',
      name: 'New User',
      role: 'USER',
      createdAt: new Date(),
    })

    await meHandler(meReq.req, meReq.res)

    expect(meReq.res._getStatusCode()).toBe(200)
    const meData = JSON.parse(meReq.res._getData())
    expect(meData.success).toBe(true)
    expect(meData.data.user.email).toBe('newuser@example.com')
  })

  it('should reject access to protected routes without valid token', async () => {
    const meReq = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      headers: {
        authorization: 'Bearer invalid-token',
      },
    })

    await meHandler(meReq.req, meReq.res)

    expect(meReq.res._getStatusCode()).toBe(401)
    const data = JSON.parse(meReq.res._getData())
    expect(data.success).toBe(false)
    expect(data.error.message).toBe('Unauthorized')
  })

  it('should prevent duplicate user registration', async () => {
    // First registration
    const firstRegisterReq = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        email: 'duplicate@example.com',
        password: 'password123',
        name: 'First User',
      },
    })

    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
    mockedBcrypt.hash.mockResolvedValue('hashedpassword')
    ;(prisma.user.create as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'duplicate@example.com',
      name: 'First User',
      role: 'USER',
    })
    ;(generateToken as jest.Mock).mockReturnValue('token-1')

    await registerHandler(firstRegisterReq.req, firstRegisterReq.res)
    expect(firstRegisterReq.res._getStatusCode()).toBe(201)

    // Second registration with same email
    const secondRegisterReq = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        email: 'duplicate@example.com',
        password: 'password456',
        name: 'Second User',
      },
    })

    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'duplicate@example.com',
    })

    await registerHandler(secondRegisterReq.req, secondRegisterReq.res)

    expect(secondRegisterReq.res._getStatusCode()).toBe(409)
    const data = JSON.parse(secondRegisterReq.res._getData())
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('USER_EXISTS')
  })

  it('should handle invalid login credentials', async () => {
    const loginReq = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        email: 'nonexistent@example.com',
        password: 'wrongpassword',
      },
    })

    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

    await loginHandler(loginReq.req, loginReq.res)

    expect(loginReq.res._getStatusCode()).toBe(401)
    const data = JSON.parse(loginReq.res._getData())
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('INVALID_CREDENTIALS')
  })
})