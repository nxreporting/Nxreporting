import { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import Joi from 'joi'
import { prisma } from '../../../lib/prisma'
import { generateToken } from '../../../lib/auth'
import { 
  ApiResponse, 
  sendSuccess, 
  sendValidationError, 
  sendError,
  sendMethodNotAllowedError,
  withErrorHandling,
  validateMethod
} from '../../../lib/api-response'

// Validation schema for login
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
})

interface LoginRequest {
  email: string
  password: string
}

interface LoginResponse {
  user: {
    id: string
    email: string
    name: string
    role: string
  }
  token: string
}

async function loginHandler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<LoginResponse>>
) {
  // Validate HTTP method
  if (!validateMethod(req, res, ['POST'])) {
    return
  }

  try {
    // Validate request body
    const { error, value } = loginSchema.validate(req.body)
    if (error) {
      return sendValidationError(res, error.details[0].message)
    }

    const { email, password } = value as LoginRequest

    // Find user by email
    const user = await prisma.user.findUnique({ 
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true
      }
    })
    
    if (!user) {
      return sendError(
        res,
        'Invalid credentials',
        401,
        'INVALID_CREDENTIALS'
      )
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return sendError(
        res,
        'Invalid credentials',
        401,
        'INVALID_CREDENTIALS'
      )
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    })

    // Prepare user data (exclude password)
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }

    // Send success response
    sendSuccess(res, { user: userData, token })

  } catch (error) {
    console.error('Login error:', error)
    
    if (error instanceof Error) {
      // Handle JWT secret missing
      if (error.message.includes('JWT_SECRET')) {
        return sendError(
          res,
          'Server configuration error',
          500,
          'CONFIG_ERROR'
        )
      }
    }

    return sendError(
      res,
      'Login failed',
      500,
      'LOGIN_ERROR'
    )
  }
}

export default withErrorHandling(loginHandler)