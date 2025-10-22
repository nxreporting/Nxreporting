import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabaseUrl = 'https://kmdvxphsbtyiorwbvklg.supabase.co'
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log('Testing direct Supabase connection...')
    console.log('URL:', supabaseUrl)
    console.log('Key exists:', !!supabaseKey)
    console.log('Key length:', supabaseKey?.length)

    if (!supabaseKey) {
      return res.status(500).json({ error: 'No Supabase key' })
    }

    // Test with direct fetch instead of Supabase client
    const response = await fetch(`${supabaseUrl}/rest/v1/users?select=count&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'count=exact'
      }
    })

    const responseText = await response.text()
    console.log('Direct fetch response status:', response.status)
    console.log('Direct fetch response:', responseText)

    if (!response.ok) {
      return res.status(500).json({ 
        error: 'Direct fetch failed', 
        status: response.status,
        response: responseText,
        headers: Object.fromEntries(response.headers.entries())
      })
    }

    res.json({
      success: true,
      message: 'Direct Supabase connection successful',
      status: response.status,
      data: responseText
    })

  } catch (error) {
    console.error('Direct test error:', error)
    res.status(500).json({ 
      error: 'Test failed', 
      details: (error as Error).message 
    })
  }
}