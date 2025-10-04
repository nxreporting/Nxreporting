import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { sendSuccess, sendError, sendValidationError } from '../../../lib/api-response'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return sendError(res, 'Method not allowed', 405, 'METHOD_NOT_ALLOWED')
  }

  try {
    const { email } = req.body

    if (!email) {
      return sendValidationError(res, 'Email is required')
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        // Don't select password for security
      }
    })

    if (!user) {
      return sendSuccess(res, {
        exists: false,
        message: 'User not found'
      })
    }

    return sendSuccess(res, {
      exists: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt
      }
    })

  } catch (error) {
    console.error('Check user error:', error)
    sendError(res, 'Failed to check user', 500, 'CHECK_USER_ERROR',
      error instanceof Error ? error.message : 'Unknown error'
    )
  }
}