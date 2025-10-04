import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabaseUrl = 'https://kmdvxphsbtyiorwbvklg.supabase.co'
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseServiceKey) {
      return res.status(500).json({ error: 'Missing Supabase key' })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Check the users table structure
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_info', { table_name: 'users' })
      .single()

    if (tableError) {
      // Alternative: Try to get column information
      const { data: columns, error: colError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_name', 'users')
        .eq('table_schema', 'public')

      if (colError) {
        return res.status(500).json({
          error: 'Could not get table info',
          details: colError.message
        })
      }

      return res.status(200).json({
        success: true,
        message: 'Table column information',
        columns
      })
    }

    res.status(200).json({
      success: true,
      tableInfo
    })

  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}