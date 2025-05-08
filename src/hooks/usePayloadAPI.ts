'use client'

import { useState, useEffect } from 'react'

interface UsePayloadAPIOptions {
  limit?: number
  page?: number
  sort?: string
  where?: Record<string, any>
  depth?: number
  [key: string]: any
}

interface PayloadResponse<T> {
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

export function usePayloadAPI<T = any>(
  endpoint: string,
  options: UsePayloadAPIOptions = {}
) {
  const [data, setData] = useState<PayloadResponse<T> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
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
        
        // Handle 'where' conditions
        if (options.where) {
          queryParams.append('where', JSON.stringify(options.where))
        }
        
        // Add any other options as query parameters
        Object.entries(options).forEach(([key, value]) => {
          if (!['limit', 'page', 'sort', 'where', 'depth'].includes(key)) {
            queryParams.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value))
          }
        })

        const queryString = queryParams.toString()
        const url = `/api/${endpoint}${queryString ? `?${queryString}` : ''}`
        
        const response = await fetch(url)
        
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`)
        }
        
        const result = await response.json()
        setData(result)
      } catch (err) {
        setIsError(true)
        setError(err instanceof Error ? err : new Error(String(err)))
        console.error(`Error fetching from ${endpoint}:`, err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [endpoint, JSON.stringify(options)])

  return { data, isLoading, isError, error }
}
