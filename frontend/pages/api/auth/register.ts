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

// Validation schema for registration
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().min(2).required(),
  role: Joi.string().valid('ADMIN', 'USER').default('USER')
})

interface RegisterRequest {
  email: string
  password: string
  name: string
  role?: 'ADMIN' | 'USER'
}

interface RegisterResponse {
  user: {
    id: string
    email: string
    name: string
    role: string
    createdAt: Date
  }
  token: string
}

async function registerHandler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<RegisterResponse>>
) {
  // Validate HTTP method
  if (!validateMethod(req, res, ['POST'])) {
    return
  }

  try {
    // Validate request body
    const { error, value } = registerSchema.validate(req.body)
    if (error) {
      return sendValidationError(res, error.details[0].message)
    }

    const { email, password, name, role = 'USER' } = value as RegisterRequest

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ 
      where: { email } 
    })
    
    if (existingUser) {
      return sendError(
        res,
        'User already exists with this email',
        400,
        'USER_EXISTS'
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role
      },
      select: { 
        id: true, 
        email: true, 
        name: true, 
        role: true, 
        createdAt: true 
      }
    })

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    })

    // Send success response
    sendSuccess(res, { user, token }, 201)

  } catch (error) {
    console.error('Registration error:', error)
    
    if (error instanceof Error) {
      // Handle specific Prisma errors
      if (error.message.includes('Unique constraint')) {
        return sendError(
          res,
          'User already exists with this email',
          400,
          'USER_EXISTS'
        )
      }
      
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
      'Registration failed',
      500,
      'REGISTRATION_ERROR'
    )
  }
}

export default withErrorHandling(registerHandler)