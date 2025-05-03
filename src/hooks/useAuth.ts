'use client'

import { useState, useEffect, useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { clientLogger } from '@/utils/clientLogger'

interface AuthState {
  isLoggedIn: boolean
  subscriberId: string | null
  subscriberToken: string | null
  subscriberEmail: string | null
}

/**
 * Hook for managing subscriber authentication
 * 
 * Provides methods for checking login status, logging in/out,
 * and accessing subscriber information
 */
export const useAuth = () => {
  // Store auth state in localStorage to persist across page refreshes
  const [subscriberToken, setSubscriberToken] = useLocalStorage<string | null>('subscriberToken', null)
  const [subscriberId, setSubscriberId] = useLocalStorage<string | null>('subscriberId', null)
  const [subscriberEmail, setSubscriberEmail] = useLocalStorage<string | null>('subscriberEmail', null)
  
  // Derived state
  const isLoggedIn = Boolean(subscriberToken && subscriberId)

  // Clear all auth data
  const logout = useCallback(() => {
    setSubscriberToken(null)
    setSubscriberId(null)
    setSubscriberEmail(null)
    clientLogger.info('User logged out')
  }, [setSubscriberToken, setSubscriberId, setSubscriberEmail])

  // Set auth data after successful login
  const login = useCallback((token: string, id: string, email: string) => {
    setSubscriberToken(token)
    setSubscriberId(id)
    setSubscriberEmail(email)
    clientLogger.info('User logged in', { id, email })
  }, [setSubscriberToken, setSubscriberId, setSubscriberEmail])

  return {
    isLoggedIn,
    subscriberId,
    subscriberToken,
    subscriberEmail,
    login,
    logout
  }
}

export default useAuth
