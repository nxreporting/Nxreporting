import { NextApiRequest, NextApiResponse } from 'next';
import { getDatabaseService } from '../../../lib/services/databaseService';
import { 
  sendSuccess, 
  sendError, 
  sendValidationError, 
  validateMethod
} from '../../../lib/api-response';

/**
 * API endpoint for managing extraction records
 * 
 * GET /api/extractions - List extractions with pagination and search
 * POST /api/extractions - Create new extraction (handled by /api/extract)
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Validate HTTP method
    if (!validateMethod(req, res, ['GET'])) {
      return;
    }

    const dbService = getDatabaseService();

    if (req.method === 'GET') {
      // Get query parameters
      const {
        userId,
        search,
        limit = '50',
        offset = '0',
        status
      } = req.query;

      // Validate parameters
      const limitNum = parseInt(limit as string, 10);
      const offsetNum = parseInt(offset as string, 10);

      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        sendValidationError(res, 'Limit must be between 1 and 100');
        return;
      }

      if (isNaN(offsetNum) || offsetNum < 0) {
        sendValidationError(res, 'Offset must be 0 or greater');
        return;
      }

      let extractions;

      if (search && typeof search === 'string') {
        // Search extractions
        console.log(`🔍 Searching extractions: "${search}"`);
        extractions = await dbService.searchExtractions(
          search,
          userId as string,
          limitNum
        );
      } else {
        // List extractions for user or all
        console.log(`📋 Listing extractions (limit: ${limitNum}, offset: ${offsetNum})`);
        
        if (userId && typeof userId === 'string') {
          extractions = await dbService.getUserExtractions(
            userId,
            limitNum,
            offsetNum
          );
        } else {
          // For admin users - get all extractions (you might want to add auth check here)
          extractions = await dbService.getUserExtractions(
            'system', // This would need proper user management
            limitNum,
            offsetNum
          );
        }
      }

      // Transform data for response
      const transformedExtractions = extractions.map(extraction => ({
        id: extraction.id,
        status: extraction.status,
        extractedAt: extraction.extractedAt,
        errorMessage: extraction.errorMessage,
        file: {
          id: extraction.file.id,
          originalName: extraction.file.originalName,
          size: extraction.file.size,
          uploadedAt: extraction.file.uploadedAt
        },
        extractedBy: {
          id: extraction.extractedBy.id,
          name: extraction.extractedBy.name,
          email: extraction.extractedBy.email
        },
        metadata: {
          provider: extraction.structuredData?.extraction_metadata?.provider,
          confidence: extraction.structuredData?.extraction_metadata?.confidence,
          duration: extraction.structuredData?.extraction_metadata?.duration_ms,
          textLength: extraction.structuredData?.extraction_metadata?.text_length,
          tables: extraction.structuredData?.extraction_metadata?.tables_extracted,
          fields: extraction.structuredData?.extraction_metadata?.fields_extracted
        },
        summary: {
          companyName: extraction.structuredData?.company?.name,
          reportTitle: extraction.structuredData?.report?.title,
          dateRange: extraction.structuredData?.report?.dateRange,
          totalItems: extraction.structuredData?.items?.length || 0,
          totalSalesValue: extraction.structuredData?.summary?.totalSalesValue || 0,
          totalClosingValue: extraction.structuredData?.summary?.totalClosingValue || 0
        }
      }));

      sendSuccess(res, {
        extractions: transformedExtractions,
        pagination: {
          limit: limitNum,
          offset: offsetNum,
          total: transformedExtractions.length,
          hasMore: transformedExtractions.length === limitNum
        },
        query: {
          userId: userId || null,
          search: search || null,
          status: status || null
        }
      });
    }

  } catch (error: any) {
    console.error('❌ Extractions API error:', error.message);
    sendError(res, 'Failed to retrieve extractions', 500, 'DATABASE_ERROR', 
      process.env.NODE_ENV === 'development' ? error.message : undefined
    );
  }
}