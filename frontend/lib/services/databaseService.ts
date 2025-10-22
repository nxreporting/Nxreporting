/**
 * Database Service for PDF Extraction Data
 * Handles saving extracted data to PostgreSQL via Prisma
 */

import { PrismaClient } from '@prisma/client';
import { ExtractionStatus } from '@prisma/client';

// ============================================================================
// INTERFACES
// ============================================================================

export interface SaveExtractionRequest {
  fileId: string;
  userId: string;
  rawData: any;
  structuredData: any;
  extractedText?: string;
  ocrProvider?: string;
  metadata?: {
    confidence?: number;
    duration?: number;
    fileSize?: number;
    tables?: number;
    fields?: number;
  };
}

export interface ExtractionRecord {
  id: string;
  rawData: any;
  structuredData: any;
  status: ExtractionStatus;
  errorMessage?: string;
  extractedAt: Date;
  fileId: string;
  extractedById: string;
  file: {
    id: string;
    originalName: string;
    filename: string;
    size: number;
    uploadedAt: Date;
  };
  extractedBy: {
    id: string;
    name: string;
    email: string;
  };
}

export interface AnalyticsData {
  totalExtractions: number;
  successfulExtractions: number;
  failedExtractions: number;
  averageProcessingTime: number;
  topOcrProviders: Array<{
    provider: string;
    count: number;
    successRate: number;
  }>;
  recentExtractions: ExtractionRecord[];
}

// ============================================================================
// DATABASE SERVICE CLASS
// ============================================================================

