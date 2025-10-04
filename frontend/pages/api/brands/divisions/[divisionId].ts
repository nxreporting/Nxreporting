import { NextApiRequest, NextApiResponse } from 'next'
import { brandManager, Brand } from '../../../../lib/data/brandDatabase'
import { 
  sendSuccess, 
  sendError, 
  sendValidationError, 
  sendNotFoundError,
  validateMethod,
  withErrorHandling,
  ApiResponse 
} from '../../../../lib/api-response'

/**
 * Division-specific Operations API
 * GET /api/brands/divisions/[divisionId] - Get brands by division ID
 * POST /api/brands/divisions/[divisionId] - Add new brand to division
 */
async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  if (!validateMethod(req, res, ['GET', 'POST'])) {
    return
  }

  const { divisionId } = req.query

  if (!divisionId || typeof divisionId !== 'string') {
    return sendValidationError(res, 'Division ID is required')
  }

  if (req.method === 'GET') {
    await handleGetBrandsByDivision(req, res, divisionId)
  } else if (req.method === 'POST') {
    await handleAddBrandToDivision(req, res, divisionId)
  }
}

/**
 * Get brands by division ID
 * GET /api/brands/divisions/[divisionId]
 */
async function handleGetBrandsByDivision(
  req: NextApiRequest, 
  res: NextApiResponse<ApiResponse>, 
  divisionId: string
) {
  try {
    const brands = brandManager.getBrandsByDivision(divisionId)
    
    if (brands.length === 0) {
      return sendNotFoundError(res, `Division '${divisionId}' not found`)
    }
    
    const responseData = {
      divisionId,
      brands,
      metadata: {
        brandCount: brands.length,
        categories: Array.from(new Set(brands.filter(b => b.category).map(b => b.category))),
        brandsWithAliases: brands.filter(b => b.aliases && b.aliases.length > 0).length
      }
    }
    
    sendSuccess(res, responseData)
  } catch (error: any) {
    sendError(res, 'Failed to fetch brands', 500, 'FETCH_BRANDS_ERROR', error.message)
  }
}

/**
 * Add new brand to existing division
 * POST /api/brands/divisions/[divisionId]
 */
async function handleAddBrandToDivision(
  req: NextApiRequest, 
  res: NextApiResponse<ApiResponse>, 
  divisionId: string
) {
  try {
    const { name, fullName, aliases, category } = req.body
    
    if (!name) {
      return sendValidationError(res, 'Brand name is required', {
        missingFields: ['name']
      })
    }
    
    const newBrand: Brand = {
      name: name.toUpperCase(),
      fullName,
      aliases: aliases ? aliases.map((alias: string) => alias.toUpperCase()) : undefined,
      category
    }
    
    const success = brandManager.addBrand(divisionId, newBrand)
    
    if (success) {
      sendSuccess(res, {
        message: 'Brand added successfully',
        divisionId,
        brand: newBrand
      }, 201)
    } else {
      sendNotFoundError(res, `Division '${divisionId}' not found`)
    }
  } catch (error: any) {
    sendError(res, 'Failed to add brand', 500, 'ADD_BRAND_ERROR', error.message)
  }
}

export default withErrorHandling(handler)