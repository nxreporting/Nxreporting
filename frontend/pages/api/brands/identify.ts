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
 * Brand Identification API
 * POST /api/brands/identify - Find brand for a specific product name
 */
async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  if (!validateMethod(req, res, ['POST'])) {
    return
  }

  await handleIdentifyBrand(req, res)
}

/**
 * Find brand for a specific product name
 * POST /api/brands/identify
 */
async function handleIdentifyBrand(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  try {
    const { productName } = req.body
    
    if (!productName) {
      return sendValidationError(res, 'Product name is required', {
        example: { productName: 'ACKNOTIN-5' }
      })
    }

    if (typeof productName !== 'string') {
      return sendValidationError(res, 'Product name must be a string')
    }

    if (productName.trim().length === 0) {
      return sendValidationError(res, 'Product name cannot be empty')
    }
    
    const brandMatch = brandManager.findBrand(productName)
    
    if (brandMatch) {
      const responseData = {
        productName,
        matched: true,
        brand: brandMatch.brand,
        division: {
          id: brandMatch.division.id,
          name: brandMatch.division.name,
          description: brandMatch.division.description
        },
        matchDetails: {
          matchType: getMatchDetails(brandMatch.brand, productName),
          confidence: calculateConfidence(brandMatch.brand, productName)
        }
      }
      
      sendSuccess(res, responseData)
    } else {
      const responseData = {
        productName,
        matched: false,
        brand: null,
        division: null,
        suggestions: getSuggestions(productName)
      }
      
      sendSuccess(res, responseData)
    }
  } catch (error: any) {
    sendError(res, 'Failed to identify brand', 500, 'IDENTIFY_BRAND_ERROR', error.message)
  }
}

/**
 * Get match details for identified brand
 */
function getMatchDetails(brand: any, productName: string): string {
  const upperProduct = productName.toUpperCase().trim()
  const upperBrandName = brand.name.toUpperCase()
  
  if (upperBrandName === upperProduct) {
    return 'exact_brand_name'
  }
  
  if (brand.aliases?.some((alias: string) => alias.toUpperCase() === upperProduct)) {
    return 'exact_alias_match'
  }
  
  if (upperProduct.startsWith(upperBrandName)) {
    return 'brand_name_prefix'
  }
  
  if (brand.aliases?.some((alias: string) => upperProduct.startsWith(alias.toUpperCase()))) {
    return 'alias_prefix'
  }
  
  return 'partial_match'
}

/**
 * Calculate confidence score for brand match
 */
function calculateConfidence(brand: any, productName: string): number {
  const upperProduct = productName.toUpperCase().trim()
  const upperBrandName = brand.name.toUpperCase()
  
  // Exact matches get highest confidence
  if (upperBrandName === upperProduct) {
    return 1.0
  }
  
  if (brand.aliases?.some((alias: string) => alias.toUpperCase() === upperProduct)) {
    return 1.0
  }
  
  // Prefix matches get high confidence
  if (upperProduct.startsWith(upperBrandName)) {
    return 0.9
  }
  
  if (brand.aliases?.some((alias: string) => upperProduct.startsWith(alias.toUpperCase()))) {
    return 0.9
  }
  
  // Partial matches get lower confidence
  return 0.7
}

/**
 * Get brand suggestions for unmatched products
 */
function getSuggestions(productName: string): any[] {
  const searchResults = brandManager.searchBrands(productName)
  
  // Return top 3 most relevant suggestions
  return searchResults
    .slice(0, 3)
    .map(result => ({
      brand: result.brand.name,
      division: result.division.name,
      similarity: calculateSimilarity(result.brand.name, productName)
    }))
    .sort((a, b) => b.similarity - a.similarity)
}

/**
 * Calculate simple similarity score between two strings
 */
function calculateSimilarity(str1: string, str2: string): number {
  const upper1 = str1.toUpperCase()
  const upper2 = str2.toUpperCase()
  
  // Simple Levenshtein distance-based similarity
  const maxLength = Math.max(upper1.length, upper2.length)
  if (maxLength === 0) return 1.0
  
  const distance = levenshteinDistance(upper1, upper2)
  return (maxLength - distance) / maxLength
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = []
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  
  return matrix[str2.length][str1.length]
}

export default withErrorHandling(handler)