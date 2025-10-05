import { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import { promises as fs } from 'fs'

// Disable body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
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

    // Get output type
    const outputType = (Array.isArray(fields.output_type) ? fields.output_type[0] : fields.output_type) || 'flat-json'

    // Test Nanonets API call
    const nanonetsApiKey = process.env.NANONETS_API_KEY
    if (!nanonetsApiKey) {
      return res.status(500).json({
        success: false,
        error: { message: 'Nanonets API key not configured' }
      })
    }

    // Read file buffer
    const fileBuffer = await fs.readFile(file.filepath)

    // Make direct API call to Nanonets
    const formData = new FormData()
    formData.append('file', new Blob([fileBuffer], { type: 'application/pdf' }), file.originalFilename || 'document.pdf')
    formData.append('output_type', outputType)

    console.log('🔬 Starting Nanonets API call...')
    
    const nanonetsResponse = await fetch('https://app.nanonets.com/api/v2/OCR/Model/bd442c54-71de-4057-a0b8-91c4c8b5e5e1/LabelFile/', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(nanonetsApiKey + ':').toString('base64')}`
      },
      body: formData
    })

    if (!nanonetsResponse.ok) {
      const errorText = await nanonetsResponse.text()
      console.error('❌ Nanonets API error:', nanonetsResponse.status, errorText)
      return res.status(500).json({
        success: false,
        error: { 
          message: 'Nanonets API call failed',
          details: `Status: ${nanonetsResponse.status}, Response: ${errorText}`
        }
      })
    }

    const nanonetsResult = await nanonetsResponse.json()
    console.log('✅ Nanonets API call successful')

    // Return simplified response
    res.status(200).json({
      success: true,
      data: {
        message: 'PDF extracted successfully (simple version)',
        nanonetsResult,
        metadata: {
          originalFilename: file.originalFilename,
          fileSize: file.size,
          outputType: outputType,
          processedAt: new Date().toISOString()
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