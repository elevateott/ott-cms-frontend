'use client'

import React from 'react'
import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useFilters } from './FilterContext'
import { cn } from '@/utilities/ui'

type ActiveFiltersProps = {
  className?: string
}

export const ActiveFilters: React.FC<ActiveFiltersProps> = ({ className }) => {
  const { filters, activeFilters, setFilter, clearFilters } = useFilters()
  
  // Count total active filters
  const activeFilterCount = Object.values(activeFilters).reduce(
    (count, values) => count + values.length,
    0
  )
  
  // If no active filters, don't render anything
  if (activeFilterCount === 0) {
    return null
  }
  
  // Helper to get the label for a filter value
  const getFilterLabel = (type: string, value: string): string => {
    const group = filters.find(f => f.type === type)
    if (!group) return value
    
    const option = group.options.find(o => o.value === value)
    return option?.label || value
  }
  
  return (
    <div className={cn("flex flex-wrap items-center gap-2 mb-4", className)}>
      <span className="text-sm font-medium mr-2">Active filters:</span>
      
      {Object.entries(activeFilters).map(([type, values]) => {
        // Get the filter group label
        const groupLabel = filters.find(f => f.type === type)?.label || type
        
        return values.map(value => (
          <Badge
            key={`${type}-${value}`}
            variant="outline"
            className="flex items-center gap-1 px-2 py-1"
          >
            <span className="text-xs font-normal">{groupLabel}:</span>
            <span className="font-medium">{getFilterLabel(type, value)}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 ml-1"
              onClick={() => setFilter(type, value, false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))
      })}
      
      <Button
        variant="ghost"
        size="sm"
        className="text-xs"
        onClick={clearFilters}
      >
        Clear all
      </Button>
    </div>
  )
}
