import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabaseUrl = 'https://kmdvxphsbtyiorwbvklg.supabase.co'
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseKey) {
      return res.status(500).json({ error: 'No Supabase key found' })
    }

    console.log('Testing Supabase connection...')
    console.log('URL:', supabaseUrl)
    console.log('Key length:', supabaseKey.length)
    console.log('Key starts with:', supabaseKey.substring(0, 20))

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Test 1: Simple query
    console.log('Testing simple query...')
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    if (testError) {
      console.error('Test query error:', testError)
      return res.status(500).json({ 
        error: 'Supabase connection failed', 
        details: testError,
        step: 'simple_query'
      })
    }

    // Test 2: Check if users table exists
    console.log('Checking users table schema...')
    const { data: schemaData, error: schemaError } = await supabase
      .rpc('get_table_info', { table_name: 'users' })
      .single()

    console.log('Schema check result:', { schemaData, schemaError })

    res.json({
      success: true,
      message: 'Supabase connection successful',
      testQuery: { data: testData, error: testError },
      schemaCheck: { data: schemaData, error: schemaError }
    })

  } catch (error) {
    console.error('Detailed test error:', error)
    res.status(500).json({ 
      error: 'Test failed', 
      details: (error as Error).message 
    })
  }
}