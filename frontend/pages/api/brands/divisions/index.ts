import { NextApiRequest, NextApiResponse } from 'next'
import { brandManager, Brand, Division } from '../../../../lib/data/brandDatabase'
import { 
  sendSuccess, 
  sendError, 
  sendValidationError, 
  validateMethod,
  withErrorHandling,
  ApiResponse 
} from '../../../../lib/api-response'

/**
 * Division Management API
 * GET /api/brands/divisions - Get all divisions with their brands
 * POST /api/brands/divisions - Add new division
 */
async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  if (!validateMethod(req, res, ['GET', 'POST'])) {
    return
  }

  if (req.method === 'GET') {
    await handleGetAllDivisions(req, res)
  } else if (req.method === 'POST') {
    await handleAddDivision(req, res)
  }
}

/**
 * Get all divisions with their brands
 * GET /api/brands/divisions
 */
async function handleGetAllDivisions(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  try {
    const divisions = brandManager.getAllDivisions()
    
    const responseData = {
      divisions,
      summary: {
        totalDivisions: divisions.length,
        totalBrands: divisions.reduce((sum, div) => sum + div.brands.length, 0),
        divisionBreakdown: divisions.map(div => ({
          id: div.id,
          name: div.name,
          brandCount: div.brands.length
        }))
      }
    }
    
    sendSuccess(res, responseData)
  } catch (error: any) {
    sendError(res, 'Failed to fetch divisions', 500, 'FETCH_DIVISIONS_ERROR', error.message)
  }
}

/**
 * Add new division
 * POST /api/brands/divisions
 */
async function handleAddDivision(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  try {
    const { id, name, description, brands } = req.body
    
    if (!id || !name) {
      return sendValidationError(res, 'Division ID and name are required', {
        missingFields: ['id', 'name'].filter(field => !req.body[field])
      })
    }
    
    const newDivision: Division = {
      id: id.toLowerCase().replace(/\s+/g, '-'),
      name,
      description,
      brands: brands || []
    }
    
    const success = brandManager.addDivision(newDivision)
    
    if (success) {
      sendSuccess(res, {
        message: 'Division added successfully',
        division: newDivision
      }, 201)
    } else {
      sendError(res, `Division with ID '${newDivision.id}' already exists`, 409, 'DIVISION_EXISTS')
    }
  } catch (error: any) {
    sendError(res, 'Failed to add division', 500, 'ADD_DIVISION_ERROR', error.message)
  }
}

export default withErrorHandling(handler)