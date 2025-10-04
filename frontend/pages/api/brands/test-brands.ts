import { NextApiRequest, NextApiResponse } from 'next';
import { createSuccessResponse, createErrorResponse } from '../../../lib/api-response';

/**
 * Brand API Test Route
 * GET /api/brands/test-brands - Test all brand management endpoints
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json(createErrorResponse('Method not allowed', 'METHOD_NOT_ALLOWED'));
  }

  const baseUrl = `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}`;
  const testResults: any[] = [];

  try {
    // Test 1: Get all divisions
    console.log('Testing GET /api/brands/divisions');
    const divisionsResponse = await fetch(`${baseUrl}/api/brands/divisions`);
    const divisionsData = await divisionsResponse.json();
    testResults.push({
      endpoint: 'GET /api/brands/divisions',
      status: divisionsResponse.status,
      success: divisionsData.success,
      dataCount: divisionsData.data?.length || 0
    });

    // Test 2: Get brands by division
    console.log('Testing GET /api/brands/divisions/cnx-main');
    const divisionBrandsResponse = await fetch(`${baseUrl}/api/brands/divisions/cnx-main`);
    const divisionBrandsData = await divisionBrandsResponse.json();
    testResults.push({
      endpoint: 'GET /api/brands/divisions/cnx-main',
      status: divisionBrandsResponse.status,
      success: divisionBrandsData.success,
      dataCount: divisionBrandsData.data?.length || 0
    });

    // Test 3: Search brands
    console.log('Testing GET /api/brands/search?q=CNX');
    const searchResponse = await fetch(`${baseUrl}/api/brands/search?q=CNX`);
    const searchData = await searchResponse.json();
    testResults.push({
      endpoint: 'GET /api/brands/search?q=CNX',
      status: searchResponse.status,
      success: searchData.success,
      dataCount: searchData.data?.length || 0
    });

    // Test 4: Identify brand
    console.log('Testing POST /api/brands/identify');
    const identifyResponse = await fetch(`${baseUrl}/api/brands/identify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productName: 'ACKNOTIN-5' })
    });
    const identifyData = await identifyResponse.json();
    testResults.push({
      endpoint: 'POST /api/brands/identify',
      status: identifyResponse.status,
      success: identifyData.success,
      matched: identifyData.data?.matched || false
    });

    // Test 5: Get brand statistics
    console.log('Testing GET /api/brands/stats');
    const statsResponse = await fetch(`${baseUrl}/api/brands/stats`);
    const statsData = await statsResponse.json();
    testResults.push({
      endpoint: 'GET /api/brands/stats',
      status: statsResponse.status,
      success: statsData.success,
      totalBrands: statsData.data?.totalBrands || 0,
      totalDivisions: statsData.data?.totalDivisions || 0
    });

    return res.json(createSuccessResponse({
      message: 'Brand API endpoints tested successfully',
      results: testResults,
      summary: {
        totalTests: testResults.length,
        passed: testResults.filter(r => r.success && r.status < 400).length,
        failed: testResults.filter(r => !r.success || r.status >= 400).length
      }
    }));

  } catch (error: any) {
    console.error('Brand API test error:', error);
    return res.status(500).json(createErrorResponse(
      'Failed to test brand API endpoints', 
      'TEST_ERROR', 
      { error: error.message, results: testResults }
    ));
  }
}