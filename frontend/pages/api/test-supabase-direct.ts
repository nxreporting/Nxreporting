import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Test direct Supabase connection using their client
    const { createClient } = require('@supabase/supabase-js')
    
    const supabaseUrl = 'https://kmdvxphsbtyiorwbvklg.supabase.co'
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'missing'
    
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({
        success: false,
        error: 'SUPABASE_SERVICE_ROLE_KEY not configured'
      })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Test connection by querying users table
    const { data, error } = await supabase
      .from('users')
      .select('count(*)')
      .limit(1)

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Supabase query failed',
        details: error.message,
        code: error.code
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Supabase connection successful',
      data: data
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}