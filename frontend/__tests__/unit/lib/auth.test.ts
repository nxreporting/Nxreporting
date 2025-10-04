import jwt from 'jsonwebtoken'
import { generateToken, verifyToken, withAuth } from '../../../lib/auth'
import { createMocks } from 'node-mocks-http'
import { NextApiRequest, NextApiResponse } from 'next'

// Mock jsonwebtoken
jest.mock('jsonwebtoken')
const mockedJwt = jwt as jest.Mocked<typeof jwt>

describe('Auth Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.JWT_SECRET = 'test-secret'
  })

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const payload = {
        id: 'user-1',
        email: 'test@example.com',
        role: 'USER',
      }

      mockedJwt.sign.mockReturnValue('mock-jwt-token')

      const token = generateToken(payload)

      expect(token).toBe('mock-jwt-token')
      expect(mockedJwt.sign).toHaveBeenCalledWith(
        payload,
        'test-secret',
        { expiresIn: '7d' }
      )
    })

    it('should use custom expiration time', () => {
      const payload = { id: 'user-1', email: 'test@example.com', role: 'USER' }
      
      mockedJwt.sign.mockReturnValue('mock-jwt-token')

      generateToken(payload, '1h')

      expect(mockedJwt.sign).toHaveBeenCalledWith(
        payload,
        'test-secret',
        { expiresIn: '1h' }
      )
    })

    it('should throw error when JWT_SECRET is missing', () => {
      delete process.env.JWT_SECRET

      expect(() => {
        generateToken({ id: 'user-1', email: 'test@example.com', role: 'USER' })
      }).toThrow('JWT_SECRET environment variable is required')
    })
  })

  describe('verifyToken', () => {
    it('should verify and decode a valid token', () => {
      const mockPayload = {
        id: 'user-1',
        email: 'test@example.com',
        role: 'USER',
        iat: 1234567890,
        exp: 1234567890 + 7 * 24 * 60 * 60,
      }

      mockedJwt.verify.mockReturnValue(mockPayload)

      const result = verifyToken('valid-token')

      expect(result).toEqual(mockPayload)
      expect(mockedJwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret')
    })

    it('should throw error for invalid token', () => {
      mockedJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token')
      })

      expect(() => {
        verifyToken('invalid-token')
      }).toThrow('Invalid token')
    })

    it('should throw error for expired token', () => {
      mockedJwt.verify.mockImplementation(() => {
        const error = new Error('Token expired')
        ;(error as any).name = 'TokenExpiredError'
        throw error
      })

      expect(() => {
        verifyToken('expired-token')
      }).toThrow('Token expired')
    })
  })

  describe('withAuth middleware', () => {
    it('should call handler with authenticated user', async () => {
      const mockHandler = jest.fn()
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        headers: {
          authorization: 'Bearer valid-token',
        },
      })

      const mockPayload = {
        id: 'user-1',
        email: 'test@example.com',
        role: 'USER',
      }

      mockedJwt.verify.mockReturnValue(mockPayload)

      const authenticatedHandler = withAuth(mockHandler)
      await authenticatedHandler(req, res)

      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          user: mockPayload,
        }),
        res
      )
    })

    it('should return 401 for missing authorization header', async () => {
      const mockHandler = jest.fn()
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        // No authorization header
      })

      const authenticatedHandler = withAuth(mockHandler)
      await authenticatedHandler(req, res)

      expect(res._getStatusCode()).toBe(401)
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('UNAUTHORIZED')
      expect(mockHandler).not.toHaveBeenCalled()
    })

    it('should return 401 for invalid token format', async () => {
      const mockHandler = jest.fn()
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        headers: {
          authorization: 'InvalidFormat token',
        },
      })

      const authenticatedHandler = withAuth(mockHandler)
      await authenticatedHandler(req, res)

      expect(res._getStatusCode()).toBe(401)
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('UNAUTHORIZED')
      expect(mockHandler).not.toHaveBeenCalled()
    })

    it('should return 401 for expired token', async () => {
      const mockHandler = jest.fn()
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        headers: {
          authorization: 'Bearer expired-token',
        },
      })

      mockedJwt.verify.mockImplementation(() => {
        const error = new Error('Token expired')
        ;(error as any).name = 'TokenExpiredError'
        throw error
      })

      const authenticatedHandler = withAuth(mockHandler)
      await authenticatedHandler(req, res)

      expect(res._getStatusCode()).toBe(401)
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('TOKEN_EXPIRED')
      expect(mockHandler).not.toHaveBeenCalled()
    })

    it('should return 401 for malformed token', async () => {
      const mockHandler = jest.fn()
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        headers: {
          authorization: 'Bearer malformed-token',
        },
      })

      mockedJwt.verify.mockImplementation(() => {
        const error = new Error('Malformed token')
        ;(error as any).name = 'JsonWebTokenError'
        throw error
      })

      const authenticatedHandler = withAuth(mockHandler)
      await authenticatedHandler(req, res)

      expect(res._getStatusCode()).toBe(401)
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INVALID_TOKEN')
      expect(mockHandler).not.toHaveBeenCalled()
    })
  })
})