import { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const steps = []
  
  try {
    steps.push('1. Starting debug registration')

    // Test environment variables
    const hasSupabaseKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
    const hasJwtSecret = !!process.env.JWT_SECRET
    steps.push(`2. Environment check - Supabase: ${hasSupabaseKey}, JWT: ${hasJwtSecret}`)

    if (!hasSupabaseKey) {
      return res.status(500).json({ success: false, error: 'Missing SUPABASE_SERVICE_ROLE_KEY', steps })
    }

    if (!hasJwtSecret) {
      return res.status(500).json({ success: false, error: 'Missing JWT_SECRET', steps })
    }

    // Test Supabase connection
    const supabaseUrl = 'https://kmdvxphsbtyiorwbvklg.supabase.co'
    const supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    steps.push('3. Supabase client created')

    // Test query
    const { data, error } = await supabase
      .from('users')
      .select('id, email')
      .limit(1)

    if (error) {
      steps.push(`4. Supabase query failed: ${error.message}`)
      return res.status(500).json({ success: false, error: error.message, steps })
    }

    steps.push(`4. Supabase query successful, found ${data?.length || 0} users`)

    // Test password hashing
    const testPassword = 'testpassword123'
    const hashedPassword = await bcrypt.hash(testPassword, 12)
    steps.push('5. Password hashing successful')

    // Test JWT generation
    const testPayload = { id: 'test-id', email: 'test@example.com', role: 'USER' }
    const token = jwt.sign(testPayload, process.env.JWT_SECRET!, { expiresIn: '7d' })
    steps.push('6. JWT generation successful')

    res.status(200).json({
      success: true,
      message: 'All registration components working',
      steps,
      hashedPasswordLength: hashedPassword.length,
      tokenLength: token.length
    })

  } catch (error) {
    steps.push(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      steps,
      stack: error instanceof Error ? error.stack : undefined
    })
  }
}