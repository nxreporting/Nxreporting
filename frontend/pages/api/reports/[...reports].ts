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
import { generateCSV, generateExcel } from '../../../lib/services/reportGeneration';

async function handler(req: AuthRequest, res: NextApiResponse) {
  const { reports: segments } = req.query;
  const method = req.method;

  try {
    // Handle different report endpoints based on URL segments
    if (!segments || !Array.isArray(segments)) {
      return sendError(res, 'Invalid endpoint', 400);
    }

    const [endpoint, ...params] = segments;

    switch (endpoint) {
      case 'csv':
        if (method === 'GET') {
          return await generateCSVReport(req, res);
        }
        break;

      case 'excel':
        if (method === 'GET') {
          return await generateExcelReport(req, res);
        }
        break;

      case 'data':
        if (method === 'GET') {
          return await getReportData(req, res);
        }
        break;

      case 'analytics':
        if (method === 'GET' && params[0] === 'monthly') {
          return await getMonthlyAnalytics(req, res);
        }
        break;

      default:
        return sendNotFoundError(res, 'Endpoint not found');
    }

    return sendNotFoundError(res, 'Endpoint not found');
  } catch (error) {
    console.error('Reports API error:', error);
    return sendError(res, 'Internal server error', 500);
  }
}

// Generate CSV report
async function generateCSVReport(req: AuthRequest, res: NextApiResponse) {
  try {
    const user = req.user!;
    const fileIds = req.query.fileIds as string; // Comma-separated file IDs

    let whereClause: any = { extractedById: user.id };
    
    if (fileIds) {
      const fileIdArray = fileIds.split(',');
      whereClause.fileId = { in: fileIdArray };
    }

    const extractedData = await prisma.extractedData.findMany({
      where: whereClause,
      include: {
        file: {
          select: {
            originalName: true,
            uploadedAt: true
          }
        }
      },
      orderBy: { extractedAt: 'desc' }
    });

    const csvData = await generateCSV(extractedData);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="report.csv"');
    res.send(csvData);
  } catch (error) {
    console.error('CSV generation error:', error);
    return sendError(res, 'Failed to generate CSV report', 500);
  }
}

// Generate Excel report
async function generateExcelReport(req: AuthRequest, res: NextApiResponse) {
  try {
    const user = req.user!;
    const fileIds = req.query.fileIds as string;

    let whereClause: any = { extractedById: user.id };
    
    if (fileIds) {
      const fileIdArray = fileIds.split(',');
      whereClause.fileId = { in: fileIdArray };
    }

    const extractedData = await prisma.extractedData.findMany({
      where: whereClause,
      include: {
        file: {
          select: {
            originalName: true,
            uploadedAt: true
          }
        }
      },
      orderBy: { extractedAt: 'desc' }
    });

    const excelBuffer = await generateExcel(extractedData);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="report.xlsx"');
    res.send(excelBuffer);
  } catch (error) {
    console.error('Excel generation error:', error);
    return sendError(res, 'Failed to generate Excel report', 500);
  }
}

// Get report data for visualization
async function getReportData(req: AuthRequest, res: NextApiResponse) {
  try {
    const user = req.user!;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    let whereClause: any = { extractedById: user.id };

    if (startDate && endDate) {
      whereClause.extractedAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const extractedData = await prisma.extractedData.findMany({
      where: whereClause,
      include: {
        file: {
          select: {
            originalName: true,
            uploadedAt: true,
            size: true
          }
        }
      },
      orderBy: { extractedAt: 'desc' }
    });

    // Process data for visualization
    const reportData = {
      totalFiles: extractedData.length,
      successfulExtractions: extractedData.filter(d => d.status === 'COMPLETED').length,
      failedExtractions: extractedData.filter(d => d.status === 'FAILED').length,
      
      // Timeline data (extractions per day)
      timeline: extractedData.reduce((acc: any, item) => {
        const date = new Date(item.extractedAt).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {}),

      // File size distribution
      fileSizes: extractedData.map(item => ({
        name: item.file.originalName,
        size: item.file.size,
        status: item.status,
        extractedAt: item.extractedAt
      })),

      // Status distribution
      statusDistribution: {
        completed: extractedData.filter(d => d.status === 'COMPLETED').length,
        failed: extractedData.filter(d => d.status === 'FAILED').length,
        processing: extractedData.filter(d => d.status === 'PROCESSING').length,
        pending: extractedData.filter(d => d.status === 'PENDING').length
      },

      // Extract some sample structured data for insights
      insights: extractedData
        .filter(d => d.status === 'COMPLETED' && d.structuredData)
        .slice(0, 10)
        .map(item => ({
          fileId: item.fileId,
          fileName: item.file.originalName,
          metadata: (item.structuredData as any)?.metadata || {},
          dates: (item.structuredData as any)?.dates || [],
          numbers: (item.structuredData as any)?.numbers || []
        }))
    };

    return sendSuccess(res, reportData);
  } catch (error) {
    console.error('Report data error:', error);
    return sendError(res, 'Failed to fetch report data', 500);
  }
}

// Get monthly analytics
async function getMonthlyAnalytics(req: AuthRequest, res: NextApiResponse) {
  try {
    const user = req.user!;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();

    const monthlyData = [];
    
    for (let month = 1; month <= 12; month++) {
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59);

      const uploads = await prisma.uploadedFile.count({
        where: {
          uploadedById: user.id,
          uploadedAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      });

      const extractions = await prisma.extractedData.count({
        where: {
          extractedById: user.id,
          extractedAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      });

      const successful = await prisma.extractedData.count({
        where: {
          extractedById: user.id,
          status: 'COMPLETED',
          extractedAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      });

      monthlyData.push({
        month: month,
        monthName: new Date(year, month - 1).toLocaleString('default', { month: 'long' }),
        uploads,
        extractions,
        successful,
        successRate: extractions > 0 ? (successful / extractions * 100).toFixed(1) : 0
      });
    }

    return sendSuccess(res, {
      year,
      monthlyData
    });
  } catch (error) {
    console.error('Monthly analytics error:', error);
    return sendError(res, 'Failed to fetch monthly analytics', 500);
  }
}

export default withErrorHandling(withAuth(handler));