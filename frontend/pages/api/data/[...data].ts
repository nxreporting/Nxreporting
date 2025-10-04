import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

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

  const { data: segments } = req.query;
  const method = req.method;

  try {
    // Handle different data endpoints based on URL segments
    if (!segments || !Array.isArray(segments)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid endpoint' }
      })
    }

    const [endpoint, ...params] = segments;

    switch (endpoint) {
      case 'analytics':
        if (method === 'GET' && params[0] === 'summary') {
          return await getAnalyticsSummary(req, res, auth.user!);
        }
        break;

      default:
        return res.status(501).json({
          success: false,
          error: { message: 'Endpoint not yet implemented with Supabase' }
        })
    }

    return res.status(404).json({
      success: false,
      error: { message: 'Endpoint not found' }
    })
  } catch (error) {
    console.error('Data API error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    })
  }
}

// Get analytics/summary of extracted data
async function getAnalyticsSummary(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
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

    // Get basic counts
    const { count: totalFiles } = await supabase
      .from('uploaded_files')
      .select('*', { count: 'exact', head: true })
      .eq('uploadedById', user.id)

    const { count: totalExtractions } = await supabase
      .from('extracted_data')
      .select('*', { count: 'exact', head: true })
      .eq('extractedById', user.id)

    const { count: successfulExtractions } = await supabase
      .from('extracted_data')
      .select('*', { count: 'exact', head: true })
      .eq('extractedById', user.id)
      .eq('status', 'COMPLETED')

    const { count: failedExtractions } = await supabase
      .from('extracted_data')
      .select('*', { count: 'exact', head: true })
      .eq('extractedById', user.id)
      .eq('status', 'FAILED')

    // Calculate success rate
    const successRate = totalExtractions && totalExtractions > 0 
      ? ((successfulExtractions || 0) / totalExtractions * 100).toFixed(1) 
      : '0'

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalFiles: totalFiles || 0,
          totalExtractions: totalExtractions || 0,
          successfulExtractions: successfulExtractions || 0,
          failedExtractions: failedExtractions || 0,
          successRate: parseFloat(successRate)
        }
      }
    })
  } catch (error) {
    console.error('Get analytics error:', error);
    return res.status(500).json({
      success: false,
      error: { 
        message: 'Failed to fetch analytics',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      }
    })
  }
}