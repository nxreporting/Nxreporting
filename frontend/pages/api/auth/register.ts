import { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'

// Simple CUID generator (similar to Prisma's cuid())
function generateCuid(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 15)
  return `c${timestamp}${randomPart}`
}



export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: { message: 'Method not allowed' } 
    })
  }

  try {
    const { email, password, name, role = 'USER' } = req.body

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: { message: 'Email, password, and name are required' }
      })
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: { message: 'Password must be at least 6 characters' }
      })
    }

    // Create Supabase client with service role key (bypasses RLS)
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

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error checking existing user:', checkError)
      return res.status(500).json({
        success: false,
        error: { message: 'Database error occurred' }
      })
    }

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: { message: 'User already exists with this email' }
      })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const now = new Date().toISOString()
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        id: generateCuid(), // Generate ID manually
        email,
        password: hashedPassword,
        name,
        role,
        createdAt: now,
        updatedAt: now
      })
      .select('id, email, name, role, createdAt')
      .single()

    if (insertError) {
      console.error('Error creating user:', insertError)
      return res.status(500).json({
        success: false,
        error: { message: 'Failed to create user account' }
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
        id: newUser.id, 
        email: newUser.email, 
        role: newUser.role 
      },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
    )

    // Return success response
    res.status(201).json({
      success: true,
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          createdAt: newUser.createdAt
        },
        token
      }
    })

  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({
      success: false,
      error: { 
        message: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      }
    })
  }
}