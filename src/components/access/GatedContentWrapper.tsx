'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { CheckCircle, Lock, Loader2, AlertTriangle } from 'lucide-react'
import { clientLogger } from '@/utils/clientLogger'
import { API_ROUTES } from '@/constants/api'
import { AccessStatusIndicator } from './AccessStatusIndicator'
import { ContentAccessOptions } from './ContentAccessOptions'

const logger = clientLogger.createContextLogger('GatedContentWrapper')

interface GatedContentWrapperProps {
  /**
   * The ID of the content to check access for
   * Provide either contentId or eventId
   */
  contentId?: string

  /**
   * The ID of the event to check access for
   * Provide either contentId or eventId
   */
  eventId?: string

  /**
   * The content to render when the user has access
   */
  children: React.ReactNode

  /**
   * Optional custom title to display in the gated UI
   */
  title?: string

  /**
   * Optional custom description to display in the gated UI
   */
  description?: string

  /**
   * Optional callback when access state changes
   */
  onAccessChange?: (hasAccess: boolean) => void

  /**
   * Optional className for styling
   */
  className?: string
}

/**
 * A wrapper component that gates content based on user access
 *
 * This component:
 * 1. Checks if the current user has access to the content
 * 2. If they have access, renders the children
 * 3. If they don't have access, renders appropriate purchase options
 */
export const GatedContentWrapper: React.FC<GatedContentWrapperProps> = ({
  contentId,
  eventId,
  children,
  title,
  description,
  onAccessChange,
  className = '',
}) => {
  const { isLoggedIn } = useAuth()
  const { toast } = useToast()
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [contentData, setContentData] = useState<any>(null)

  // Validate props
  if (!contentId && !eventId) {
    logger.error('GatedContentWrapper requires either contentId or eventId')
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Configuration Error</AlertTitle>
        <AlertDescription>
          This component requires either a contentId or eventId prop.
        </AlertDescription>
      </Alert>
    )
  }

  // Load content data and check access
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Determine which API to call based on the provided ID
        const contentType = contentId ? 'content' : 'live-events'
        const id = contentId || eventId

        // Fetch content data and access status in parallel
        const [contentResponse, accessResponse] = await Promise.all([
          // Fetch content data
          fetch(`${contentType === 'content' ? API_ROUTES.CONTENT : API_ROUTES.LIVE_EVENTS}/${id}`),

          // Check access
          fetch(
            `${API_ROUTES.ACCESS_CHECK}?${contentId ? 'contentId=' + contentId : 'eventId=' + eventId}`,
          ),
        ])

        // Handle errors
        if (!contentResponse.ok) {
          throw new Error(`Failed to fetch ${contentType} data`)
        }

        if (!accessResponse.ok) {
          throw new Error('Failed to check access status')
        }

        // Parse responses
        const content = await contentResponse.json()
        const access = await accessResponse.json()

        // Update state
        setContentData(content)
        setHasAccess(access.hasAccess)

        // Call onAccessChange callback if provided
        if (onAccessChange) {
          onAccessChange(access.hasAccess)
        }
      } catch (err) {
        logger.error('Error loading content or checking access:', err)
        setError(err instanceof Error ? err.message : 'An unknown error occurred')
        setHasAccess(false) // Default to no access on error

        toast({
          title: 'Error',
          description: 'Failed to check content access. Please try again later.',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (isLoggedIn || (contentData && contentData.isFree)) {
      loadData()
    } else {
      // If user is not logged in and we don't know if content is free,
      // fetch just the content data first to check
      const fetchContentOnly = async () => {
        try {
          setIsLoading(true)

          const contentType = contentId ? 'content' : 'live-events'
          const id = contentId || eventId

          const response = await fetch(
            `${contentType === 'content' ? API_ROUTES.CONTENT : API_ROUTES.LIVE_EVENTS}/${id}`,
          )

          if (!response.ok) {
            throw new Error(`Failed to fetch ${contentType} data`)
          }

          const content = await response.json()
          setContentData(content)

          // If content is free, set hasAccess to true
          // Otherwise, set to false since user is not logged in
          if (content.isFree || content.accessType === 'free') {
            setHasAccess(true)
          } else {
            setHasAccess(false)
          }
        } catch (err) {
          logger.error('Error fetching content data:', err)
          setError(err instanceof Error ? err.message : 'An unknown error occurred')
          setHasAccess(false)
        } finally {
          setIsLoading(false)
        }
      }

      fetchContentOnly()
    }
  }, [contentId, eventId, isLoggedIn, onAccessChange, toast])

  // Show loading state
  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center space-x-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span>Checking access...</span>
        </div>
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  // If content data couldn't be loaded
  if (!contentData) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Content Not Found</AlertTitle>
        <AlertDescription>
          The requested content could not be found. Please check the URL and try again.
        </AlertDescription>
      </Alert>
    )
  }

  // User has access - show the content
  if (hasAccess) {
    return (
      <div className={className}>
        <AccessStatusIndicator hasAccess={true} className="mb-4" />
        {children}
      </div>
    )
  }

  // User doesn't have access - show purchase options
  return (
    <div className={className}>
      <AccessStatusIndicator hasAccess={false} className="mb-4" />

      <ContentAccessOptions
        content={contentData}
        contentType={contentId ? 'content' : 'event'}
        contentId={contentId || eventId || ''}
        title={title || contentData.title}
        description={description}
      />
    </div>
  )
}

export default GatedContentWrapper
