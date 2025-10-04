import { NextApiRequest, NextApiResponse } from 'next'
import { brandManager } from '../../../lib/data/brandDatabase'
import { 
  sendSuccess, 
  sendError, 
  validateMethod,
  ApiResponse 
} from '../../../lib/api-response'
import { withComprehensiveMonitoring } from '../../../lib/monitoring'
import '../../../lib/init-monitoring' // Initialize monitoring

/**
 * Brand Statistics API
 * GET /api/brands/stats - Get comprehensive brand statistics
 */
async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  if (!validateMethod(req, res, ['GET'])) {
    return
  }

  await handleGetBrandStats(req, res)
}

/**
 * Get comprehensive brand statistics
 * GET /api/brands/stats
 */
async function handleGetBrandStats(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  try {
    const divisions = brandManager.getAllDivisions()
    
    // Calculate comprehensive statistics
    const totalBrands = divisions.reduce((sum, div) => sum + div.brands.length, 0)
    const brandsWithAliases = divisions.reduce((sum, div) => 
      sum + div.brands.filter(b => b.aliases && b.aliases.length > 0).length, 0
    )
    const totalAliases = divisions.reduce((sum, div) => 
      sum + div.brands.reduce((brandSum, brand) => 
        brandSum + (brand.aliases ? brand.aliases.length : 0), 0
      ), 0
    )
    
    // Get categories across all divisions
    const allCategories = new Set<string>()
    divisions.forEach(div => {
      div.brands.forEach(brand => {
        if (brand.category) {
          allCategories.add(brand.category)
        }
      })
    })
    
    // Calculate division breakdown with detailed metrics
    const divisionBreakdown = divisions.map(div => {
      const divisionBrandsWithAliases = div.brands.filter(b => b.aliases && b.aliases.length > 0).length
      const divisionTotalAliases = div.brands.reduce((sum, brand) => 
        sum + (brand.aliases ? brand.aliases.length : 0), 0
      )
      const divisionCategories = Array.from(new Set(div.brands.filter(b => b.category).map(b => b.category!)))
      
      return {
        id: div.id,
        name: div.name,
        description: div.description,
        brandCount: div.brands.length,
        brandsWithAliases: divisionBrandsWithAliases,
        totalAliases: divisionTotalAliases,
        categories: divisionCategories,
        categoryCount: divisionCategories.length,
        averageAliasesPerBrand: div.brands.length > 0 ? 
          Math.round((divisionTotalAliases / div.brands.length) * 100) / 100 : 0,
        brands: div.brands.map(b => ({
          name: b.name,
          fullName: b.fullName,
          category: b.category,
          aliasCount: b.aliases ? b.aliases.length : 0
        }))
      }
    })
    
    // Get top divisions by brand count
    const topDivisions = [...divisions]
      .sort((a, b) => b.brands.length - a.brands.length)
      .slice(0, 3)
      .map(div => ({
        id: div.id,
        name: div.name,
        brandCount: div.brands.length,
        percentage: Math.round((div.brands.length / totalBrands) * 100)
      }))
    
    // Get most common brand prefixes
    const brandPrefixes = new Map<string, number>()
    divisions.forEach(div => {
      div.brands.forEach(brand => {
        const prefix = brand.name.substring(0, 3)
        brandPrefixes.set(prefix, (brandPrefixes.get(prefix) || 0) + 1)
      })
    })
    
    const topPrefixes = Array.from(brandPrefixes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([prefix, count]) => ({ prefix, count }))
    
    const responseData = {
      overview: {
        totalDivisions: divisions.length,
        totalBrands,
        brandsWithAliases,
        totalAliases,
        averageAliasesPerBrand: totalBrands > 0 ? 
          Math.round((totalAliases / totalBrands) * 100) / 100 : 0,
        averageBrandsPerDivision: divisions.length > 0 ? 
          Math.round((totalBrands / divisions.length) * 100) / 100 : 0,
        totalCategories: allCategories.size,
        categories: Array.from(allCategories).sort()
      },
      divisionBreakdown,
      topDivisions,
      insights: {
        largestDivision: topDivisions[0] || null,
        mostAliasedBrands: getMostAliasedBrands(divisions),
        topPrefixes,
        categoryDistribution: getCategoryDistribution(divisions)
      }
    }
    
    sendSuccess(res, responseData)
  } catch (error: any) {
    sendError(res, 'Failed to get brand statistics', 500, 'GET_STATS_ERROR', error.message)
  }
}

/**
 * Get brands with the most aliases
 */
function getMostAliasedBrands(divisions: any[]): any[] {
  const brandsWithAliases: any[] = []
  
  divisions.forEach(div => {
    div.brands.forEach((brand: any) => {
      if (brand.aliases && brand.aliases.length > 0) {
        brandsWithAliases.push({
          name: brand.name,
          division: div.name,
          aliasCount: brand.aliases.length,
          aliases: brand.aliases
        })
      }
    })
  })
  
  return brandsWithAliases
    .sort((a, b) => b.aliasCount - a.aliasCount)
    .slice(0, 5)
}

/**
 * Get category distribution across all divisions
 */
function getCategoryDistribution(divisions: any[]): any[] {
  const categoryCount = new Map<string, { count: number; divisions: Set<string> }>()
  
  divisions.forEach(div => {
    div.brands.forEach((brand: any) => {
      if (brand.category) {
        if (!categoryCount.has(brand.category)) {
          categoryCount.set(brand.category, { count: 0, divisions: new Set() })
        }
        const categoryData = categoryCount.get(brand.category)!
        categoryData.count++
        categoryData.divisions.add(div.name)
      }
    })
  })
  
  return Array.from(categoryCount.entries())
    .map(([category, data]) => ({
      category,
      brandCount: data.count,
      divisionCount: data.divisions.size,
      divisions: Array.from(data.divisions)
    }))
    .sort((a, b) => b.brandCount - a.brandCount)
}

export default withComprehensiveMonitoring(handler, {
  operationType: 'api',
  enableMemoryMonitoring: false, // Simple data processing doesn't need memory monitoring
  enablePerformanceLogging: true,
  enableRateLimit: true,
  rateLimitOptions: {
    maxRequests: 60, // 60 requests per window
    windowMs: 15 * 60 * 1000 // 15 minutes
  }
})