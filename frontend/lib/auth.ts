import * as jwt from 'jsonwebtoken'
import { NextApiRequest, NextApiResponse } from 'next'

export interface AuthUser {
  id: string
  email: string
  role: string
}

export interface AuthRequest extends NextApiRequest {
  user?: AuthUser
}

/**
 * Verify JWT token and extract user information
 */
export function verifyToken(token: string): AuthUser {
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not configured')
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as any
    return {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    }
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired')
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token')
    } else {
      throw new Error('Token verification failed')
    }
  }
}

/**
 * Generate JWT token for user
 */
export function generateToken(user: { id: string; email: string; role: string }): string {
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not configured')
  }

  const expiresIn = process.env.JWT_EXPIRES_IN || '7d'
  
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    },
    jwtSecret,
    { expiresIn } as jwt.SignOptions
  )
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(req: NextApiRequest): string | null {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.replace('Bearer ', '')
}

/**
 * Middleware to authenticate API routes
 */
export function withAuth<T = any>(
  handler: (req: AuthRequest, res: NextApiResponse<T>) => Promise<void> | void
) {
  return async (req: AuthRequest, res: NextApiResponse<T>) => {
    try {
      const token = extractTokenFromHeader(req)
      
      if (!token) {
        return res.status(401).json({
          success: false,
          error: { 
            message: 'Access denied. No token provided.',
            code: 'NO_TOKEN'
          }
        } as any)
      }

      const user = verifyToken(token)
      req.user = user
      
      return handler(req, res)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed'
      return res.status(401).json({
        success: false,
        error: { 
          message,
          code: 'AUTH_FAILED'
        }
      } as any)
    }
  }
}

/**
 * Middleware to authorize specific roles
 */
export function withAuthorization(
  roles: string[],
  handler: (req: AuthRequest, res: NextApiResponse) => Promise<void> | void
) {
  return withAuth(async (req: AuthRequest, res: NextApiResponse) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { 
          message: 'Access denied. User not authenticated.',
          code: 'NOT_AUTHENTICATED'
        }
      })
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { 
          message: 'Access denied. Insufficient permissions.',
          code: 'INSUFFICIENT_PERMISSIONS'
        }
      })
    }

    return handler(req, res)
  })
}

/**
 * Helper to check if user has specific role
 */
export function hasRole(user: AuthUser | undefined, role: string): boolean {
  return user?.role === role
}

/**
 * Helper to check if user is admin
 */
export function isAdmin(user: AuthUser | undefined): boolean {
  return hasRole(user, 'ADMIN')
}