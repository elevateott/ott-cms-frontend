'use client'

import React from 'react'
import { FilterGroup } from './FilterGroup'
import { Button } from '@/components/ui/button'
import { X, Filter } from 'lucide-react'
import { useFilters } from './FilterContext'
import { cn } from '@/utilities/ui'
import { Skeleton } from '@/components/ui/skeleton'

type FilterSidebarProps = {
  className?: string
  showMobileToggle?: boolean
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({ 
  className,
  showMobileToggle = true
}) => {
  const { filters, activeFilters, clearFilters, loading } = useFilters()
  const [isMobileOpen, setIsMobileOpen] = React.useState(false)
  
  // Count total active filters
  const activeFilterCount = Object.values(activeFilters).reduce(
    (count, values) => count + values.length,
    0
  )
  
  // Create loading skeleton
  const renderSkeleton = () => (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border rounded-md p-4">
          <Skeleton className="h-6 w-24 mb-4" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="flex items-center space-x-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
  
  return (
    <>
      {/* Mobile filter toggle button */}
      {showMobileToggle && (
        <div className="lg:hidden mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMobileOpen(true)}
            className="flex items-center"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-2 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>
      )}
      
      {/* Filter sidebar - desktop always visible, mobile in overlay */}
      <div
        className={cn(
          "lg:block",
          "lg:w-64 lg:flex-shrink-0",
          // Mobile overlay styles
          "fixed lg:relative inset-0 z-40 lg:z-0",
          "transform transition-transform duration-300 ease-in-out",
          "bg-background lg:bg-transparent",
          "p-4 lg:p-0",
          "overflow-y-auto",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          className
        )}
      >
        {/* Mobile header */}
        <div className="flex items-center justify-between mb-4 lg:hidden">
          <h2 className="font-semibold text-lg">Filters</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Clear all filters button */}
        {activeFilterCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="mb-4 w-full"
          >
            <X className="h-4 w-4 mr-2" />
            Clear all filters
          </Button>
        )}
        
        {/* Filter groups */}
        {loading ? (
          renderSkeleton()
        ) : (
          <div className="space-y-4">
            {filters.map((group) => (
              <FilterGroup key={group.type} group={group} />
            ))}
          </div>
        )}
      </div>
      
      {/* Mobile overlay backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  )
}
