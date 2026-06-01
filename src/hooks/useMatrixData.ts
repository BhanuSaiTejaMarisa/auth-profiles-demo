import { useEffect, useState, useCallback } from 'react'
import { MatrixApiService, type MatrixRecord } from '../services/MatrixApiService'

export interface UseMatrixDataOptions {
  authProfileCodes: string[]
  page?: number
  pageSize?: number
}

export interface UseMatrixDataResult {
  records: MatrixRecord[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  isLoading: boolean
  error: string | null
  setPage: (page: number) => void
  refetch: () => void
}

/**
 * Hook to fetch matrix records with pagination and filtering.
 * Simulates async API behavior with simulated delay.
 */
export function useMatrixData({
  authProfileCodes,
  page = 1,
  pageSize = 100,
}: UseMatrixDataOptions): UseMatrixDataResult {
  const [records, setRecords] = useState<MatrixRecord[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(page)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(() => {
    setIsLoading(true)
    setError(null)

    // Simulate network delay (50-150ms) for realistic UX
    setTimeout(() => {
      try {
        const response = MatrixApiService.getRecords(authProfileCodes, currentPage, pageSize)
        setRecords(response.records)
        setTotal(response.total)
        setTotalPages(response.totalPages)
        setCurrentPage(response.page)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load matrix data')
      } finally {
        setIsLoading(false)
      }
    }, 50)
  }, [authProfileCodes, currentPage, pageSize])

  useEffect(() => {
    if (authProfileCodes.length === 0) {
      setRecords([])
      setTotal(0)
      setTotalPages(0)
      return
    }
    fetchData()
  }, [authProfileCodes, currentPage, pageSize, fetchData])

  const handleSetPage = useCallback((newPage: number) => {
    setCurrentPage(newPage)
  }, [])

  return {
    records,
    total,
    page: currentPage,
    pageSize,
    totalPages,
    isLoading,
    error,
    setPage: handleSetPage,
    refetch: fetchData,
  }
}
