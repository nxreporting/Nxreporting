import { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: { message: 'Method not allowed' } 
    })
  }

  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: { message: 'Access denied. No token provided.' }
      })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      return res.status(500).json({
        success: false,
        error: { message: 'Server configuration error: Missing JWT secret' }
      })
    }

    let decoded
    try {
      decoded = jwt.verify(token, jwtSecret) as any
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid token' }
      })
    }

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

    // Fetch user data from database
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('id, email, name, role, createdAt')
      .eq('id', decoded.id)
      .single()

    if (findError || !user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' }
      })
    }

    // Return user data
    res.status(200).json({
      success: true,
      data: { user }
    })

  } catch (error) {
    console.error('Get user profile error:', error)
    res.status(500).json({
      success: false,
      error: { 
        message: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      }
    })
  }
}