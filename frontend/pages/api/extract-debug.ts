import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import { promises as fs } from 'fs';

// Disable body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: { message: 'Method not allowed' }
    })
  }

  const debugSteps = []
  let tempFilePath: string | null = null

  try {
    debugSteps.push('1. Starting extract debug')

    // Step 1: Parse form data
    debugSteps.push('2. Parsing form data...')
    const form = formidable({
      uploadDir: '/tmp',
      keepExtensions: true,
      maxFileSize: 50 * 1024 * 1024, // 50MB
      maxFiles: 1,
      allowEmptyFiles: false,
    })

    const [fields, files] = await form.parse(req)
    debugSteps.push('3. Form data parsed successfully')

    const file = Array.isArray(files.file) ? files.file[0] : files.file
    if (!file) {
      debugSteps.push('4. ERROR: No file found in upload')
      return res.status(400).json({
        success: false,
        error: { message: 'No PDF file provided' },
        debugSteps
      })
    }

    debugSteps.push(`4. File found: ${file.originalFilename} (${file.size} bytes)`)
    tempFilePath = file.filepath

    // Step 2: Validate file
    debugSteps.push('5. Validating file...')
    if (file.mimetype !== 'application/pdf') {
      debugSteps.push(`6. ERROR: Invalid mimetype: ${file.mimetype}`)
      return res.status(400).json({
        success: false,
        error: { message: 'Only PDF files are allowed' },
        debugSteps
      })
    }
    debugSteps.push('6. File validation passed')

    // Step 3: Check environment
    debugSteps.push('7. Checking environment...')
    const nanonetsApiKey = process.env.NANONETS_API_KEY
    if (!nanonetsApiKey) {
      debugSteps.push('8. ERROR: NANONETS_API_KEY not found')
      return res.status(500).json({
        success: false,
        error: { message: 'Nanonets API key not configured' },
        debugSteps
      })
    }
    debugSteps.push('8. Environment check passed')

    // Step 4: Read file
    debugSteps.push('9. Reading file buffer...')
    const fileBuffer = await fs.readFile(file.filepath)
    debugSteps.push(`10. File buffer read: ${fileBuffer.length} bytes`)

    // Step 5: Test Nanonets service import
    debugSteps.push('11. Importing nanonets service...')
    const { nanonetsService } = await import('../../lib/services/nanonetsExtractionService')
    debugSteps.push('12. Nanonets service imported successfully')

    // Step 6: Test service method call
    debugSteps.push('13. Calling nanonets service...')
    const outputType = (Array.isArray(fields.output_type) ? fields.output_type[0] : fields.output_type) || 'flat-json'
    
    try {
      const extractionResult = await nanonetsService.extractFromBuffer(
        fileBuffer, 
        file.originalFilename || 'document.pdf', 
        outputType as any
      )
      debugSteps.push('14. Nanonets service call completed')
      
      if (extractionResult.success) {
        debugSteps.push('15. SUCCESS: Extraction completed successfully')
        return res.status(200).json({
          success: true,
          message: 'Debug extraction completed successfully',
          debugSteps,
          extractionResult: {
            success: extractionResult.success,
            hasData: !!extractionResult.data,
            hasText: !!extractionResult.extractedText,
            dataKeys: extractionResult.data ? Object.keys(extractionResult.data) : []
          }
        })
      } else {
        debugSteps.push(`15. ERROR: Extraction failed: ${extractionResult.error}`)
        return res.status(500).json({
          success: false,
          error: { message: extractionResult.error || 'Extraction failed' },
          debugSteps
        })
      }
    } catch (serviceError) {
      debugSteps.push(`14. ERROR: Service call failed: ${serviceError instanceof Error ? serviceError.message : 'Unknown error'}`)
      return res.status(500).json({
        success: false,
        error: { 
          message: 'Nanonets service call failed',
          details: serviceError instanceof Error ? serviceError.message : 'Unknown error'
        },
        debugSteps
      })
    }

  } catch (error) {
    debugSteps.push(`ERROR at step: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return res.status(500).json({
      success: false,
      error: { 
        message: 'Debug extraction failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      debugSteps
    })
  } finally {
    // Clean up
    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath)
        debugSteps.push('Cleanup: Temporary file deleted')
      } catch (cleanupError) {
        debugSteps.push('Cleanup: Failed to delete temporary file')
      }
    }
  }
}