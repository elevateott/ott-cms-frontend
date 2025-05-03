'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronUp, X } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/utilities/ui'
import { FilterGroup as FilterGroupType, useFilters } from './FilterContext'

type FilterGroupProps = {
  group: FilterGroupType
  className?: string
}

export const FilterGroup: React.FC<FilterGroupProps> = ({ group, className }) => {
  const { type, label, options, multiSelect = true } = group
  const { activeFilters, setFilter, clearFilterType, isFilterActive } = useFilters()
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Count active filters for this group
  const activeCount = activeFilters[type]?.length || 0
  
  // Determine if we should show the "Show more" button
  const initialDisplayCount = 5
  const hasMoreOptions = options.length > initialDisplayCount
  
  // Get the options to display
  const displayOptions = isExpanded ? options : options.slice(0, initialDisplayCount)
  
  return (
    <div className={cn("border rounded-md p-4", className)}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">{label}</h3>
          {activeCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeCount}
            </Badge>
          )}
        </div>
        
        {activeCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 px-2"
            onClick={() => clearFilterType(type)}
          >
            <X className="h-3 w-3 mr-1" />
            <span className="text-xs">Clear</span>
          </Button>
        )}
      </div>
      
      <div className="space-y-2 mt-3">
        {multiSelect ? (
          // Checkbox group for multi-select filters
          displayOptions.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox
                id={`${type}-${option.value}`}
                checked={isFilterActive(type, option.value)}
                onCheckedChange={(checked) => {
                  setFilter(type, option.value, checked === true)
                }}
              />
              <Label
                htmlFor={`${type}-${option.value}`}
                className="text-sm cursor-pointer"
              >
                {option.label}
              </Label>
            </div>
          ))
        ) : (
          // Radio group for single-select filters
          <RadioGroup
            value={activeFilters[type]?.[0] || ''}
            onValueChange={(value) => {
              // If the same value is clicked, deselect it
              if (activeFilters[type]?.[0] === value) {
                setFilter(type, value, false)
              } else {
                setFilter(type, value, true)
              }
            }}
          >
            {displayOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem
                  value={option.value}
                  id={`${type}-${option.value}`}
                />
                <Label
                  htmlFor={`${type}-${option.value}`}
                  className="text-sm cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )}
        
        {hasMoreOptions && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 text-xs"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-3 w-3 mr-1" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                Show {options.length - initialDisplayCount} more
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
