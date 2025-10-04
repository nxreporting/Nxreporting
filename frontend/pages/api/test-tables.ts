import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
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

    const tests = []

    // Test 1: Check if users table exists
    try {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, name')
        .limit(1)
      
      tests.push({
        table: 'users',
        success: !usersError,
        error: usersError?.message,
        sampleData: users?.[0] || null
      })
    } catch (e) {
      tests.push({
        table: 'users',
        success: false,
        error: e instanceof Error ? e.message : 'Unknown error'
      })
    }

    // Test 2: Check if uploaded_files table exists
    try {
      const { data: files, error: filesError } = await supabase
        .from('uploaded_files')
        .select('id, originalName')
        .limit(1)
      
      tests.push({
        table: 'uploaded_files',
        success: !filesError,
        error: filesError?.message,
        sampleData: files?.[0] || null
      })
    } catch (e) {
      tests.push({
        table: 'uploaded_files',
        success: false,
        error: e instanceof Error ? e.message : 'Unknown error'
      })
    }

    // Test 3: Check if extracted_data table exists
    try {
      const { data: extractions, error: extractionsError } = await supabase
        .from('extracted_data')
        .select('id, status')
        .limit(1)
      
      tests.push({
        table: 'extracted_data',
        success: !extractionsError,
        error: extractionsError?.message,
        sampleData: extractions?.[0] || null
      })
    } catch (e) {
      tests.push({
        table: 'extracted_data',
        success: false,
        error: e instanceof Error ? e.message : 'Unknown error'
      })
    }

    res.status(200).json({
      success: true,
      message: 'Table existence test completed',
      tests
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}