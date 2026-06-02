import { useEffect, useState, useCallback } from 'react'
import { MatrixApiService, type MatrixRecord } from '../services/MatrixApiService'

export interface UseMatrixDataOptions {
  authProfileCodes: string[]
  region?: string
  subRegion?: string
  country?: string
  businessGroup?: string
  businessUnit?: string
  page?: number
  pageSize?: number
  maxRows?: number
}

export interface UseMatrixDataResult {
  records: MatrixRecord[]
  total: number
  returned: number
  page: number
  pageSize: number
  totalPages: number
  isCapped: boolean
  maxRows: number
  mode: 'profile-codes' | 'broad'
  dataSource: 'json-server' | 'local-fallback'
  isLoading: boolean
  error: string | null
  appliedFilters: {
    profileCodes: string[]
    region: string | null
    subRegion: string | null
    country: string | null
    businessGroup: string | null
    businessUnit: string | null
  }
  refetch: () => void
}

/**
 * Hook to fetch matrix records with filter-first behavior and capped payload size.
 * Uses json-server if available and falls back to local generated data.
 */
export function useMatrixData({
  authProfileCodes,
  region,
  subRegion,
  country,
  businessGroup,
  businessUnit,
  page = 1,
  pageSize = 200,
  maxRows = 3000,
}: UseMatrixDataOptions): UseMatrixDataResult {
  const [records, setRecords] = useState<MatrixRecord[]>([])
  const [total, setTotal] = useState(0)
  const [returned, setReturned] = useState(0)
  const [currentPage, setCurrentPage] = useState(page)
  const [totalPages, setTotalPages] = useState(1)
  const [isCapped, setIsCapped] = useState(false)
  const [mode, setMode] = useState<'profile-codes' | 'broad'>('profile-codes')
  const [dataSource, setDataSource] = useState<'json-server' | 'local-fallback'>('json-server')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [appliedFilters, setAppliedFilters] = useState({
    profileCodes: [] as string[],
    region: null as string | null,
    subRegion: null as string | null,
    country: null as string | null,
    businessGroup: null as string | null,
    businessUnit: null as string | null,
  })

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const jsonServerBaseUrl =
      import.meta.env.VITE_MATRIX_API_BASE_URL?.trim() || 'http://localhost:4000'
    const params = new URLSearchParams()
    authProfileCodes.forEach((code) => params.append('profileCode', code))
    if (region) params.set('region', region)
    if (subRegion) params.set('subRegion', subRegion)
    if (country) params.set('country', country)
    if (businessGroup) params.set('businessGroup', businessGroup)
    if (businessUnit) params.set('businessUnit', businessUnit)
    params.set('page', String(currentPage))
    params.set('pageSize', String(pageSize))
    params.set('maxRows', String(maxRows))

    try {
      const response = await fetch(`${jsonServerBaseUrl}/matrix?${params.toString()}`)
      if (!response.ok) {
        throw new Error(`json-server request failed (${response.status})`)
      }

      const payload = await response.json()
      setRecords(Array.isArray(payload.records) ? payload.records : [])
      setTotal(Number(payload.total) || 0)
      setReturned(Number(payload.returned) || 0)
      setCurrentPage(Number(payload.page) || 1)
      setTotalPages(Number(payload.totalPages) || 1)
      setIsCapped(Boolean(payload.isCapped))
      setMode(payload.mode === 'broad' ? 'broad' : 'profile-codes')
      setAppliedFilters({
        profileCodes: Array.isArray(payload?.appliedFilters?.profileCodes)
          ? payload.appliedFilters.profileCodes
          : [],
        region: payload?.appliedFilters?.region ?? null,
        subRegion: payload?.appliedFilters?.subRegion ?? null,
        country: payload?.appliedFilters?.country ?? null,
        businessGroup: payload?.appliedFilters?.businessGroup ?? null,
        businessUnit: payload?.appliedFilters?.businessUnit ?? null,
      })
      setDataSource('json-server')
    } catch {
      try {
        const fallback = MatrixApiService.search({
          authProfileCodes: authProfileCodes.length ? authProfileCodes : undefined,
          region,
          subRegion,
          country,
          businessGroup,
          businessUnit,
          page: currentPage,
          pageSize,
        })
        setRecords(fallback.records)
        setTotal(fallback.total)
        setReturned(fallback.records.length)
        setCurrentPage(fallback.page)
        setTotalPages(fallback.totalPages)
        setIsCapped(fallback.total > maxRows)
        setMode(authProfileCodes.length ? 'profile-codes' : 'broad')
        setAppliedFilters({
          profileCodes: authProfileCodes,
          region: region ?? null,
          subRegion: subRegion ?? null,
          country: country ?? null,
          businessGroup: businessGroup ?? null,
          businessUnit: businessUnit ?? null,
        })
        setDataSource('local-fallback')
        setError('json-server unavailable, using local fallback data.')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load matrix data')
        setDataSource('local-fallback')
        setRecords([])
        setTotal(0)
        setReturned(0)
        setCurrentPage(1)
        setTotalPages(1)
        setIsCapped(false)
      }
    } finally {
      setIsLoading(false)
    }
  }, [authProfileCodes, region, subRegion, country, businessGroup, businessUnit, currentPage, pageSize, maxRows])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    setCurrentPage(1)
  }, [authProfileCodes, region, subRegion, country, businessGroup, businessUnit])

  return {
    records,
    total,
    returned,
    page: currentPage,
    pageSize,
    totalPages,
    isCapped,
    maxRows,
    mode,
    dataSource,
    isLoading,
    error,
    appliedFilters,
    refetch: fetchData,
  }
}
