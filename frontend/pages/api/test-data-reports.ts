import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';
import { 
  sendSuccess, 
  sendError,
  sendMethodNotAllowedError,
  withErrorHandling
} from '../../lib/api-response';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return sendMethodNotAllowedError(res);
  }

  try {
    // Test database connection
    const userCount = await prisma.user.count();
    const fileCount = await prisma.uploadedFile.count();
    const extractionCount = await prisma.extractedData.count();

    // Test basic queries that the data and reports endpoints use
    const recentFiles = await prisma.uploadedFile.findMany({
      take: 5,
      orderBy: { uploadedAt: 'desc' },
      select: {
        id: true,
        originalName: true,
        uploadedAt: true
      }
    });

    const statusCounts = await prisma.extractedData.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });

    return sendSuccess(res, {
      message: 'Data and Reports API routes test successful',
      database: {
        users: userCount,
        files: fileCount,
        extractions: extractionCount
      },
      recentFiles,
      statusCounts,
      endpoints: {
        data: [
          'GET /api/data - Get all extracted data with pagination',
          'GET /api/data/file/{fileId} - Get extracted data for specific file',
          'GET /api/data/analytics/summary - Get analytics summary',
          'GET /api/data/search?q={query} - Search extracted data'
        ],
        reports: [
          'GET /api/reports/csv?fileIds={ids} - Generate CSV report',
          'GET /api/reports/excel?fileIds={ids} - Generate Excel report',
          'GET /api/reports/data?startDate={date}&endDate={date} - Get report data for visualization',
          'GET /api/reports/analytics/monthly?year={year} - Get monthly analytics'
        ]
      }
    });
  } catch (error) {
    console.error('Test error:', error);
    return sendError(res, 'Database connection or query failed', 500, 'DB_ERROR');
  }
}

export default withErrorHandling(handler);