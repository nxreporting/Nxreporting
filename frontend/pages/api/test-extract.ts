import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('Testing extract endpoint dependencies...')
    
    const tests = []
    
    // Test 1: Check if nanonets service can be imported
    try {
      const { nanonetsService } = await import('../../lib/services/nanonetsExtractionService')
      tests.push({
        test: 'nanonetsService import',
        success: true,
        hasApiKey: !!process.env.NANONETS_API_KEY
      })
    } catch (error) {
      tests.push({
        test: 'nanonetsService import',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
    
    // Test 2: Check if DataFormatter can be imported
    try {
      const { DataFormatter } = await import('../../lib/utils/dataFormatter')
      tests.push({
        test: 'DataFormatter import',
        success: true
      })
    } catch (error) {
      tests.push({
        test: 'DataFormatter import',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
    
    // Test 3: Check if storage utilities can be imported
    try {
      const { uploadFile, validateFile, generateSafeFilename } = await import('../../lib/storage')
      tests.push({
        test: 'storage utilities import',
        success: true
      })
    } catch (error) {
      tests.push({
        test: 'storage utilities import',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
    
    // Test 4: Check if timeout utilities can be imported
    try {
      const { withTimeout, executeWithLimits, checkMemoryUsage } = await import('../../lib/timeout')
      tests.push({
        test: 'timeout utilities import',
        success: true
      })
    } catch (error) {
      tests.push({
        test: 'timeout utilities import',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
    
    // Test 5: Check if monitoring can be imported
    try {
      const { withExtractionMonitoring } = await import('../../lib/monitoring')
      tests.push({
        test: 'monitoring import',
        success: true
      })
    } catch (error) {
      tests.push({
        test: 'monitoring import',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
    
    // Test 6: Check environment variables
    tests.push({
      test: 'environment variables',
      success: true,
      variables: {
        NANONETS_API_KEY: !!process.env.NANONETS_API_KEY,
        MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || 'not set'
      }
    })
    
    res.status(200).json({
      success: true,
      message: 'Extract endpoint dependency test completed',
      tests
    })
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
  }
}