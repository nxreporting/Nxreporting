import { NextApiRequest, NextApiResponse } from 'next';
import { getDatabaseService } from '../../../lib/services/databaseService';
import { 
  sendSuccess, 
  sendError, 
  sendNotFound, 
  validateMethod
} from '../../../lib/api-response';

/**
 * API endpoint for individual extraction records
 * 
 * GET /api/extractions/[id] - Get extraction details by ID
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Validate HTTP method
    if (!validateMethod(req, res, ['GET'])) {
      return;
    }

    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      sendError(res, 'Extraction ID is required', 400, 'MISSING_ID');
      return;
    }

    const dbService = getDatabaseService();

    if (req.method === 'GET') {
      console.log(`📄 Getting extraction details: ${id}`);

      const extraction = await dbService.getExtraction(id);

      if (!extraction) {
        sendNotFound(res, 'Extraction not found');
        return;
      }

      // Transform data for detailed response
      const detailedExtraction = {
        id: extraction.id,
        status: extraction.status,
        extractedAt: extraction.extractedAt,
        errorMessage: extraction.errorMessage,
        
        // File information
        file: {
          id: extraction.file.id,
          originalName: extraction.file.originalName,
          filename: extraction.file.filename,
          size: extraction.file.size,
          uploadedAt: extraction.file.uploadedAt
        },
        
        // User information
        extractedBy: {
          id: extraction.extractedBy.id,
          name: extraction.extractedBy.name,
          email: extraction.extractedBy.email
        },
        
        // Raw OCR data
        rawData: extraction.rawData,
        
        // Structured business data
        structuredData: extraction.structuredData,
        
        // Extraction metadata
        metadata: {
          provider: extraction.structuredData?.extraction_metadata?.provider,
          confidence: extraction.structuredData?.extraction_metadata?.confidence,
          duration: extraction.structuredData?.extraction_metadata?.duration_ms,
          fileSize: extraction.structuredData?.extraction_metadata?.file_size_bytes,
          textLength: extraction.structuredData?.extraction_metadata?.text_length,
          tables: extraction.structuredData?.extraction_metadata?.tables_extracted,
          fields: extraction.structuredData?.extraction_metadata?.fields_extracted,
          extractedAt: extraction.structuredData?.extraction_metadata?.extracted_at
        },
        
        // Business intelligence summary
        businessData: {
          company: extraction.structuredData?.company || {},
          report: extraction.structuredData?.report || {},
          items: extraction.structuredData?.items || [],
          summary: extraction.structuredData?.summary || {},
          
          // Analytics
          analytics: {
            totalItems: extraction.structuredData?.items?.length || 0,
            totalSalesValue: extraction.structuredData?.summary?.totalSalesValue || 0,
            totalClosingValue: extraction.structuredData?.summary?.totalClosingValue || 0,
            averageItemValue: extraction.structuredData?.items?.length > 0 
              ? (extraction.structuredData?.summary?.totalClosingValue || 0) / extraction.structuredData.items.length 
              : 0,
            
            // Top items by value
            topItems: (extraction.structuredData?.items || [])
              .filter((item: any) => item.closingValue > 0)
              .sort((a: any, b: any) => (b.closingValue || 0) - (a.closingValue || 0))
              .slice(0, 10)
              .map((item: any) => ({
                name: item.name,
                closingValue: item.closingValue,
                closing: item.closing,
                sales: item.sales
              })),
            
            // Items with no sales
            noSalesItems: (extraction.structuredData?.items || [])
              .filter((item: any) => (item.sales || 0) === 0 && (item.closing || 0) > 0)
              .length,
            
            // Items out of stock
            outOfStockItems: (extraction.structuredData?.items || [])
              .filter((item: any) => (item.closing || 0) === 0)
              .length
          }
        }
      };

      sendSuccess(res, detailedExtraction);
    }

  } catch (error: any) {
    console.error(`❌ Extraction details API error for ID ${req.query.id}:`, error.message);
    sendError(res, 'Failed to retrieve extraction details', 500, 'DATABASE_ERROR', 
      process.env.NODE_ENV === 'development' ? error.message : undefined
    );
  }
}