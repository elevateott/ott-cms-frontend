'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { clientLogger } from '@/utils/clientLogger'

export type FilterOption = {
  id?: string
  label: string
  value: string
  slug?: string
}

export type FilterType = 'category' | 'creator' | 'tag' | 'series' | 'custom'

export type FilterGroup = {
  type: FilterType
  label: string
  options: FilterOption[]
  multiSelect?: boolean
}

export type FilterState = {
  [key: string]: string[]
}

type FilterContextType = {
  filters: FilterGroup[]
  activeFilters: FilterState
  loading: boolean
  setFilter: (type: string, value: string, active: boolean) => void
  clearFilters: () => void
  clearFilterType: (type: string) => void
  isFilterActive: (type: string, value: string) => boolean
}

const FilterContext = createContext<FilterContextType | undefined>(undefined)

export const useFilters = () => {
  const context = useContext(FilterContext)
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider')
  }
  return context
}

type FilterProviderProps = {
  children: ReactNode
  initialFilters?: FilterGroup[]
}

export const FilterProvider: React.FC<FilterProviderProps> = ({ 
  children, 
  initialFilters = [] 
}) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const [filters, setFilters] = useState<FilterGroup[]>(initialFilters)
  const [activeFilters, setActiveFilters] = useState<FilterState>({})
  const [loading, setLoading] = useState<boolean>(true)
  
  // Initialize filters from URL on mount
  useEffect(() => {
    const newActiveFilters: FilterState = {}
    
    // Process all search params
    for (const [key, value] of searchParams.entries()) {
      // Skip pagination and other non-filter params
      if (['page', 'limit', 'sort'].includes(key)) continue
      
      // Handle array params (e.g., categories=1&categories=2)
      if (newActiveFilters[key]) {
        newActiveFilters[key].push(value)
      } else {
        newActiveFilters[key] = [value]
      }
    }
    
    setActiveFilters(newActiveFilters)
    
    // Fetch filter options if not provided
    if (initialFilters.length === 0) {
      fetchFilterOptions()
    } else {
      setLoading(false)
    }
  }, [searchParams, initialFilters])
  
  // Fetch available filter options from the API
  const fetchFilterOptions = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/filters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          types: ['category', 'creator', 'tag', 'series'],
        }),
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch filter options: ${response.status}`)
      }
      
      const data = await response.json()
      
      const newFilters: FilterGroup[] = [
        {
          type: 'category',
          label: 'Categories',
          options: data.categories || [],
          multiSelect: true,
        },
        {
          type: 'creator',
          label: 'Creators',
          options: data.creators || [],
          multiSelect: true,
        },
        {
          type: 'tag',
          label: 'Tags',
          options: data.tags || [],
          multiSelect: true,
        },
        {
          type: 'series',
          label: 'Series',
          options: data.series || [],
          multiSelect: false,
        },
      ]
      
      setFilters(newFilters)
    } catch (error) {
      clientLogger.error('Error fetching filter options:', error, 'FilterContext')
    } finally {
      setLoading(false)
    }
  }
  
  // Update URL and state when a filter is toggled
  const setFilter = (type: string, value: string, active: boolean) => {
    // Create a new URLSearchParams object based on the current params
    const params = new URLSearchParams(searchParams.toString())
    
    // Update the active filters state
    const newActiveFilters = { ...activeFilters }
    
    if (active) {
      // Add the filter
      if (!newActiveFilters[type]) {
        newActiveFilters[type] = []
      }
      
      // Check if this is a multi-select filter
      const filterGroup = filters.find(f => f.type === type)
      
      if (!filterGroup?.multiSelect) {
        // For single-select filters, remove any existing values
        newActiveFilters[type] = [value]
        
        // Remove all existing params for this type
        const existingParams = Array.from(params.keys())
        existingParams.forEach(key => {
          if (key === type) {
            params.delete(key)
          }
        })
        
        // Add the new value
        params.append(type, value)
      } else {
        // For multi-select, add to the array if not already present
        if (!newActiveFilters[type].includes(value)) {
          newActiveFilters[type].push(value)
          params.append(type, value)
        }
      }
    } else {
      // Remove the filter
      if (newActiveFilters[type]) {
        newActiveFilters[type] = newActiveFilters[type].filter(v => v !== value)
        
        if (newActiveFilters[type].length === 0) {
          delete newActiveFilters[type]
        }
        
        // Update URL params
        const existingParams = Array.from(params.entries())
        params.delete(type)
        
        // Re-add the remaining values
        if (newActiveFilters[type]) {
          newActiveFilters[type].forEach(v => {
            params.append(type, v)
          })
        }
      }
    }
    
    // Reset to page 1 when filters change
    params.set('page', '1')
    
    // Update the URL
    router.push(`${pathname}?${params.toString()}`)
    
    // Update state
    setActiveFilters(newActiveFilters)
  }
  
  // Clear all filters
  const clearFilters = () => {
    // Create a new URLSearchParams with only non-filter params
    const params = new URLSearchParams()
    
    // Preserve pagination and sorting params
    const preserveParams = ['limit', 'sort']
    preserveParams.forEach(param => {
      const value = searchParams.get(param)
      if (value) {
        params.set(param, value)
      }
    })
    
    // Reset to page 1
    params.set('page', '1')
    
    // Update the URL
    router.push(`${pathname}?${params.toString()}`)
    
    // Clear the active filters state
    setActiveFilters({})
  }
  
  // Clear filters of a specific type
  const clearFilterType = (type: string) => {
    // Create a new URLSearchParams based on the current params
    const params = new URLSearchParams(searchParams.toString())
    
    // Remove all params of the specified type
    params.delete(type)
    
    // Reset to page 1
    params.set('page', '1')
    
    // Update the URL
    router.push(`${pathname}?${params.toString()}`)
    
    // Update the active filters state
    const newActiveFilters = { ...activeFilters }
    delete newActiveFilters[type]
    setActiveFilters(newActiveFilters)
  }
  
  // Check if a filter is active
  const isFilterActive = (type: string, value: string): boolean => {
    return Boolean(activeFilters[type]?.includes(value))
  }
  
  return (
    <FilterContext.Provider
      value={{
        filters,
        activeFilters,
        loading,
        setFilter,
        clearFilters,
        clearFilterType,
        isFilterActive,
      }}
    >
      {children}
    </FilterContext.Provider>
  )
}
