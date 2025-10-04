import { Request, Response } from 'express';
import { brandManager, Brand, Division } from '../data/brandDatabase';

/**
 * Get all divisions with their brands
 * GET /api/brands/divisions
 */
export const getAllDivisions = (req: Request, res: Response) => {
  try {
    const divisions = brandManager.getAllDivisions();
    
    return res.json({
      success: true,
      data: divisions,
      metadata: {
        totalDivisions: divisions.length,
        totalBrands: divisions.reduce((sum, div) => sum + div.brands.length, 0),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch divisions',
      details: error.message
    });
  }
};

/**
 * Get brands by division ID
 * GET /api/brands/divisions/:divisionId
 */
export const getBrandsByDivision = (req: Request, res: Response) => {
  try {
    const { divisionId } = req.params;
    const brands = brandManager.getBrandsByDivision(divisionId);
    
    if (brands.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Division '${divisionId}' not found`
      });
    }
    
    return res.json({
      success: true,
      data: brands,
      metadata: {
        divisionId,
        brandCount: brands.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch brands',
      details: error.message
    });
  }
};

/**
 * Search brands across all divisions
 * GET /api/brands/search?q=searchterm
 */
export const searchBrands = (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Search query parameter "q" is required'
      });
    }
    
    const results = brandManager.searchBrands(q);
    
    return res.json({
      success: true,
      data: results,
      metadata: {
        query: q,
        resultCount: results.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'Failed to search brands',
      details: error.message
    });
  }
};

/**
 * Find brand for a specific product name
 * POST /api/brands/identify
 */
export const identifyBrand = (req: Request, res: Response) => {
  try {
    const { productName } = req.body;
    
    if (!productName) {
      return res.status(400).json({
        success: false,
        error: 'Product name is required'
      });
    }
    
    const brandMatch = brandManager.findBrand(productName);
    
    if (brandMatch) {
      return res.json({
        success: true,
        data: {
          productName,
          brand: brandMatch.brand,
          division: brandMatch.division,
          matched: true
        }
      });
    } else {
      return res.json({
        success: true,
        data: {
          productName,
          brand: null,
          division: null,
          matched: false
        }
      });
    }
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'Failed to identify brand',
      details: error.message
    });
  }
};

/**
 * Add new brand to existing division
 * POST /api/brands/divisions/:divisionId/brands
 */
export const addBrandToDivision = (req: Request, res: Response) => {
  try {
    const { divisionId } = req.params;
    const { name, fullName, aliases, category } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Brand name is required'
      });
    }
    
    const newBrand: Brand = {
      name: name.toUpperCase(),
      fullName,
      aliases: aliases ? aliases.map((alias: string) => alias.toUpperCase()) : undefined,
      category
    };
    
    const success = brandManager.addBrand(divisionId, newBrand);
    
    if (success) {
      return res.status(201).json({
        success: true,
        message: 'Brand added successfully',
        data: {
          divisionId,
          brand: newBrand
        }
      });
    } else {
      return res.status(404).json({
        success: false,
        error: `Division '${divisionId}' not found`
      });
    }
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'Failed to add brand',
      details: error.message
    });
  }
};

/**
 * Add new division
 * POST /api/brands/divisions
 */
export const addDivision = (req: Request, res: Response) => {
  try {
    const { id, name, description, brands } = req.body;
    
    if (!id || !name) {
      return res.status(400).json({
        success: false,
        error: 'Division ID and name are required'
      });
    }
    
    const newDivision: Division = {
      id: id.toLowerCase().replace(/\s+/g, '-'),
      name,
      description,
      brands: brands || []
    };
    
    const success = brandManager.addDivision(newDivision);
    
    if (success) {
      return res.status(201).json({
        success: true,
        message: 'Division added successfully',
        data: newDivision
      });
    } else {
      return res.status(409).json({
        success: false,
        error: `Division with ID '${newDivision.id}' already exists`
      });
    }
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'Failed to add division',
      details: error.message
    });
  }
};

/**
 * Get brand statistics
 * GET /api/brands/stats
 */
export const getBrandStats = (req: Request, res: Response) => {
  try {
    const divisions = brandManager.getAllDivisions();
    
    const stats = {
      totalDivisions: divisions.length,
      totalBrands: divisions.reduce((sum, div) => sum + div.brands.length, 0),
      divisionBreakdown: divisions.map(div => ({
        id: div.id,
        name: div.name,
        brandCount: div.brands.length,
        brands: div.brands.map(b => b.name)
      })),
      topDivisions: divisions
        .sort((a, b) => b.brands.length - a.brands.length)
        .slice(0, 3)
        .map(div => ({
          name: div.name,
          brandCount: div.brands.length
        }))
    };
    
    return res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get brand statistics',
      details: error.message
    });
  }
};