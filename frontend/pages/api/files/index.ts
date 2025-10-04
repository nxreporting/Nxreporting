import { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'

// Helper function to verify JWT and get user
async function verifyAuth(req: NextApiRequest): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, error: 'No token provided' }
    }

    const token = authHeader.replace('Bearer ', '')
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      return { success: false, error: 'JWT secret not configured' }
    }

    const decoded = jwt.verify(token, jwtSecret) as any
    return { success: true, user: decoded }
  } catch (error) {
    return { success: false, error: 'Invalid token' }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify authentication
  const auth = await verifyAuth(req)
  if (!auth.success) {
    return res.status(401).json({
      success: false,
      error: { message: auth.error }
    })
  }

  if (req.method === 'GET') {
    return handleGetFiles(req, res, auth.user!)
  } else if (req.method === 'POST') {
    return res.status(501).json({
      success: false,
      error: { message: 'File upload not yet implemented with Supabase' }
    })
  } else {
    return res.status(405).json({
      success: false,
      error: { message: 'Method not allowed' }
    })
  }
}

/**
 * GET /api/files - Get user's uploaded files with pagination
 */
async function handleGetFiles(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50) // Max 50 items per page
    const offset = (page - 1) * limit

    // Create Supabase client
    const supabaseUrl = 'https://kmdvxphsbtyiorwbvklg.supabase.co'
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseServiceKey) {
      return res.status(500).json({
        success: false,
        error: { message: 'Server configuration error: Missing Supabase key' }
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get files with extracted data
    const { data: files, error: filesError } = await supabase
      .from('uploaded_files')
      .select(`
        id,
        originalName,
        filename,
        path,
        mimetype,
        size,
        uploadedAt,
        uploadedById,
        extracted_data (
          id,
          status,
          extractedAt,
          errorMessage
        )
      `)
      .eq('uploadedById', user.id)
      .order('uploadedAt', { ascending: false })
      .range(offset, offset + limit - 1)

    if (filesError) {
      console.error('Error fetching files:', filesError)
      return res.status(500).json({
        success: false,
        error: { message: 'Failed to fetch files' }
      })
    }

    // Get total count
    const { count: total, error: countError } = await supabase
      .from('uploaded_files')
      .select('*', { count: 'exact', head: true })
      .eq('uploadedById', user.id)

    if (countError) {
      console.error('Error counting files:', countError)
      return res.status(500).json({
        success: false,
        error: { message: 'Failed to count files' }
      })
    }

    // Transform data to match expected format
    const transformedFiles = files?.map(file => ({
      id: file.id,
      originalName: file.originalName,
      filename: file.filename,
      path: file.path,
      mimetype: file.mimetype,
      size: file.size,
      uploadedAt: file.uploadedAt,
      uploadedById: file.uploadedById,
      extractedData: file.extracted_data || []
    })) || []

    res.status(200).json({
      success: true,
      data: { files: transformedFiles },
      metadata: {
        pagination: {
          page,
          limit,
          total: total || 0,
          totalPages: Math.ceil((total || 0) / limit)
        },
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
    })
  } catch (error) {
    console.error('Get files error:', error)
    res.status(500).json({
      success: false,
      error: { 
        message: 'Failed to fetch files',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      }
    })
  }
}

