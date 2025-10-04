import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { withAuth, AuthRequest } from '../../../lib/auth';
import { 
  ApiResponse, 
  sendSuccess, 
  sendError,
  sendNotFoundError,
  sendMethodNotAllowedError,
  withErrorHandling,
  validateMethod
} from '../../../lib/api-response';

async function handler(req: AuthRequest, res: NextApiResponse) {
  const { data: segments } = req.query;
  const method = req.method;

  try {
    // Handle different data endpoints based on URL segments
    if (!segments || !Array.isArray(segments)) {
      return sendError(res, 'Invalid endpoint', 400);
    }

    const [endpoint, ...params] = segments;

    switch (endpoint) {
      case 'file':
        if (method === 'GET' && params[0]) {
          return await getExtractedDataForFile(req, res, params[0]);
        }
        break;

      case 'analytics':
        if (method === 'GET' && params[0] === 'summary') {
          return await getAnalyticsSummary(req, res);
        }
        break;

      case 'search':
        if (method === 'GET') {
          return await searchExtractedData(req, res);
        }
        break;

      default:
        if (method === 'GET' && !endpoint) {
          return await getAllExtractedData(req, res);
        }
        break;
    }

    return sendNotFoundError(res, 'Endpoint not found');
  } catch (error) {
    console.error('Data API error:', error);
    return sendError(res, 'Internal server error', 500);
  }
}

// Get extracted data for a specific file
async function getExtractedDataForFile(req: AuthRequest, res: NextApiResponse, fileId: string) {
  try {
    const user = req.user!;

    // Verify user has access to this file
    const file = await prisma.uploadedFile.findFirst({
      where: {
        id: fileId,
        uploadedById: user.id
      }
    });

    if (!file) {
      return sendNotFoundError(res, 'File not found');
    }

    const extractedData = await prisma.extractedData.findMany({
      where: { fileId },
      orderBy: { extractedAt: 'desc' }
    });

    return sendSuccess(res, { extractedData });
  } catch (error) {
    console.error('Get extracted data error:', error);
    return sendError(res, 'Failed to fetch extracted data', 500);
  }
}

// Get all extracted data for user with pagination
async function getAllExtractedData(req: AuthRequest, res: NextApiResponse) {
  try {
    const user = req.user!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const extractedData = await prisma.extractedData.findMany({
      where: { extractedById: user.id },
      include: {
        file: {
          select: {
            id: true,
            originalName: true,
            uploadedAt: true
          }
        }
      },
      orderBy: { extractedAt: 'desc' },
      skip,
      take: limit
    });

    const total = await prisma.extractedData.count({
      where: { extractedById: user.id }
    });

    return sendSuccess(res, {
      extractedData,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all extracted data error:', error);
    return sendError(res, 'Failed to fetch extracted data', 500);
  }
}

// Get analytics/summary of extracted data
async function getAnalyticsSummary(req: AuthRequest, res: NextApiResponse) {
  try {
    const user = req.user!;

    // Get basic counts
    const totalFiles = await prisma.uploadedFile.count({
      where: { uploadedById: user.id }
    });

    const totalExtractions = await prisma.extractedData.count({
      where: { extractedById: user.id }
    });

    const successfulExtractions = await prisma.extractedData.count({
      where: {
        extractedById: user.id,
        status: 'COMPLETED'
      }
    });

    const failedExtractions = await prisma.extractedData.count({
      where: {
        extractedById: user.id,
        status: 'FAILED'
      }
    });

    // Get recent activity
    const recentFiles = await prisma.uploadedFile.findMany({
      where: { uploadedById: user.id },
      orderBy: { uploadedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        originalName: true,
        uploadedAt: true,
        extractedData: {
          select: {
            status: true,
            extractedAt: true
          },
          take: 1,
          orderBy: { extractedAt: 'desc' }
        }
      }
    });

    // Get file sizes total
    const fileSizeResult = await prisma.uploadedFile.aggregate({
      where: { uploadedById: user.id },
      _sum: {
        size: true
      }
    });

    return sendSuccess(res, {
      summary: {
        totalFiles,
        totalExtractions,
        successfulExtractions,
        failedExtractions,
        successRate: totalExtractions > 0 ? (successfulExtractions / totalExtractions * 100).toFixed(1) : 0,
        totalFileSize: fileSizeResult._sum.size || 0
      },
      recentActivity: recentFiles
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    return sendError(res, 'Failed to fetch analytics', 500);
  }
}

// Search extracted data
async function searchExtractedData(req: AuthRequest, res: NextApiResponse) {
  try {
    const user = req.user!;
    const query = req.query.q as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    if (!query) {
      return sendError(res, 'Search query is required', 400);
    }

    // Basic text search in structured data
    // Note: This is a simple implementation. For production, consider using full-text search
    const extractedData = await prisma.extractedData.findMany({
      where: {
        extractedById: user.id,
        OR: [
          {
            rawData: {
              path: ['text'],
              string_contains: query
            }
          }
        ]
      },
      include: {
        file: {
          select: {
            id: true,
            originalName: true,
            uploadedAt: true
          }
        }
      },
      orderBy: { extractedAt: 'desc' },
      skip,
      take: limit
    });

    const total = extractedData.length; // Simplified count

    return sendSuccess(res, {
      extractedData,
      query,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    return sendError(res, 'Search failed', 500);
  }
}

export default withErrorHandling(withAuth(handler));