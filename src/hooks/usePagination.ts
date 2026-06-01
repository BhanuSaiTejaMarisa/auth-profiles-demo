import { useMemo, useState, useEffect } from 'react'

interface UsePaginationProps<T> {
  items: T[]
  initialPageSize?: number
  resetDependencies?: unknown[]
}

export function usePagination<T>({
  items,
  initialPageSize = 10,
  resetDependencies = [],
}: UsePaginationProps<T>) {
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [currentPage, setCurrentPage] = useState(0)

  // Reset pagination when dependencies change (e.g., search/filter applied)
  useEffect(() => {
    setCurrentPage(0)
  }, resetDependencies)

  const paginatedItems = useMemo(() => {
    const start = currentPage * pageSize
    const end = start + pageSize
    return items.slice(start, end)
  }, [items, currentPage, pageSize])

  const totalPages = Math.ceil(items.length / pageSize)

  const goToPage = (page: number) => {
    const maxPage = Math.max(0, totalPages - 1)
    setCurrentPage(Math.max(0, Math.min(page, maxPage)))
  }

  const nextPage = () => goToPage(currentPage + 1)
  const previousPage = () => goToPage(currentPage - 1)

  return {
    paginatedItems,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    goToPage,
    nextPage,
    previousPage,
    totalPages,
    hasNextPage: currentPage < totalPages - 1,
    hasPreviousPage: currentPage > 0,
  }
}
