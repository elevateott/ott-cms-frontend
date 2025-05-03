// src/hooks/liveEvents/enforceAccessControl.ts
import { logger } from '@/utils/logger'
import type { CollectionAfterReadHook } from 'payload'

/**
 * Hook to enforce access control for live events
 * 
 * This hook is called after a live event document is read from the database.
 * It checks if the user has access to the live event based on the access type.
 * If not, it adds a canAccess: false flag to the document.
 */
export const enforceAccessControl: CollectionAfterReadHook = async ({ doc, req }) => {
  // Skip access control for admin users
  if (req?.user) {
    return {
      ...doc,
      canAccess: true,
    }
  }

  // Default to allowing access for free events
  if (!doc.accessType || doc.accessType === 'free') {
    return {
      ...doc,
      canAccess: true,
    }
  }

  // For subscription-only events, check if the user has an active subscription
  if (doc.accessType === 'subscription') {
    // Get the user from the request
    const user = req?.user

    // If no user or no subscription, deny access
    if (!user || !user.subscriptionActive) {
      logger.info(
        { context: 'enforceAccessControl' },
        `Denying access to subscription-only live event ${doc.id} for unauthenticated or non-subscribed user`
      )
      
      return {
        ...doc,
        canAccess: false,
        accessDeniedReason: 'subscription_required',
      }
    }

    // User has an active subscription, allow access
    return {
      ...doc,
      canAccess: true,
    }
  }

  // For paid ticket events, check if the user has purchased a ticket
  if (doc.accessType === 'paid_ticket') {
    // Get the user from the request
    const user = req?.user

    // If no user, deny access
    if (!user) {
      logger.info(
        { context: 'enforceAccessControl' },
        `Denying access to paid ticket live event ${doc.id} for unauthenticated user`
      )
      
      return {
        ...doc,
        canAccess: false,
        accessDeniedReason: 'login_required',
      }
    }

    // Check if the user has purchased a ticket for this event
    // This is a placeholder - you would need to implement ticket checking logic
    const hasTicket = user.tickets?.includes(doc.id)

    if (!hasTicket) {
      logger.info(
        { context: 'enforceAccessControl' },
        `Denying access to paid ticket live event ${doc.id} for user without a ticket`
      )
      
      return {
        ...doc,
        canAccess: false,
        accessDeniedReason: 'ticket_required',
        ticketPrice: doc.ticketPrice,
      }
    }

    // User has a ticket, allow access
    return {
      ...doc,
      canAccess: true,
    }
  }

  // Default to denying access for unknown access types
  logger.warn(
    { context: 'enforceAccessControl' },
    `Unknown access type ${doc.accessType} for live event ${doc.id}`
  )
  
  return {
    ...doc,
    canAccess: false,
    accessDeniedReason: 'unknown',
  }
}
