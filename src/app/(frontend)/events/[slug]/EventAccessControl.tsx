'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { CheckoutOptions } from '@/components/checkout'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, Lock } from 'lucide-react'
import { clientLogger } from '@/utils/clientLogger'

interface EventAccessControlProps {
  event: {
    id: string
    title: string
    accessType: 'free' | 'subscription' | 'paid_ticket'
    ppvEnabled?: boolean
    ppvPrice?: number
    rentalEnabled?: boolean
    rentalPrice?: number
    rentalDurationHours?: number
    canAccess?: boolean
    accessDeniedReason?: string
  }
  children: React.ReactNode
}

/**
 * Component to handle access control for live events
 * 
 * Shows the event content if the user has access, or checkout options if not
 */
const EventAccessControl: React.FC<EventAccessControlProps> = ({ event, children }) => {
  const { isLoggedIn, subscriberId } = useAuth()
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [isCheckingAccess, setIsCheckingAccess] = useState(false)
  
  // Check if the user has access to the event
  useEffect(() => {
    // If the event is free, always grant access
    if (event.accessType === 'free') {
      setHasAccess(true)
      return
    }
    
    // If the user is not logged in, deny access
    if (!isLoggedIn || !subscriberId) {
      setHasAccess(false)
      return
    }
    
    // Check access via API
    const checkAccess = async () => {
      try {
        setIsCheckingAccess(true)
        
        const response = await fetch('/api/subscribers/check-access', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscriberId,
            eventId: event.id,
          }),
        })
        
        if (!response.ok) {
          throw new Error('Failed to check access status')
        }
        
        const { hasAccess } = await response.json()
        setHasAccess(hasAccess)
      } catch (err) {
        clientLogger.error('Error checking access:', err)
        // Default to no access on error
        setHasAccess(false)
      } finally {
        setIsCheckingAccess(false)
      }
    }
    
    checkAccess()
  }, [event.id, event.accessType, isLoggedIn, subscriberId])
  
  // Loading state
  if (isCheckingAccess || hasAccess === null) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Checking access...</span>
      </div>
    )
  }
  
  // User has access - show the content
  if (hasAccess) {
    return <>{children}</>
  }
  
  // User doesn't have access - show checkout options
  return (
    <div className="container mx-auto py-8">
      <Alert variant="destructive" className="mb-6">
        <Lock className="h-4 w-4" />
        <AlertTitle>Access Restricted</AlertTitle>
        <AlertDescription>
          You don't have access to this event. Please choose an option below to gain access.
        </AlertDescription>
      </Alert>
      
      <CheckoutOptions eventId={event.id} />
    </div>
  )
}

export default EventAccessControl
