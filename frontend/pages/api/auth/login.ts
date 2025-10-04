import { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: { message: 'Method not allowed' } 
    })
  }

  try {
    const { email, password } = req.body

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { message: 'Email and password are required' }
      })
    }

    // Create Supabase client with service role key
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

    // Find user by email
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('id, email, name, role, password')
      .eq('email', email)
      .single()

    if (findError || !user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid credentials' }
      })
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid credentials' }
      })
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      return res.status(500).json({
        success: false,
        error: { message: 'Server configuration error: Missing JWT secret' }
      })
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )

    // Return success response (exclude password)
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        token
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      success: false,
      error: { 
        message: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      }
    })
  }
}