import { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import { promises as fs } from 'fs'
import { ocrService } from '../../lib/services/multiProviderOCRService'

// Disable body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
    maxDuration: 45,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: { message: 'Method not allowed' }
    })
  }

  let tempFilePath: string | null = null

  try {
    console.log('📨 Simple PDF extraction request received')

    // Parse form data
    const form = formidable({
      uploadDir: '/tmp',
      keepExtensions: true,
      maxFileSize: 50 * 1024 * 1024, // 50MB
      maxFiles: 1,
      allowEmptyFiles: false,
    })

    const [fields, files] = await form.parse(req)
    const file = Array.isArray(files.file) ? files.file[0] : files.file

    if (!file) {
      return res.status(400).json({
        success: false,
        error: { message: 'No PDF file provided' }
      })
    }

    tempFilePath = file.filepath

    console.log(`📄 Processing file: ${file.originalFilename}`)
    console.log(`📏 File size: ${(file.size / 1024).toFixed(2)} KB`)

    // Basic file validation
    if (file.mimetype !== 'application/pdf') {
      return res.status(400).json({
        success: false,
        error: { message: 'Only PDF files are allowed' }
      })
    }

    if (file.size > 50 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        error: { message: 'File too large. Maximum size is 50MB' }
      })
    }

    // Read file buffer
    const fileBuffer = await fs.readFile(file.filepath)

    console.log('🔬 Starting multi-provider OCR extraction...')
    
    // Use the multi-provider OCR service
    const extractionResult = await ocrService.extractFromBuffer(
      fileBuffer,
      file.originalFilename || 'document.pdf'
    )

    if (!extractionResult.success) {
      console.error('❌ OCR extraction failed:', extractionResult.error)
      return res.status(500).json({
        success: false,
        error: { 
          message: 'OCR extraction failed',
          details: extractionResult.error,
          provider: extractionResult.provider
        }
      })
    }

    console.log(`✅ OCR extraction successful using ${extractionResult.provider}`)

    // Return simplified response
    res.status(200).json({
      success: true,
      data: {
        message: 'PDF extracted successfully (simple version)',
        extractedText: extractionResult.extractedText,
        provider: extractionResult.provider,
        metadata: {
          originalFilename: file.originalFilename,
          fileSize: file.size,
          processedAt: new Date().toISOString(),
          duration: extractionResult.metadata?.duration,
          attempts: extractionResult.metadata?.attempts
        }
      }
    })

  } catch (error) {
    console.error('❌ Simple extraction error:', error)
    res.status(500).json({
      success: false,
      error: { 
        message: 'PDF extraction failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    })
  } finally {
    // Clean up temporary file
    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath)
        console.log('🗑️ Temporary file cleaned up')
      } catch (cleanupError) {
        console.warn('⚠️ Failed to clean up temporary file:', cleanupError)
      }
    }
  }
}