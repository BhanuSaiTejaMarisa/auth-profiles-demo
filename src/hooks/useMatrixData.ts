import { useEffect, useState, useCallback } from 'react'
import { MatrixApiService, type MatrixRecord } from '../services/MatrixApiService'

export interface UseMatrixDataOptions {
  authProfileCodes: string[]
  region?: string
  country?: string
  businessGroup?: string
  maxRows?: number
}

export interface UseMatrixDataResult {
  records: MatrixRecord[]
  total: number
  returned: number
  maxRows: number
  isCapped: boolean
  dataSource: 'json-server' | 'local-fallback'
  isLoading: boolean
  error: string | null
  refetch: () => void
}

/**
 * Hook to fetch matrix records with filter-first behavior and capped payload size.
 * Uses json-server if available and falls back to local generated data.
 */
export function useMatrixData({
  authProfileCodes,
  region,
  country,
  businessGroup,
  maxRows = 3000,
}: UseMatrixDataOptions): UseMatrixDataResult {
  const [records, setRecords] = useState<MatrixRecord[]>([])
  const [total, setTotal] = useState(0)
  const [returned, setReturned] = useState(0)
  const [isCapped, setIsCapped] = useState(false)
  const [dataSource, setDataSource] = useState<'json-server' | 'local-fallback'>('json-server')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const jsonServerBaseUrl =
      import.meta.env.VITE_MATRIX_API_BASE_URL?.trim() || 'http://localhost:4000'
    const params = new URLSearchParams()
    authProfileCodes.forEach((code) => params.append('profileCode', code))
    if (region) params.set('region', region)
    if (country) params.set('country', country)
    if (businessGroup) params.set('businessGroup', businessGroup)
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
      setIsCapped(Boolean(payload.isCapped))
      setDataSource('json-server')
    } catch {
      try {
        const fallback = MatrixApiService.search({
          authProfileCodes,
          region,
          country,
          businessGroup,
          page: 1,
          pageSize: maxRows,
        })
        setRecords(fallback.records)
        setTotal(fallback.total)
        setReturned(fallback.records.length)
        setIsCapped(fallback.total > maxRows)
        setDataSource('local-fallback')
        setError('json-server unavailable, using local fallback data.')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load matrix data')
        setDataSource('local-fallback')
        setRecords([])
        setTotal(0)
        setReturned(0)
        setIsCapped(false)
      }
    } finally {
      setIsLoading(false)
    }
  }, [authProfileCodes, region, country, businessGroup, maxRows])

  useEffect(() => {
    if (authProfileCodes.length === 0) {
      setRecords([])
      setTotal(0)
      setReturned(0)
      setIsCapped(false)
      setDataSource('json-server')
      return
    }

    fetchData()
  }, [authProfileCodes, fetchData])

  return {
    records,
    total,
    returned,
    maxRows,
    isCapped,
    dataSource,
    isLoading,
    error,
    refetch: fetchData,
  }
}
