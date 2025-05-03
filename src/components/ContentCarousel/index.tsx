'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ContentCard } from '@/components/ContentCard'
import { Button } from '@/components/ui/button'
import { cn } from '@/utilities/ui'
import Link from 'next/link'
import { clientLogger } from '@/utils/clientLogger'

type CarouselItem = {
  id: string
  itemType: 'content' | 'series'
  item: any
  order: number
  customTitle?: string
  customDescription?: string
}

type DisplayOptions = {
  layout?: 'standard' | 'featured' | 'compact'
  itemsPerView?: 'auto' | '2' | '3' | '4' | '5'
  showArrows?: boolean
  showDots?: boolean
  autoplay?: boolean
  autoplaySpeed?: number
}

type ContentCarouselProps = {
  title: string
  description?: string
  items: CarouselItem[]
  displayOptions?: DisplayOptions
  className?: string
  viewAllLink?: string
  viewAllLabel?: string
}

export const ContentCarousel: React.FC<ContentCarouselProps> = ({
  title,
  description,
  items = [],
  displayOptions = {},
  className = '',
  viewAllLink,
  viewAllLabel = 'View All',
}) => {
  const {
    layout = 'standard',
    itemsPerView = 'auto',
    showArrows = true,
    showDots = false,
    autoplay = false,
    autoplaySpeed = 5000,
  } = displayOptions

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovering, setIsHovering] = useState(false)
  const carouselRef = useRef<HTMLDivElement>(null)
  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Calculate items per view based on the setting
  const getItemsPerView = () => {
    if (itemsPerView === 'auto') {
      return layout === 'featured' ? 1 : 4
    }
    return parseInt(itemsPerView, 10)
  }

  const itemsPerViewCount = getItemsPerView()
  const totalSlides = Math.max(0, items.length - itemsPerViewCount + 1)

  // Handle next/prev navigation
  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(totalSlides - 1, prev + 1))
  }

  // Handle dot navigation
  const handleDotClick = (index: number) => {
    setCurrentIndex(index)
  }

  // Set up autoplay
  useEffect(() => {
    if (autoplay && !isHovering && totalSlides > 1) {
      autoplayTimerRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev === totalSlides - 1 ? 0 : prev + 1))
      }, autoplaySpeed)
    }

    return () => {
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current)
      }
    }
  }, [autoplay, autoplaySpeed, isHovering, totalSlides])

  // Handle mouse enter/leave for autoplay pause
  const handleMouseEnter = () => {
    setIsHovering(true)
  }

  const handleMouseLeave = () => {
    setIsHovering(false)
  }

  // Render the carousel items
  const renderItems = () => {
    return items.map((item, index) => {
      // Skip items that would be outside the visible window
      if (index < currentIndex || index >= currentIndex + itemsPerViewCount) {
        return null
      }

      const itemData = item.item || {}
      
      // Determine the correct data based on item type
      const cardData = {
        id: itemData.id,
        title: item.customTitle || itemData.title,
        description: item.customDescription || itemData.description,
        slug: itemData.slug,
        posterImage: itemData.posterImage || itemData.thumbnail,
        releaseDate: itemData.releaseDate,
      }

      return (
        <div
          key={item.id}
          className={cn(
            'carousel-item flex-shrink-0',
            layout === 'featured' ? 'w-full' : `w-full md:w-1/${itemsPerViewCount}`
          )}
        >
          <ContentCard
            content={cardData}
            className="h-full mx-2"
            linkPath={item.itemType === 'series' ? `/series/${cardData.slug}` : `/content/${cardData.slug}`}
          />
        </div>
      )
    })
  }

  // If there are no items, don't render anything
  if (!items.length) {
    return null
  }

  return (
    <div
      className={cn('carousel-container mb-12', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className={cn('font-bold', layout === 'featured' ? 'text-3xl' : 'text-2xl')}>
            {title}
          </h2>
          {description && <p className="text-muted-foreground mt-1">{description}</p>}
        </div>
        
        {viewAllLink && (
          <Link href={viewAllLink}>
            <Button variant="outline" size="sm">
              {viewAllLabel}
            </Button>
          </Link>
        )}
      </div>

      <div className="relative">
        {/* Carousel container */}
        <div
          ref={carouselRef}
          className="carousel-items-container overflow-hidden relative"
        >
          <div
            className="carousel-items-wrapper flex transition-transform duration-300 ease-in-out"
            style={{
              transform: `translateX(-${currentIndex * (100 / itemsPerViewCount)}%)`,
            }}
          >
            {renderItems()}
          </div>
        </div>

        {/* Navigation arrows */}
        {showArrows && items.length > itemsPerViewCount && (
          <>
            <Button
              variant="outline"
              size="icon"
              className={cn(
                'absolute top-1/2 -translate-y-1/2 left-2 z-10 rounded-full bg-background/80 backdrop-blur-sm',
                currentIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'opacity-100'
              )}
              onClick={handlePrev}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className={cn(
                'absolute top-1/2 -translate-y-1/2 right-2 z-10 rounded-full bg-background/80 backdrop-blur-sm',
                currentIndex === totalSlides - 1 ? 'opacity-50 cursor-not-allowed' : 'opacity-100'
              )}
              onClick={handleNext}
              disabled={currentIndex === totalSlides - 1}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}
      </div>

      {/* Navigation dots */}
      {showDots && totalSlides > 1 && (
        <div className="flex justify-center mt-4 gap-2">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <button
              key={index}
              className={cn(
                'w-2 h-2 rounded-full transition-colors',
                index === currentIndex ? 'bg-primary' : 'bg-muted'
              )}
              onClick={() => handleDotClick(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
