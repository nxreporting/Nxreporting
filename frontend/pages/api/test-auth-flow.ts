import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Test the auth flow by making internal API calls
    const baseUrl = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`
    
    // Test 1: Check if /auth/me endpoint is accessible
    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(200).json({
        success: true,
        message: 'Auth flow test - no token provided',
        tests: {
          authMeEndpoint: 'not_tested_no_token'
        }
      })
    }

    // Test /auth/me endpoint
    const authMeResponse = await fetch(`${baseUrl}/api/auth/me`, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    })

    const authMeResult = await authMeResponse.text()
    
    let authMeData
    try {
      authMeData = JSON.parse(authMeResult)
    } catch (e) {
      authMeData = { error: 'Failed to parse JSON', raw: authMeResult }
    }

    res.status(200).json({
      success: true,
      message: 'Auth flow test completed',
      tests: {
        authMeEndpoint: {
          status: authMeResponse.status,
          statusText: authMeResponse.statusText,
          data: authMeData
        }
      }
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
  }
}