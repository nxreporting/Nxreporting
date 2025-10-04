import { NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { withAuth, AuthRequest } from '../../../lib/auth'
import { 
  sendSuccess, 
  sendError, 
  sendNotFoundError, 
  validateMethod,
  withErrorHandling 
} from '../../../lib/api-response'
import { deleteFile } from '../../../lib/storage'

async function handler(req: AuthRequest, res: NextApiResponse): Promise<void> {
  if (req.method === 'GET') {
    return handleGetFile(req, res)
  } else if (req.method === 'DELETE') {
    return handleDeleteFile(req, res)
  } else {
    validateMethod(req, res, ['GET', 'DELETE'])
    return
  }
}

/**
 * GET /api/files/[id] - Get specific file details
 */
async function handleGetFile(req: AuthRequest, res: NextApiResponse) {
  try {
    const user = req.user!
    const fileId = req.query.id as string

    if (!fileId) {
      return sendError(res, 'File ID is required', 400)
    }

    const file = await prisma.uploadedFile.findFirst({
      where: {
        id: fileId,
        uploadedById: user.id
      },
      include: {
        extractedData: {
          orderBy: {
            extractedAt: 'desc'
          }
        },
        uploadedBy: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    })

    if (!file) {
      return sendNotFoundError(res, 'File not found')
    }

    sendSuccess(res, { file })
  } catch (error) {
    console.error('Get file error:', error)
    sendError(res, 'Failed to fetch file', 500)
  }
}

/**
 * DELETE /api/files/[id] - Delete file and its data
 */
async function handleDeleteFile(req: AuthRequest, res: NextApiResponse) {
  try {
    const user = req.user!
    const fileId = req.query.id as string

    if (!fileId) {
      return sendError(res, 'File ID is required', 400)
    }

    // Find the file to ensure it belongs to the user
    const file = await prisma.uploadedFile.findFirst({
      where: {
        id: fileId,
        uploadedById: user.id
      }
    })

    if (!file) {
      return sendNotFoundError(res, 'File not found')
    }

    // Delete from cloud storage first
    const storageDeleteResult = await deleteFile(file.path, file.filename)
    
    if (!storageDeleteResult.success) {
      console.warn(`Failed to delete file from storage: ${storageDeleteResult.error}`)
      // Continue with database deletion even if storage deletion fails
    }

    // Delete file record from database (this will cascade to extracted data due to foreign key constraints)
    await prisma.uploadedFile.delete({
      where: { id: fileId }
    })

    sendSuccess(res, { 
      message: 'File deleted successfully',
      storageDeleted: storageDeleteResult.success 
    })
  } catch (error) {
    console.error('Delete file error:', error)
    sendError(res, 'Failed to delete file', 500)
  }
}

export default withAuth(withErrorHandling(handler))