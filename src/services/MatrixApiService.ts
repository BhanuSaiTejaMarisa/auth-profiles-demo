/**
 * Mock API service for matrix data.
 * Generates realistic data on-demand for selected auth profile codes.
 * 103K+ rows available via pagination without bundling large JSON files.
 */

export type MatrixRecord = {
  id: string
  authProfileCode: string
  region: string
  subRegion: string
  country: string
  businessModel: string
  mcChargeCode: string
  businessGroup: string
  businessUnit: string
  productLine: string
  productFamily: string
  dealType: number
  maxApprovalPct: number
  minMarginApprovalPct: number
  authMarginFlag: string
  plSummaryAuthFlag: string
  maxLineUsdAmt: number
  creationDate: string
  updateDate: string
  lastChangeEmpNr: string
  effectiveDate: string
  effectiveEndDate: string
}

export type MatrixApiResponse = {
  records: MatrixRecord[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  profileCodes: string[]
}

export class MatrixApiService {
  private static readonly pageSize = 100
  private static readonly totalRecordCount = 103929

  // Auth profile codes from the CSV dataset
  private static readonly profileCodes = [
    'AP IPG MDM IJ - Rgn3',
    'AM ESSN SALES DEV',
    'WW- Specific BU Test',
    'Change_AutoTest',
    'AP PPSBidDesk - Rgn5',
    'EU-ALL-BDM-0',
    'Read Only',
    'Audit Approver',
    'BDM - Authorization Profile Approver',
    'FSR super user',
    'APJ_ITG_allBUallCtry',
    'Deal Creator Intermediate FSR Role',
    'Deal Creator - Standard FSR Role',
    'NA BDM Role',
    'Deal Creator - Advanced FSR Role',
    'LA - BDM PSM Role',
  ]

  private static readonly regions = ['AP', 'LA', 'NA', 'EU']
  private static readonly subRegions = ['08S2', '10S2', '11S2', '21S2', 'BRS2', 'BLTC', 'CAS2', 'CZS2', 'ILS2', 'INS2', 'WW']
  private static readonly countries = ['HK', 'TW', 'TH', 'TL', 'BD', 'BN', 'VN', 'AU', 'NZ', 'VU', 'ID', 'KH', 'LA', 'LK', 'MV', 'CN', 'US', 'MX', 'BR', 'EE', 'IL', 'CZ', 'IN', 'MO']
  private static readonly businessGroups = ['OTR', 'IPG', 'PSG', 'PPS', 'TSG']
  private static readonly businessUnits = ['50', '54', '71', '124', '250', '302', '400']
  private static readonly productLines = ['27', 'K9', 'DL', 'C2', '83', 'T5', 'KN', 'TT', '5I', 'JM', '2N']

  /**
   * Generate a seeded pseudo-random number from an index
   */
  private static seededRandom(seed: number): number {
    const x = Math.sin(seed) * 10000
    return x - Math.floor(x)
  }

  /**
   * Generate mock matrix record for an index
   */
  private static generateRecord(recordIndex: number): MatrixRecord {
    const seed = recordIndex
    const rand = (offset = 0) => this.seededRandom(seed + offset)

    const profileCodeIndex = Math.floor(rand(1) * this.profileCodes.length)
    const regionIndex = Math.floor(rand(2) * this.regions.length)
    const subRegionIndex = Math.floor(rand(3) * this.subRegions.length)
    const countryIndex = Math.floor(rand(4) * this.countries.length)
    const businessGroupIndex = Math.floor(rand(5) * this.businessGroups.length)
    const businessUnitIndex = Math.floor(rand(6) * this.businessUnits.length)
    const productLineIndex = Math.floor(rand(7) * this.productLines.length)

    return {
      id: `matrix-${recordIndex + 1}`,
      authProfileCode: this.profileCodes[profileCodeIndex],
      region: this.regions[regionIndex],
      subRegion: this.subRegions[subRegionIndex],
      country: this.countries[countryIndex],
      businessModel: '*',
      mcChargeCode: '*',
      businessGroup: this.businessGroups[businessGroupIndex],
      businessUnit: this.businessUnits[businessUnitIndex],
      productLine: this.productLines[productLineIndex],
      productFamily: rand(8) > 0.5 ? 'DU' : '5M',
      dealType: Math.floor(rand(9) * 3) + 1,
      maxApprovalPct: Math.floor(rand(10) * 100),
      minMarginApprovalPct: Math.floor(rand(11) * 10),
      authMarginFlag: rand(12) > 0.5 ? 'Y' : 'N',
      plSummaryAuthFlag: rand(13) > 0.5 ? 'Y' : 'N',
      maxLineUsdAmt: Math.floor(rand(14) * 1000000),
      creationDate: '29-Nov-11',
      updateDate: '19-Feb-14',
      lastChangeEmpNr: String(393475 + Math.floor(rand(15) * 1000)),
      effectiveDate: '29-Nov-11',
      effectiveEndDate: '31-Dec-99',
    }
  }

  /**
   * Get matrix records filtered by auth profile codes with pagination
   */
  static getRecords(
    authProfileCodes: string[],
    page: number = 1,
    customPageSize?: number,
  ): MatrixApiResponse {
    const pageSize = customPageSize || this.pageSize

    // Generate all records that match profile codes (103K total possible)
    const filtered: MatrixRecord[] = []
    for (let i = 0; i < this.totalRecordCount; i++) {
      const record = this.generateRecord(i)
      if (authProfileCodes.includes(record.authProfileCode)) {
        filtered.push(record)
      }
    }

    // Paginate
    const total = filtered.length
    const totalPages = Math.ceil(total / pageSize)
    const safePage = Math.max(1, Math.min(page, totalPages || 1))
    const startIdx = (safePage - 1) * pageSize
    const endIdx = startIdx + pageSize
    const records = filtered.slice(startIdx, endIdx)

    return {
      records,
      total,
      page: safePage,
      pageSize,
      totalPages,
      profileCodes: authProfileCodes,
    }
  }

  /**
   * Get all unique auth profile codes
   */
  static getAllProfileCodes(): string[] {
    return [...this.profileCodes]
  }

  /**
   * Get total record count
   */
  static getTotalCount(): number {
    return this.totalRecordCount
  }

  /**
   * Search/filter with multiple criteria (for advanced filtering)
   */
  static search(criteria: {
    authProfileCodes?: string[]
    region?: string
    subRegion?: string
    country?: string
    businessGroup?: string
    businessUnit?: string
    page?: number
    pageSize?: number
  }): MatrixApiResponse {
    const allRecords: MatrixRecord[] = []
    const hasProfileCodeFilter = Boolean(criteria.authProfileCodes?.length)

    for (let i = 0; i < this.totalRecordCount; i++) {
      const record = this.generateRecord(i)

      // Apply filters
      if (hasProfileCodeFilter && !criteria.authProfileCodes!.includes(record.authProfileCode)) continue
      if (criteria.region && record.region !== criteria.region) continue
      if (criteria.subRegion && record.subRegion !== criteria.subRegion) continue
      if (criteria.country && record.country !== criteria.country) continue
      if (criteria.businessGroup && record.businessGroup !== criteria.businessGroup) continue
      if (criteria.businessUnit && record.businessUnit !== criteria.businessUnit) continue

      allRecords.push(record)
    }

    const pageSize = criteria.pageSize || this.pageSize
    const page = criteria.page || 1
    const total = allRecords.length
    const totalPages = Math.ceil(total / pageSize)
    const safePage = Math.max(1, Math.min(page, totalPages || 1))
    const startIdx = (safePage - 1) * pageSize
    const endIdx = startIdx + pageSize
    const records = allRecords.slice(startIdx, endIdx)

    return {
      records,
      total,
      page: safePage,
      pageSize,
      totalPages,
      profileCodes: criteria.authProfileCodes || [],
    }
  }
}

export default MatrixApiService
