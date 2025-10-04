/**
 * Comprehensive Brand Database for CNX Pharmaceutical Company
 * Contains all divisions and their respective brands
 */

export interface Brand {
  name: string;
  fullName?: string;
  aliases?: string[];
  category?: string;
}

export interface Division {
  id: string;
  name: string;
  description?: string;
  brands: Brand[];
}

export const CNX_BRAND_DATABASE: Division[] = [
  {
    id: 'cnx-main',
    name: 'CNX Main',
    description: 'Main pharmaceutical division with core therapeutic products',
    brands: [
      { name: 'ACKNOTIN', aliases: ['ACKNOTIN-3', 'ACKNOTIN-5', 'ACKNOTIN-10'] },
      { name: 'ATREEP', aliases: ['ATREEP 10', 'ATREEP 25', 'ATREEP 75', 'ATREEP PLUS 5', 'ATREEP PLUS 10'] },
      { name: 'AXTVAN', aliases: ['AXTVAN-1', 'AXTVAN-2'] },
      { name: 'BECOCNX', aliases: ['BECOCNX D3', 'BECOCNX OD', 'BECOCNX SL'] },
      { name: 'BETAGOLD', aliases: ['BETAGOLD 8', 'BETAGOLD 16', 'BETAGOLD 24', 'BETAGOLD OD 24', 'BETAGOLD OD 48'] },
      { name: 'BETEALA', aliases: ['BETEALA 20MG', 'BETEALA 40MG', 'BETEALA 60MG'] },
      { name: 'BINAPREX', aliases: ['BINAPREX ER-250', 'BINAPREX ER-500', 'BINAPREX ER-750', 'BINAPREX ER-1000'] },
      { name: 'CENTIQ', aliases: ['CENTIQ-P'] },
      { name: 'CLOSINE', aliases: ['CLOSINE-OZ'] },
      { name: 'CNDOL', aliases: ['CNDOL 650'] },
      { name: 'CNLEV', aliases: ['CNLEV 250', 'CNLEV 500', 'CNLEV 750', 'CNLEV 1000'] },
      { name: 'CNPINEX', aliases: ['CNPINEX 1.25', 'CNPINEX-2.5MG', 'CNPINEX-5MG', 'CNPINEX-7.5MG', 'CNPINEX-10MG'] },
      { name: 'CNPROT' },
      { name: 'CNPX', aliases: ['CNPX100', 'CNPX200'] },
      { name: 'CNX', aliases: ['CNX CLAV 625', 'CNX-DOX'] },
      { name: 'DOFOTIL', aliases: ['DOFOTIL SYRUP'] },
      { name: 'DTING', aliases: ['DTING 20'] },
      { name: 'ELM', aliases: ['ELM-0.25', 'ELM-0.5', 'ELM-CR 1.5', 'ELM PLUS 5', 'ELM PLUS 10', 'ELM PRO 20'] },
      { name: 'EPNOX', aliases: ['EPNOX 150', 'EPNOX 300', 'EPNOX 450', 'EPNOX OD 150', 'EPNOX OD 300', 'EPNOX OD 450'] },
      { name: 'ESCNX', aliases: ['ESCNX 5', 'ESCNX 10', 'ESCNX 15', 'ESCNX 20', 'ESCNX LS 5', 'ESCNX LS 10', 'ESCNX PLUS 5', 'ESCNX PLUS 10'] },
      { name: 'F-RACIL', aliases: ['F-RACIL 5', 'F-RACIL 10', 'F-RACIL PLUS 5', 'F-RACIL PLUS 10'] },
      { name: 'FI-CNX', aliases: ['FI-CNX 30GM', 'FI-CNX 50GM'] },
      { name: 'GABACNX', aliases: ['GABACNX 100', 'GABACNX 300', 'GABACNX NT 100', 'GABACNX NT 400'] },
      { name: 'HBGOLD', aliases: ['HB GOLD LI'] },
      { name: 'SANI', aliases: ['SANI 5MG'] },
      { name: 'LISANI', aliases: ['LISANI M'] },
      { name: 'LURACISE', aliases: ['LURACISE-120', 'LURACISE-180', 'LURACISE-M'] },
      { name: 'MEMANSYS', aliases: ['MEMANSYS-5', 'MEMANSYS-10', 'MEMANSYS-D-5', 'MEMANSYS-D-10'] },
      { name: 'MOMPRESS', aliases: ['MOMPRESS 7.5', 'MOMPRESS 15', 'MOMPRESS 30'] },
      { name: 'NAL', aliases: ['NAL-50'] },
      { name: 'OCDOX', aliases: ['OCDOX 25', 'OCDOX 50', 'OCDOX 100', 'OCDOX CR 100', 'OCDOX CR 150'] },
      { name: 'OXNZ', aliases: ['OXNZ TABLETS'] },
      { name: 'PRERABE', aliases: ['PRERABE 20', 'PRERABE D'] },
      { name: 'PRTXOL', aliases: ['PRTXOL-0.125', 'PRTXOL-0.25', 'PRTXOL-0.50', 'PRTXOL SR-0.26', 'PRTXOL SR-0.52', 'PRTXOL SR-1.05'] },
      { name: 'PRUMPIN', aliases: ['PRUMPIN 10', 'PRUMPIN 25', 'PRUMPIN 50', 'PRUMPIN SR 75'] },
      { name: 'TOPCNX', aliases: ['TOPCNX 25', 'TOPCNX 50', 'TOPCNX 100'] },
      { name: 'VALCNX', aliases: ['VALCNX 200', 'VALCNX 300', 'VALCNX 500'] },
      { name: 'VOXVO', aliases: ['VOXVO-5', 'VOXVO-10', 'VOXVO-15', 'VOXVO-20'] },
      { name: 'XANTRON', aliases: ['XANTRON 500'] }
    ]
  },
  {
    id: 'cnx-ortho',
    name: 'CNX Ortho',
    description: 'Orthopedic and bone health division',
    brands: [
      { name: 'BECOCNX', aliases: ['BECOCNX 60K', 'BECOCNX-PM'] },
      { name: 'BENCNX', aliases: ['BENCNX-OD'] },
      { name: 'CNCAL' },
      { name: 'CNPRAZ', aliases: ['CNPRAZ-40', 'CNPRAZ D'] },
      { name: 'CNX-CAL' },
      { name: 'GDMIN', aliases: ['GDMIN-D', 'GDMIN-TBR'] },
      { name: 'GEMIPRESS' },
      { name: 'HBGOLD', aliases: ['HBGOLD GEL', 'HB GOLD MR', 'HB GOLD-P', 'HBGOLD SP'] },
      { name: 'NOLOPAIN', aliases: ['NOLOPAIN 60', 'NOLOPAIN 90', 'NOLOPAIN MR', 'NOLOPAIN P'] },
      { name: 'PRIXICAM', aliases: ['PRIXICAM-CV'] },
      { name: 'RABDIT', aliases: ['RABDIT-20', 'RABDIT-D'] },
      { name: 'STIFFLESS' }
    ]
  },
  {
    id: 'cnx-prime',
    name: 'CNX Prime',
    description: 'Premium therapeutic products division',
    brands: [
      { name: 'AXEPINE', aliases: ['AXEPINE MD-2', 'AXEPINE MD-5', 'AXEPINE MD-10', 'AXEPINE MD-15', 'AXEPINE MD-20'] },
      { name: 'BECOCNX', aliases: ['BECOCNX-LITE'] },
      { name: 'BYCINE', aliases: ['BYCINE CD3'] },
      { name: 'CETAPRIME' },
      { name: 'CNCALM', aliases: ['CNCALM PLUS'] },
      { name: 'CNPAXET', aliases: ['CNPAXET-12.5', 'CNPAXET-25', 'CNPAXET-37.5', 'CNPAXET PLUS 12.5', 'CNPAXET PLUS 25'] },
      { name: 'CNSERT', aliases: ['CNSERT-25', 'CNSERT-50', 'CNSERT-100'] },
      { name: 'HBGOLD', aliases: ['HBGOLD SPA'] },
      { name: 'KYU', aliases: ['KYU-25', 'KYU-50', 'KYU-100', 'KYU-200', 'KYU-SR 100', 'KYU-SR 200'] },
      { name: 'NXHEAD', aliases: ['NXHEAD 250', 'NXHEAD 500'] },
      { name: 'PLATANOX', aliases: ['PLATANOX-40', 'PLATANOX-D'] },
      { name: 'PRESTILLER', aliases: ['PRESTILLER 75', 'PRESTILLER D', 'PRESTILLER MNT', 'PRESTILLER NT 50', 'PRESTILLER NT 75'] },
      { name: 'PRETIMOL' },
      { name: 'RPDONE', aliases: ['RPDONE-0.5', 'RPDONE-1', 'RPDONE-2', 'RPDONE-LS', 'RPDONE-PLUS', 'RPDONE-FORTE'] },
      { name: 'TOMKID', aliases: ['TOMKID-10', 'TOMKID-18', 'TOMKID-25', 'TOMKID-40'] }
    ]
  },
  {
    id: 'cnx-plus',
    name: 'CNX Plus',
    description: 'Enhanced formulation products division',
    brands: [
      { name: 'BILURACISE', aliases: ['BILURACISE 20', 'BILURACISE-M'] },
      { name: 'BUPIPRECE', aliases: ['BUPIPRECE SR 150'] },
      { name: 'BYCINE', aliases: ['BYCINE-OD'] },
      { name: 'CENAM', aliases: ['CENAM 100', 'CENAM 200'] },
      { name: 'CENRUS', aliases: ['CENRUS-D'] },
      { name: 'CNZEP', aliases: ['CNZEP-0.25', 'CNZEP-0.5', 'CNZEP-1'] },
      { name: 'D-LURACISE' },
      { name: 'DTXT', aliases: ['DTXT-25', 'DTXT-50', 'DTXT-100'] },
      { name: 'EGUL', aliases: ['EGUL SYRUP'] },
      { name: 'HBGOLD', aliases: ['HBGOLD ULTRA'] },
      { name: 'JOYSTIFF', aliases: ['JOYSTIFF 50', 'JOYSTIFF 100', 'JOYSTIFF 200', 'JOYSTIFF 300', 'JOYSTIFF 400'] },
      { name: 'MEGRACYN' },
      { name: 'PRERABE', aliases: ['PRERABE-L'] },
      { name: 'PREXIME', aliases: ['PREXIME CV', 'PREXIME DT-200'] },
      { name: 'RABC', aliases: ['RABC-20', 'RABC-D'] }
    ]
  },
  {
    id: 'cnx-derma',
    name: 'CNX Derma',
    description: 'Dermatology and skin care division',
    brands: [
      { name: 'CNPX', aliases: ['CNPX SB 65', 'CNPX SB 130'] },
      { name: 'CNSPOR' },
      { name: 'CNXMIN', aliases: ['CNXMIN-2.5', 'CNXMIN SOLN. 5%'] },
      { name: 'CNX', aliases: ['CNX MOIST. CREAM', 'CNX MOIST. SOAP', 'CNX SUNCREEN'] },
      { name: 'ITRNOIN', aliases: ['ITRNOIN 10', 'ITRNOIN 20'] },
      { name: 'KETALLO', aliases: ['KETALLO CREAM'] },
      { name: 'REVIQUE', aliases: ['REVIQUE SHAMPOO'] },
      { name: 'SERUPTIN', aliases: ['SERUPTIN TAB'] }
    ]
  },
  {
    id: 'cnx-gynec',
    name: 'CNX Gynec',
    description: 'Gynecology and women\'s health division',
    brands: [
      { name: 'CNX', aliases: ['CNX PROTEIN POWDER'] },
      { name: 'DYPRES' },
      { name: 'PRESNA', aliases: ['PRESNA 10', 'PRESNA SR 200', 'PRESNA SR 300'] },
      { name: 'SUREPAM', aliases: ['SUREPAM TAB'] },
      { name: 'VINOREL', aliases: ['VINOREL-XT'] }
    ]
  }
];

