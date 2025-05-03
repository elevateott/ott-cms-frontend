/**
 * Hook to enforce access control based on subscriber status
 */
import { PayloadRequest } from 'payload'
import { logger } from '@/utils/logger'

/**
 * Enforces access control for content based on subscriber status
 * This hook should be added to the afterRead hook of content collections
 */
export const enforceSubscriberAccess = async ({ doc, req }: { doc: any; req: PayloadRequest }) => {
  try {
    // Skip access control for admin users
    if (req.user) {
      return doc
    }

    // If content is free, allow access
    if (doc.isFree) {
      return doc
    }

    // Get subscriber from request (this would be set by auth middleware)
    const subscriberId = req.headers['x-subscriber-id']
    
    if (!subscriberId) {
      // No subscriber ID, restrict access
      return {
        ...doc,
        accessRestricted: true,
        accessDeniedReason: 'login_required',
      }
    }

    // Get subscriber from database
    const subscriber = await req.payload.findByID({
      collection: 'subscribers',
      id: subscriberId as string,
    })

    // Check if subscriber has active subscription
    const hasActiveSubscription = 
      subscriber.subscriptionStatus === 'active' || 
      subscriber.subscriptionStatus === 'trialing'

    // Check if content is in purchasedRentals
    const hasRental = subscriber.purchasedRentals && 
      subscriber.purchasedRentals.includes(doc.id)

    // Check if rental is still valid
    let rentalValid = false
    if (hasRental && subscriber.rentalExpirations) {
      const rental = subscriber.rentalExpirations.find(
        (r: any) => r.contentId === doc.id
      )
      
      if (rental && new Date(rental.expiresAt) > new Date()) {
        rentalValid = true
      }
    }

    // Allow access if subscriber has active subscription or valid rental
    if (hasActiveSubscription || rentalValid) {
      return doc
    }

    // Otherwise, restrict access
    return {
      ...doc,
      accessRestricted: true,
      accessDeniedReason: hasRental ? 'rental_expired' : 'subscription_required',
    }
  } catch (error) {
    logger.error(
      { error, context: 'enforceSubscriberAccess', docId: doc.id },
      'Error enforcing subscriber access'
    )
    
    // In case of error, allow access to avoid breaking the site
    // but log the error for investigation
    return doc
  }
}
