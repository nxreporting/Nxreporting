import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get extracted data for a specific file
router.get('/file/:fileId', authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const fileId = req.params.fileId;

    // Verify user has access to this file
    const file = await prisma.uploadedFile.findFirst({
      where: {
        id: fileId,
        uploadedById: user.id
      }
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        error: { message: 'File not found' }
      });
    }

    const extractedData = await prisma.extractedData.findMany({
      where: { fileId },
      orderBy: { extractedAt: 'desc' }
    });

    res.json({
      success: true,
      data: { extractedData }
    });
  } catch (error) {
    console.error('Get extracted data error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch extracted data' }
    });
  }
});

// Get all extracted data for user
router.get('/', authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
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

    res.json({
      success: true,
      data: {
        extractedData,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all extracted data error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch extracted data' }
    });
  }
});

// Get analytics/summary of extracted data
router.get('/analytics/summary', authenticate, async (req, res) => {
  try {
    const user = (req as any).user;

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

    res.json({
      success: true,
      data: {
        summary: {
          totalFiles,
          totalExtractions,
          successfulExtractions,
          failedExtractions,
          successRate: totalExtractions > 0 ? (successfulExtractions / totalExtractions * 100).toFixed(1) : 0,
          totalFileSize: fileSizeResult._sum.size || 0
        },
        recentActivity: recentFiles
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch analytics' }
    });
  }
});

// Search extracted data
router.get('/search', authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const query = req.query.q as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: { message: 'Search query is required' }
      });
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

    res.json({
      success: true,
      data: {
        extractedData,
        query,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Search failed' }
    });
  }
});

export default router;