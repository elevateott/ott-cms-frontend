'use client'

import React, { useState, useEffect } from 'react'
import { ContentCarousel } from '@/components/ContentCarousel'
import { Skeleton } from '@/components/ui/skeleton'
import { clientLogger } from '@/utils/clientLogger'

type CarouselsContainerProps = {
  page?: string
  className?: string
  initialData?: any[]
}

export const CarouselsContainer: React.FC<CarouselsContainerProps> = ({
  page = 'home',
  className = '',
  initialData = [],
}) => {
  const [carousels, setCarousels] = useState(Array.isArray(initialData) ? initialData : [])
  const [loading, setLoading] = useState(!Array.isArray(initialData) || initialData.length === 0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCarousels = async () => {
      if (initialData && initialData.length > 0) {
        return
      }

      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/carousels?page=${page}`)

        if (!response.ok) {
          throw new Error(`Failed to fetch carousels: ${response.status}`)
        }

        const data = await response.json()
        setCarousels(data.docs || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        clientLogger.error('Error fetching carousels:', err, 'CarouselsContainer')
      } finally {
        setLoading(false)
      }
    }

    fetchCarousels()
  }, [page, initialData])

  if (loading) {
    return (
      <div className={className}>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={`skeleton-${i}`} className="mb-12">
            <Skeleton className="h-8 w-48 mb-4" />
            <Skeleton className="h-4 w-64 mb-6" />
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, j) => (
                <Skeleton key={`item-${j}`} className="h-[200px] w-full rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    clientLogger.error('Error in CarouselsContainer:', error, 'CarouselsContainer')
    return null // Don't show error to users, just log it
  }

  if (!carousels.length) {
    return null
  }

  return (
    <div className={className}>
      {carousels.map((carousel) => (
        <ContentCarousel
          key={carousel.id}
          title={carousel.title}
          description={carousel.description}
          items={carousel.items || []}
          displayOptions={carousel.displayOptions}
          viewAllLink={
            carousel.items && carousel.items.length > 0
              ? carousel.items[0].itemType === 'series'
                ? '/series'
                : '/content'
              : undefined
          }
        />
      ))}
    </div>
  )
}
