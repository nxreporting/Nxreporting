import { NextApiRequest, NextApiResponse } from 'next'
import * as formidable from 'formidable'
import { promises as fs } from 'fs'
// UUID functionality is handled by generateSafeFilename
import { prisma } from '../../../lib/prisma'
import { withAuth, AuthRequest } from '../../../lib/auth'
import { 
  sendSuccess, 
  sendError, 
  sendValidationError, 
  validateMethod,
  withErrorHandling 
} from '../../../lib/api-response'
import { uploadFile, validateFile, generateSafeFilename } from '../../../lib/storage'
import { nanonetsService } from '../../../lib/services/nanonetsExtractionService'

// Disable default body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
}

async function handler(req: AuthRequest, res: NextApiResponse): Promise<void> {
  if (req.method === 'GET') {
    return handleGetFiles(req, res)
  } else if (req.method === 'POST') {
    return handleFileUpload(req, res)
  } else {
    validateMethod(req, res, ['GET', 'POST'])
    return
  }
}

/**
 * GET /api/files - Get user's uploaded files with pagination
 */
async function handleGetFiles(req: AuthRequest, res: NextApiResponse) {
  try {
    const user = req.user!
    const page = parseInt(req.query.page as string) || 1
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50) // Max 50 items per page
    const skip = (page - 1) * limit

    const [files, total] = await Promise.all([
      prisma.uploadedFile.findMany({
        where: { uploadedById: user.id },
        include: {
          extractedData: {
            select: {
              id: true,
              status: true,
              extractedAt: true,
              errorMessage: true
            }
          }
        },
        orderBy: { uploadedAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.uploadedFile.count({
        where: { uploadedById: user.id }
      })
    ])

    sendSuccess(res, { files }, 200, { page, limit, total })
  } catch (error) {
    console.error('Get files error:', error)
    sendError(res, 'Failed to fetch files', 500)
  }
}

/**
 * POST /api/files - Upload PDF file and optionally extract data
 */
async function handleFileUpload(req: AuthRequest, res: NextApiResponse) {
  try {
    const user = req.user!

    // Parse multipart form data
    const form = formidable({
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800'), // 50MB default
      keepExtensions: true,
      allowEmptyFiles: false,
    })

    const [fields, files] = await form.parse(req)
    const uploadedFile = Array.isArray(files.pdf) ? files.pdf[0] : files.pdf

    if (!uploadedFile) {
      return sendValidationError(res, 'No file uploaded')
    }

    // Validate file type and size
    const fileBuffer = await fs.readFile(uploadedFile.filepath)
    
    // Create a mock File object for validation
    const mockFile = {
      size: uploadedFile.size,
      type: uploadedFile.mimetype || 'application/pdf',
      name: uploadedFile.originalFilename || 'document.pdf'
    } as File

    const validation = validateFile(mockFile, {
      maxSize: parseInt(process.env.MAX_FILE_SIZE || '52428800'),
      allowedTypes: ['application/pdf']
    })

    if (!validation.valid) {
      // Clean up temporary file
      await fs.unlink(uploadedFile.filepath).catch(() => {})
      return sendValidationError(res, validation.error)
    }

    // Generate safe filename and upload to cloud storage
    const safeFilename = generateSafeFilename(uploadedFile.originalFilename || 'document.pdf')
    const uploadResult = await uploadFile(fileBuffer, safeFilename)

    if (!uploadResult.success) {
      // Clean up temporary file
      await fs.unlink(uploadedFile.filepath).catch(() => {})
      return sendError(res, uploadResult.error || 'File upload failed', 500)
    }

    // Save file info to database
    const dbFile = await prisma.uploadedFile.create({
      data: {
        originalName: uploadedFile.originalFilename || 'document.pdf',
        filename: safeFilename,
        path: uploadResult.url!, // Cloud storage URL
        mimetype: uploadedFile.mimetype || 'application/pdf',
        size: uploadedFile.size,
        uploadedById: user.id
      }
    })

    // Check if AI extraction is requested
    const useAI = fields.useAI?.[0] === 'true' || req.query.useAI === 'true'
    
    // Start PDF extraction process (async, don't wait for completion)
    extractPDFDataAsync(uploadedFile.filepath, uploadResult.url!, dbFile.id, user.id, useAI)
      .catch(error => {
        console.error('Async extraction error:', error)
      })

    // Clean up temporary file
    await fs.unlink(uploadedFile.filepath).catch(() => {})

    sendSuccess(res, { file: dbFile }, 201)
  } catch (error) {
    console.error('Upload error:', error)
    sendError(res, 'File upload failed', 500)
  }
}

/**
 * Async PDF extraction function that doesn't block the response
 */
async function extractPDFDataAsync(
  tempFilePath: string,
  cloudUrl: string,
  fileId: string,
  userId: string,
  useAI: boolean
) {
  try {
    console.log(`🚀 Starting extraction for file ${fileId} (AI: ${useAI})`)
    
    // Use Nanonets service for extraction from cloud URL
    const nanonetsResult = await nanonetsService.extractFromUrl(cloudUrl, 'flat-json')
    
    if (!nanonetsResult.success) {
      throw new Error(nanonetsResult.error || 'Nanonets extraction failed')
    }
    
    // Prepare extracted data in the expected format
    const extractedData = {
      raw: {
        text: nanonetsResult.extractedText || '',
        pages: 1, // Nanonets doesn't provide page count
        info: nanonetsResult.rawResponse
      },
      structured: {
        title: extractTitleFromText(nanonetsResult.extractedText || ''),
        dates: extractDatesFromText(nanonetsResult.extractedText || ''),
        numbers: extractNumbersFromText(nanonetsResult.extractedText || ''),
        metadata: {
          extractionMethod: 'nanonets',
          extractionTimestamp: new Date().toISOString(),
          useAI: useAI
        }
      }
    }
    
    // If AI extraction was requested, add AI-specific data
    if (useAI && nanonetsResult.data) {
      (extractedData.structured as any).aiExtracted = {
        success: true,
        data: nanonetsResult.data
      }
    }
    
    await prisma.extractedData.create({
      data: {
        rawData: extractedData.raw,
        structuredData: extractedData.structured,
        status: 'COMPLETED',
        fileId: fileId,
        extractedById: userId
      }
    })
    
    console.log('✅ Extraction completed successfully for file', fileId)
  } catch (extractionError) {
    console.error('Extraction error for file', fileId, ':', extractionError)
    
    await prisma.extractedData.create({
      data: {
        rawData: {},
        structuredData: {},
        status: 'FAILED',
        errorMessage: extractionError instanceof Error ? extractionError.message : 'Unknown error',
        fileId: fileId,
        extractedById: userId
      }
    })
  } finally {
    // Clean up temporary file if it still exists
    try {
      await fs.unlink(tempFilePath)
    } catch (error) {
      // File might already be cleaned up, ignore error
    }
  }
}

/**
 * Helper functions for basic text extraction
 */
function extractTitleFromText(text: string): string {
  const lines = text.split('\n').filter(line => line.trim().length > 0)
  if (lines.length > 0) {
    const titleCandidate = lines.find(line => 
      line.trim().length > 10 && 
      !/^\d+$/.test(line.trim()) &&
      !line.includes('Page ')
    )
    return titleCandidate ? titleCandidate.trim() : lines[0].trim()
  }
  return ''
}

function extractDatesFromText(text: string): string[] {
  const datePatterns = [
    /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,
    /\b\d{1,2}-\d{1,2}-\d{4}\b/g,
    /\b\d{4}-\d{2}-\d{2}\b/g
  ]
  
  let dates: string[] = []
  datePatterns.forEach(pattern => {
    const matches = text.match(pattern)
    if (matches) {
      dates = [...dates, ...matches]
    }
  })
  return Array.from(new Set(dates))
}

function extractNumbersFromText(text: string): number[] {
  const numberPattern = /\b\d+(?:\.\d{2})?\b/g
  const matches = text.match(numberPattern)
  if (matches) {
    return matches.map(num => parseFloat(num)).filter(num => !isNaN(num))
  }
  return []
}

export default withAuth(withErrorHandling(handler))