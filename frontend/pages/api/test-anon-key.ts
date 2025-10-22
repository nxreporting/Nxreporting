import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabaseUrl = 'https://kmdvxphsbtyiorwbvklg.supabase.co'
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log('Testing both keys...')
    console.log('Anon key exists:', !!anonKey)
    console.log('Service key exists:', !!serviceKey)

    // Test with anon key
    const anonResponse = await fetch(`${supabaseUrl}/rest/v1/users?select=count&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': anonKey!,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      }
    })

    const anonText = await anonResponse.text()
    console.log('Anon key response:', anonResponse.status, anonText)

    // Test with service key
    const serviceResponse = await fetch(`${supabaseUrl}/rest/v1/users?select=count&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': serviceKey!,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json'
      }
    })

    const serviceText = await serviceResponse.text()
    console.log('Service key response:', serviceResponse.status, serviceText)

    res.json({
      anonKey: {
        status: anonResponse.status,
        response: anonText,
        success: anonResponse.ok
      },
      serviceKey: {
        status: serviceResponse.status,
        response: serviceText,
        success: serviceResponse.ok
      }
    })

  } catch (error) {
    console.error('Test error:', error)
    res.status(500).json({ 
      error: 'Test failed', 
      details: (error as Error).message 
    })
  }
}