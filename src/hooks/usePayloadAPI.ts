'use client'

import { useState, useEffect } from 'react'

interface PayloadAPIOptions {
  limit?: number
  page?: number
  sort?: string
  where?: Record<string, any>
  depth?: number
}

interface PayloadAPIResponse<T> {
  docs: T[]
  totalDocs: number
  limit: number
  totalPages: number
  page: number
  pagingCounter: number
  hasPrevPage: boolean
  hasNextPage: boolean
  prevPage: number | null
  nextPage: number | null
}

/**
 * Hook for fetching data from Payload CMS API
 *
 * @param endpoint The API endpoint to fetch from (collection or global)
 * @param options Query options including limit, page, sort, where, depth
 * @returns Object containing data, loading state, error state, and refetch function
 */
export function usePayloadAPI<T = any>(
  endpoint: string,
  options: PayloadAPIOptions = {}
) {
  const [data, setData] = useState<PayloadAPIResponse<T> | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isError, setIsError] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = async () => {
    setIsLoading(true)
    setIsError(false)
    setError(null)

    try {
      // Build query string from options
      const queryParams = new URLSearchParams()

      if (options.limit) queryParams.append('limit', options.limit.toString())
      if (options.page) queryParams.append('page', options.page.toString())
      if (options.sort) queryParams.append('sort', options.sort)
      if (options.depth) queryParams.append('depth', options.depth.toString())

      if (options.where) {
        queryParams.append('where', JSON.stringify(options.where))
      }

      const queryString = queryParams.toString()
      const url = `/api/${endpoint}${queryString ? `?${queryString}` : ''}`

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`)
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      console.error('Error fetching data from Payload API:', err)
      setIsError(true)
      setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [endpoint, JSON.stringify(options)])

  return {
    data,
    isLoading,
    isError,
    error,
    refetch: fetchData
  }
}
