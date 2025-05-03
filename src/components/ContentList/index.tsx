'use client'

import { clientLogger } from '@/utils/clientLogger'

import React, { useState, useEffect } from 'react'
import { ContentCard } from '@/components/ContentCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

type ContentListProps = {
  initialData?: any[]
  apiEndpoint?: string
  title?: string
  emptyMessage?: string
  limit?: number
  className?: string
}

export const ContentList: React.FC<ContentListProps> = ({
  initialData = [],
  apiEndpoint = '/api/content',
  title = 'Content',
  emptyMessage = 'No content found',
  limit = 12,
  className = '',
}) => {
  const [content, setContent] = useState(Array.isArray(initialData) ? initialData : [])
  const [loading, setLoading] = useState(!Array.isArray(initialData) || initialData.length === 0)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const fetchContent = async (pageNum: number = 1, replace: boolean = true) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`${apiEndpoint}?page=${pageNum}&limit=${limit}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch content: ${response.status}`)
      }

      const data = await response.json()

      if (replace) {
        setContent(data.docs || [])
      } else {
        setContent((prev) => [...prev, ...(data.docs || [])])
      }

      setHasMore((data.docs || []).length === limit)
      setPage(pageNum)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      clientLogger.error('Error fetching content:', err, 'ContentListindex')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!Array.isArray(initialData) || initialData.length === 0) {
      fetchContent()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData])

  const handleLoadMore = () => {
    fetchContent(page + 1, false)
  }

  return (
    <div className={`content-list ${className}`}>
      {title && <h2 className="text-2xl font-bold mb-6">{title}</h2>}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {loading && !content.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {content.map((item) => (
              <ContentCard key={item.id} content={item} />
            ))}
          </div>

          {hasMore && (
            <div className="mt-8 text-center">
              <Button
                onClick={handleLoadMore}
                disabled={loading}
                variant="outline"
                className="min-w-[150px]"
              >
                {loading ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 text-gray-500">{emptyMessage}</div>
      )}
    </div>
  )
}

export default ContentList
