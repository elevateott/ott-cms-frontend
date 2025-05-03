'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { ContentCard } from '@/components/ContentCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { FilterProvider, FilterSidebar, ActiveFilters } from '@/components/ContentFilters'
import { clientLogger } from '@/utils/clientLogger'

type FilterableContentListProps = {
  initialData?: any[]
  apiEndpoint?: string
  title?: string
  emptyMessage?: string
  limit?: number
  className?: string
}

export const FilterableContentList: React.FC<FilterableContentListProps> = ({
  initialData = [],
  apiEndpoint = '/api/content',
  title = 'Content',
  emptyMessage = 'No content found',
  limit = 12,
  className = '',
}) => {
  const searchParams = useSearchParams()
  const [content, setContent] = useState(Array.isArray(initialData) ? initialData : [])
  const [loading, setLoading] = useState(!Array.isArray(initialData) || initialData.length === 0)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'))
  const [hasMore, setHasMore] = useState(true)
  const [totalItems, setTotalItems] = useState(0)

  // Fetch content based on current filters
  const fetchContent = async () => {
    try {
      setLoading(true)
      setError(null)

      // Build the URL with all current search parameters
      const url = new URL(apiEndpoint, window.location.origin)
      
      // Add all search params from the current URL
      searchParams.forEach((value, key) => {
        url.searchParams.append(key, value)
      })
      
      // Ensure page and limit are set
      if (!url.searchParams.has('page')) {
        url.searchParams.set('page', page.toString())
      }
      
      if (!url.searchParams.has('limit')) {
        url.searchParams.set('limit', limit.toString())
      }

      const response = await fetch(url.toString())

      if (!response.ok) {
        throw new Error(`Failed to fetch content: ${response.status}`)
      }

      const data = await response.json()

      setContent(data.docs || [])
      setTotalItems(data.totalDocs || 0)
      setHasMore(data.hasNextPage || false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      clientLogger.error('Error fetching content:', err, 'FilterableContentList')
    } finally {
      setLoading(false)
    }
  }

  // Fetch content when search params change
  useEffect(() => {
    fetchContent()
    // Update the page state from URL
    setPage(parseInt(searchParams.get('page') || '1'))
  }, [searchParams])

  return (
    <FilterProvider>
      <div className={`grid grid-cols-1 lg:grid-cols-4 gap-8 ${className}`}>
        {/* Filter sidebar */}
        <div className="lg:col-span-1">
          <FilterSidebar />
        </div>
        
        {/* Content area */}
        <div className="lg:col-span-3">
          {/* Title and result count */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold">{title}</h2>
              {!loading && (
                <p className="text-sm text-muted-foreground mt-1">
                  {totalItems} {totalItems === 1 ? 'result' : 'results'}
                </p>
              )}
            </div>
          </div>
          
          {/* Active filters */}
          <ActiveFilters />
          
          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              <p>{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchContent} 
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          )}
          
          {/* Loading state */}
          {loading && !content.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={`skeleton-${i}`} className="space-y-3">
                  <Skeleton className="h-[200px] w-full rounded-lg" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))}
            </div>
          ) : content.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {content.map((item) => (
                  <ContentCard key={item.id} content={item} />
                ))}
              </div>
              
              {/* Pagination */}
              <div className="mt-8 flex justify-center">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => {
                      const url = new URL(window.location.href)
                      url.searchParams.set('page', (page - 1).toString())
                      window.history.pushState({}, '', url.toString())
                      setPage(page - 1)
                    }}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    disabled={!hasMore}
                    onClick={() => {
                      const url = new URL(window.location.href)
                      url.searchParams.set('page', (page + 1).toString())
                      window.history.pushState({}, '', url.toString())
                      setPage(page + 1)
                    }}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h3 className="text-xl font-medium text-gray-600 dark:text-gray-300">
                {emptyMessage}
              </h3>
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                Try adjusting your filters or search criteria
              </p>
            </div>
          )}
        </div>
      </div>
    </FilterProvider>
  )
}
