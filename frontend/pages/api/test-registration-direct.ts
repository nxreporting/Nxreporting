import { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Test registration with actual data
    const testEmail = `test-${Date.now()}@example.com`
    const testPassword = 'testpassword123'
    const testName = 'Test User'
    const role = 'USER'

    // Create Supabase client
    const supabaseUrl = 'https://kmdvxphsbtyiorwbvklg.supabase.co'
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseServiceKey) {
      return res.status(500).json({
        success: false,
        error: 'Missing Supabase key'
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
      .eq('email', testEmail)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      return res.status(500).json({
        success: false,
        error: 'Database check failed',
        details: checkError.message
      })
    }

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists'
      })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(testPassword, 12)

    // Create user
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        email: testEmail,
        password: hashedPassword,
        name: testName,
        role
      })
      .select('id, email, name, role, createdAt')
      .single()

    if (insertError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create user',
        details: insertError.message
      })
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      return res.status(500).json({
        success: false,
        error: 'Missing JWT secret'
      })
    }

    const token = jwt.sign(
      { 
        id: newUser.id, 
        email: newUser.email, 
        role: newUser.role 
      },
      jwtSecret,
      { expiresIn: '7d' }
    )

    // Clean up - delete the test user
    await supabase
      .from('users')
      .delete()
      .eq('id', newUser.id)

    // Return success
    res.status(200).json({
      success: true,
      message: 'Registration test completed successfully!',
      testUser: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      },
      tokenGenerated: !!token,
      tokenLength: token.length
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
  }
}