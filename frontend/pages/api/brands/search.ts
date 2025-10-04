import { NextApiRequest, NextApiResponse } from 'next'
import { brandManager } from '../../../lib/data/brandDatabase'
import { 
  sendSuccess, 
  sendError, 
  sendValidationError, 
  validateMethod,
  withErrorHandling,
  ApiResponse 
} from '../../../lib/api-response'

/**
 * Brand Search API
 * GET /api/brands/search?q=searchterm - Search brands across all divisions
 */
async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  if (!validateMethod(req, res, ['GET'])) {
    return
  }

  await handleSearchBrands(req, res)
}

/**
 * Search brands across all divisions
 * GET /api/brands/search?q=searchterm
 */
async function handleSearchBrands(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  try {
    const { q } = req.query
    
    if (!q || typeof q !== 'string') {
      return sendValidationError(res, 'Search query parameter "q" is required', {
        example: '/api/brands/search?q=ACKNOTIN'
      })
    }

    if (q.trim().length < 2) {
      return sendValidationError(res, 'Search query must be at least 2 characters long')
    }
    
    const results = brandManager.searchBrands(q)
    
    const responseData = {
      query: q,
      results: results.map(result => ({
        brand: result.brand,
        division: {
          id: result.division.id,
          name: result.division.name,
          description: result.division.description
        },
        matchType: getMatchType(result.brand, q)
      })),
      summary: {
        totalResults: results.length,
        divisionsFound: Array.from(new Set(results.map(r => r.division.id))).length,
        exactMatches: results.filter(r => 
          r.brand.name.toUpperCase() === q.toUpperCase() ||
          r.brand.aliases?.some(alias => alias.toUpperCase() === q.toUpperCase())
        ).length
      }
    }
    
    sendSuccess(res, responseData)
  } catch (error: any) {
    sendError(res, 'Failed to search brands', 500, 'SEARCH_BRANDS_ERROR', error.message)
  }
}

/**
 * Determine the type of match for search results
 */
function getMatchType(brand: any, query: string): string {
  const upperQuery = query.toUpperCase()
  const upperBrandName = brand.name.toUpperCase()
  
  if (upperBrandName === upperQuery) {
    return 'exact_name'
  }
  
  if (brand.aliases?.some((alias: string) => alias.toUpperCase() === upperQuery)) {
    return 'exact_alias'
  }
  
  if (upperBrandName.startsWith(upperQuery)) {
    return 'name_prefix'
  }
  
  if (brand.aliases?.some((alias: string) => alias.toUpperCase().startsWith(upperQuery))) {
    return 'alias_prefix'
  }
  
  if (upperBrandName.includes(upperQuery)) {
    return 'name_contains'
  }
  
  if (brand.aliases?.some((alias: string) => alias.toUpperCase().includes(upperQuery))) {
    return 'alias_contains'
  }
  
  return 'partial'
}

export default withErrorHandling(handler)