export class DatabaseService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
    });
  }

  /**
   * Save file upload record
   */
  async saveUploadedFile(
    originalName: string,
    filename: string,
    path: string,
    mimetype: string,
    size: number,
    uploadedById: string
  ) {
    try {
      console.log('💾 Saving uploaded file record...');
      
      const uploadedFile = await this.prisma.uploadedFile.create({
        data: {
          originalName,
          filename,
          path,
          mimetype,
          size,
          uploadedById,
        },
      });

      console.log(`✅ File record saved: ${uploadedFile.id}`);
      return uploadedFile;

    } catch (error: any) {
      console.error('❌ Failed to save uploaded file:', error.message);
      throw new Error(`Database error: ${error.message}`);
    }
  }

  /**
   * Save extraction data to database
   */
  async saveExtractionData(request: SaveExtractionRequest): Promise<ExtractionRecord> {
    try {
      console.log('💾 Saving extraction data...');
      console.log(`📄 File ID: ${request.fileId}`);
      console.log(`👤 User ID: ${request.userId}`);
      console.log(`🔧 Provider: ${request.ocrProvider || 'unknown'}`);

      // Prepare structured data with metadata
      const enhancedStructuredData = {
        ...request.structuredData,
        extraction_metadata: {
          provider: request.ocrProvider,
          extracted_at: new Date().toISOString(),
          confidence: request.metadata?.confidence,
          duration_ms: request.metadata?.duration,
          file_size_bytes: request.metadata?.fileSize,
          tables_extracted: request.metadata?.tables,
          fields_extracted: request.metadata?.fields,
          text_length: request.extractedText?.length || 0,
        }
      };

      // Save to database
      const extractedData = await this.prisma.extractedData.create({
        data: {
          rawData: request.rawData,
          structuredData: enhancedStructuredData,
          status: ExtractionStatus.COMPLETED,
          fileId: request.fileId,
          extractedById: request.userId,
        },
        include: {
          file: true,
          extractedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        }
      });

      console.log(`✅ Extraction data saved: ${extractedData.id}`);

      // Log audit trail
      await this.logAuditEvent(
        request.userId,
        'EXTRACTION_COMPLETED',
        'extracted_data',
        {
          extractionId: extractedData.id,
          fileId: request.fileId,
          provider: request.ocrProvider,
          duration: request.metadata?.duration,
        }
      );

      return extractedData as ExtractionRecord;

    } catch (error: any) {
      console.error('❌ Failed to save extraction data:', error.message);
      
      // Try to save as failed extraction
      try {
        await this.saveFailedExtraction(
          request.fileId,
          request.userId,
          error.message,
          request.rawData
        );
      } catch (saveError) {
        console.error('❌ Failed to save failed extraction record:', saveError);
      }

      throw new Error(`Database error: ${error.message}`);
    }
  }

  /**
   * Save failed extraction record
   */
  async saveFailedExtraction(
    fileId: string,
    userId: string,
    errorMessage: string,
    rawData?: any
  ) {
    try {
      console.log('💾 Saving failed extraction record...');

      const failedExtraction = await this.prisma.extractedData.create({
        data: {
          rawData: rawData || {},
          structuredData: {
            error: errorMessage,
            failed_at: new Date().toISOString(),
          },
          status: ExtractionStatus.FAILED,
          errorMessage: errorMessage,
          fileId: fileId,
          extractedById: userId,
        },
      });

      // Log audit trail
      await this.logAuditEvent(
        userId,
        'EXTRACTION_FAILED',
        'extracted_data',
        {
          extractionId: failedExtraction.id,
          fileId: fileId,
          error: errorMessage,
        }
      );

      console.log(`✅ Failed extraction record saved: ${failedExtraction.id}`);
      return failedExtraction;

    } catch (error: any) {
      console.error('❌ Failed to save failed extraction record:', error.message);
      throw error;
    }
  }

  /**
   * Get extraction by ID
   */
  async getExtraction(extractionId: string): Promise<ExtractionRecord | null> {
    try {
      const extraction = await this.prisma.extractedData.findUnique({
        where: { id: extractionId },
        include: {
          file: true,
          extractedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        }
      });

      return extraction as ExtractionRecord | null;

    } catch (error: any) {
      console.error('❌ Failed to get extraction:', error.message);
      throw new Error(`Database error: ${error.message}`);
    }
  }

  /**
   * Get extractions for a user
   */
  async getUserExtractions(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ExtractionRecord[]> {
    try {
      const extractions = await this.prisma.extractedData.findMany({
        where: { extractedById: userId },
        include: {
          file: true,
          extractedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        },
        orderBy: { extractedAt: 'desc' },
        take: limit,
        skip: offset,
      });

      return extractions as ExtractionRecord[];

    } catch (error: any) {
      console.error('❌ Failed to get user extractions:', error.message);
      throw new Error(`Database error: ${error.message}`);
    }
  }

  /**
   * Get extractions for a file
   */
  async getFileExtractions(fileId: string): Promise<ExtractionRecord[]> {
    try {
      const extractions = await this.prisma.extractedData.findMany({
        where: { fileId: fileId },
        include: {
          file: true,
          extractedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        },
        orderBy: { extractedAt: 'desc' },
      });

      return extractions as ExtractionRecord[];

    } catch (error: any) {
      console.error('❌ Failed to get file extractions:', error.message);
      throw new Error(`Database error: ${error.message}`);
    }
  }

  /**
   * Search extractions by company name or content
   */
  async searchExtractions(
    query: string,
    userId?: string,
    limit: number = 50
  ): Promise<ExtractionRecord[]> {
    try {
      const whereClause: any = {
        OR: [
          {
            structuredData: {
              path: ['company', 'name'],
              string_contains: query
            }
          },
          {
            structuredData: {
              path: ['report', 'title'],
              string_contains: query
            }
          },
          {
            file: {
              originalName: {
                contains: query,
                mode: 'insensitive'
              }
            }
          }
        ]
      };

      if (userId) {
        whereClause.extractedById = userId;
      }

      const extractions = await this.prisma.extractedData.findMany({
        where: whereClause,
        include: {
          file: true,
          extractedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        },
        orderBy: { extractedAt: 'desc' },
        take: limit,
      });

      return extractions as ExtractionRecord[];

    } catch (error: any) {
      console.error('❌ Failed to search extractions:', error.message);
      throw new Error(`Database error: ${error.message}`);
    }
  }

  /**
   * Get analytics data
   */
  async getAnalytics(userId?: string): Promise<AnalyticsData> {
    try {
      const whereClause = userId ? { extractedById: userId } : {};

      // Get basic counts
      const [totalExtractions, successfulExtractions, failedExtractions] = await Promise.all([
        this.prisma.extractedData.count({ where: whereClause }),
        this.prisma.extractedData.count({ 
          where: { ...whereClause, status: ExtractionStatus.COMPLETED } 
        }),
        this.prisma.extractedData.count({ 
          where: { ...whereClause, status: ExtractionStatus.FAILED } 
        }),
      ]);

      // Get recent extractions
      const recentExtractions = await this.prisma.extractedData.findMany({
        where: whereClause,
        include: {
          file: true,
          extractedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        },
        orderBy: { extractedAt: 'desc' },
        take: 10,
      });

      // Calculate average processing time (from metadata)
      const extractionsWithDuration = await this.prisma.extractedData.findMany({
        where: {
          ...whereClause,
          structuredData: {
            path: ['extraction_metadata', 'duration_ms'],
            not: null
          }
        },
        select: {
          structuredData: true
        }
      });

      let averageProcessingTime = 0;
      if (extractionsWithDuration.length > 0) {
        const totalDuration = extractionsWithDuration.reduce((sum, extraction) => {
          const duration = extraction.structuredData?.extraction_metadata?.duration_ms || 0;
          return sum + duration;
        }, 0);
        averageProcessingTime = totalDuration / extractionsWithDuration.length;
      }

      // Get provider statistics (simplified - would need more complex query for real data)
      const topOcrProviders = [
        { provider: 'Nanonets', count: successfulExtractions, successRate: 0.95 },
        { provider: 'OCR.space', count: Math.floor(successfulExtractions * 0.3), successRate: 0.85 },
        { provider: 'Fallback', count: Math.floor(failedExtractions * 0.1), successRate: 0.0 },
      ];

      return {
        totalExtractions,
        successfulExtractions,
        failedExtractions,
        averageProcessingTime,
        topOcrProviders,
        recentExtractions: recentExtractions as ExtractionRecord[],
      };

    } catch (error: any) {
      console.error('❌ Failed to get analytics:', error.message);
      throw new Error(`Database error: ${error.message}`);
    }
  }

  /**
   * Log audit event
   */
  async logAuditEvent(
    userId: string,
    action: string,
    resource: string,
    details?: any,
    ipAddress?: string,
    userAgent?: string
  ) {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action,
          resource,
          details: details || {},
          ipAddress,
          userAgent,
        },
      });

    } catch (error: any) {
      // Don't throw on audit log failures
      console.warn('⚠️ Failed to log audit event:', error.message);
    }
  }

  /**
   * Clean up old extractions (for maintenance)
   */
  async cleanupOldExtractions(daysOld: number = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await this.prisma.extractedData.deleteMany({
        where: {
          extractedAt: {
            lt: cutoffDate
          }
        }
      });

      console.log(`🧹 Cleaned up ${result.count} old extractions`);
      return result.count;

    } catch (error: any) {
      console.error('❌ Failed to cleanup old extractions:', error.message);
      throw new Error(`Database error: ${error.message}`);
    }
  }

  /**
   * Close database connection
   */
  async disconnect() {
    await this.prisma.$disconnect();
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let databaseService: DatabaseService | null = null;

export function getDatabaseService(): DatabaseService {
  if (!databaseService) {
    databaseService = new DatabaseService();
  }
  return databaseService;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default DatabaseService;