import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  console.log('=== SUPABASE DEBUG ===')
  console.log('URL:', supabaseUrl)
  console.log('Service Key Length:', serviceKey?.length)
  console.log('Service Key Start:', serviceKey?.substring(0, 50))
  console.log('Service Key End:', serviceKey?.substring(-20))
  
  // Try a simple ping to Supabase
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': serviceKey!,
        'Authorization': `Bearer ${serviceKey}`
      }
    })
    
    const text = await response.text()
    console.log('Ping response:', response.status, text)
    
    res.json({
      url: supabaseUrl,
      keyLength: serviceKey?.length,
      pingStatus: response.status,
      pingResponse: text,
      headers: Object.fromEntries(response.headers.entries())
    })
  } catch (error) {
    console.error('Ping failed:', error)
    res.status(500).json({ error: (error as Error).message })
  }
}