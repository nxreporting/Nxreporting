import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { withAuth, AuthRequest } from '../../../lib/auth'
import { 
  ApiResponse, 
  sendSuccess, 
  sendError,
  sendNotFoundError,
  sendMethodNotAllowedError,
  withErrorHandling,
  validateMethod
} from '../../../lib/api-response'

interface UserProfileResponse {
  user: {
    id: string
    email: string
    name: string
    role: string
    createdAt: Date
  }
}

async function meHandler(
  req: AuthRequest,
  res: NextApiResponse<ApiResponse<UserProfileResponse>>
) {
  // Validate HTTP method
  if (!validateMethod(req, res, ['GET'])) {
    return
  }

  try {
    // User is already authenticated via withAuth middleware
    // req.user is guaranteed to exist at this point
    const userId = req.user!.id

    // Fetch fresh user data from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        email: true, 
        name: true, 
        role: true, 
        createdAt: true 
      }
    })

    if (!user) {
      return sendNotFoundError(res, 'User not found')
    }

    // Send success response
    sendSuccess(res, { user })

  } catch (error) {
    console.error('Get user profile error:', error)
    
    return sendError(
      res,
      'Failed to retrieve user profile',
      500,
      'PROFILE_ERROR'
    )
  }
}

// Apply authentication middleware and error handling
export default withErrorHandling(withAuth(meHandler))