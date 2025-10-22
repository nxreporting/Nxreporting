import { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  res.json({
    hasKey: !!supabaseKey,
    keyLength: supabaseKey?.length || 0,
    keyStart: supabaseKey?.substring(0, 20) + '...',
    keyIsPlaceholder: supabaseKey?.includes('REPLACE_WITH') || supabaseKey?.includes('your_supabase'),
    allEnvKeys: Object.keys(process.env).filter(key => key.includes('SUPABASE'))
  })
}