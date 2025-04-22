'use client'

import { logger } from '@/utils/logger'

import { useState, useEffect, useRef } from 'react'

// Hook for using localStorage with React
export function useLocalStorage<T>(key: string, initialValue: T) {
  // Create a ref to track if this is the first render
  const isFirstRender = useRef(true)

  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(initialValue)

  // Only run once on mount to load from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key)
      // Parse stored json or if none return initialValue
      if (item) {
        const value = JSON.parse(item)
        setStoredValue(value)
      }
    } catch (error) {
      logger.error({ context: 'LocalStorage' }, `Error reading localStorage key "${key}":`, error)
    }

    // Mark that we've done the first render
    isFirstRender.current = false
  }, []) // Empty dependency array means this only runs once on mount

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage.
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value

      // Save state
      setStoredValue(valueToStore)

      // Save to local storage, but only if we're on the client
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      logger.error({ context: 'LocalStorage' }, `Error setting localStorage key "${key}":`, error)
    }
  }

  return [storedValue, setValue] as const
}