/**
 * Brand Management Service
 */
export class BrandManager {
  private static instance: BrandManager;
  private brandDatabase: Division[] = [...CNX_BRAND_DATABASE];

  private constructor() {}

  static getInstance(): BrandManager {
    if (!BrandManager.instance) {
      BrandManager.instance = new BrandManager();
    }
    return BrandManager.instance;
  }

  /**
   * Find brand by name or alias
   */
  findBrand(productName: string): { brand: Brand; division: Division } | null {
    const cleanName = productName.toUpperCase().trim();
    
    for (const division of this.brandDatabase) {
      for (const brand of division.brands) {
        // Check exact brand name match
        if (brand.name.toUpperCase() === cleanName) {
          return { brand, division };
        }
        
        // Check if product name starts with brand name
        if (cleanName.startsWith(brand.name.toUpperCase())) {
          return { brand, division };
        }
        
        // Check aliases
        if (brand.aliases) {
          for (const alias of brand.aliases) {
            if (alias.toUpperCase() === cleanName || cleanName.startsWith(alias.toUpperCase())) {
              return { brand, division };
            }
          }
        }
      }
    }
    
    return null;
  }

  /**
   * Add new brand to division
   */
  addBrand(divisionId: string, brand: Brand): boolean {
    const division = this.brandDatabase.find(d => d.id === divisionId);
    if (division) {
      division.brands.push(brand);
      return true;
    }
    return false;
  }

  /**
   * Add new division
   */
  addDivision(division: Division): boolean {
    const exists = this.brandDatabase.find(d => d.id === division.id);
    if (!exists) {
      this.brandDatabase.push(division);
      return true;
    }
    return false;
  }

  /**
   * Get all divisions
   */
  getAllDivisions(): Division[] {
    return [...this.brandDatabase];
  }

  /**
   * Get brands by division
   */
  getBrandsByDivision(divisionId: string): Brand[] {
    const division = this.brandDatabase.find(d => d.id === divisionId);
    return division ? [...division.brands] : [];
  }

  /**
   * Search brands across all divisions
   */
  searchBrands(query: string): { brand: Brand; division: Division }[] {
    const results: { brand: Brand; division: Division }[] = [];
    const searchTerm = query.toUpperCase().trim();
    
    for (const division of this.brandDatabase) {
      for (const brand of division.brands) {
        if (brand.name.toUpperCase().includes(searchTerm) ||
            brand.aliases?.some(alias => alias.toUpperCase().includes(searchTerm))) {
          results.push({ brand, division });
        }
      }
    }
    
    return results;
  }
}

// Export singleton instance
export const brandManager = BrandManager.getInstance();