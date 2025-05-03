/**
 * Utility to check if a user has access to a live event
 *
 * This function determines whether a user has access to a given live event based on:
 * - Active subscription
 * - PPV purchase
 * - Valid (non-expired) rental
 * - Manual subscription override
 * - Manually granted PPV access
 * - Manually granted rental access
 */
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import { logger } from '@/utils/logger'

export interface CheckAccessParams {
  userEmail: string
  eventId: string
}

/**
 * Check if a user has access to a live event
 *
 * @param userEmail - The email of the user to check access for
 * @param eventId - The ID of the live event to check access for
 * @returns A boolean indicating whether the user has access to the event
 */
export async function checkAccessForEvent({
  userEmail,
  eventId,
}: CheckAccessParams): Promise<boolean> {
  if (!userEmail || !eventId) return false

  try {
    // Get Payload instance
    const payload = await getPayloadHMR({ config: configPromise })

    // Fetch subscriber and event data in parallel
    const [subscriberResult, event] = await Promise.all([
      payload.find({
        collection: 'subscribers',
        where: { email: { equals: userEmail } },
      }),
      payload.findByID({
        collection: 'live-events',
        id: eventId,
      }),
    ])

    // If subscriber not found, deny access
    if (!subscriberResult.docs.length) return false

    const subscriber = subscriberResult.docs[0]

    // If event is free, grant access
    if (event.accessType === 'free') return true

    // Check for manual subscription override
    if (subscriber.hasManualSubscription) {
      logger.info(
        { userEmail, eventId, context: 'checkAccessForEvent' },
        'Granting access due to manual subscription override',
      )
      return true
    }

    // Check for manually granted PPV access
    const hasManualPPV = subscriber.manuallyGrantedPPV?.some((id: string) => id === eventId)
    if (hasManualPPV) {
      logger.info(
        { userEmail, eventId, context: 'checkAccessForEvent' },
        'Granting access due to manually granted PPV',
      )
      return true
    }

    // Check for manually granted rental
    const manualRental = subscriber.manuallyGrantedRentals?.find((r: any) => r.event === eventId)
    if (manualRental) {
      const now = new Date()
      const expiresAt = new Date(manualRental.expiresAt)

      if (now < expiresAt) {
        logger.info(
          { userEmail, eventId, context: 'checkAccessForEvent' },
          'Granting access due to manually granted rental',
        )
        return true
      }
    }

    // Check for active subscription
    const isSubscribed =
      subscriber.subscriptionStatus === 'active' || subscriber.subscriptionStatus === 'trialing'

    // If subscription required, check if the user has the required plan(s)
    if (event.accessType === 'subscription' && isSubscribed) {
      // Extract required plan IDs
      const requiredPlanIds = Array.isArray(event.requiredPlans)
        ? event.requiredPlans.map((p) => (typeof p === 'string' ? p : p.id))
        : []

      // If no specific plans are required, grant access to all subscribers
      if (requiredPlanIds.length === 0) {
        return true
      }

      // Check if the subscriber has any of the required plans
      const hasAllowedPlan = subscriber.activePlans?.some((planId: string) =>
        requiredPlanIds.includes(planId),
      )

      // Grant access if the subscriber has one of the required plans
      if (hasAllowedPlan) {
        logger.info(
          { userEmail, eventId, context: 'checkAccessForEvent' },
          'Granting access due to subscription with required plan',
        )
        return true
      }

      // If the user has an active subscription but not the required plan,
      // continue checking other access methods (PPV, rental, etc.)
    }

    // If user has an active subscription and the event doesn't require PPV or specific plans, grant access
    if (isSubscribed && !event.ppvEnabled && !event.requiredPlans?.length) return true

    // Check for PPV purchase
    const hasPPV = event.ppvEnabled && subscriber.purchasedPPV?.some((id: string) => id === eventId)

    if (hasPPV) return true

    // Check for valid rental
    if (event.rentalEnabled && subscriber.purchasedEventRentals?.includes(eventId)) {
      // Find the rental expiration
      const rental = subscriber.eventRentalExpirations?.find((r: any) => r.eventId === eventId)

      // If rental exists and is not expired, grant access
      if (rental && new Date() < new Date(rental.expiresAt)) {
        return true
      }
    }

    // Default to denying access
    return false
  } catch (error) {
    logger.error(
      { error, userEmail, eventId, context: 'checkAccessForEvent' },
      'Error checking event access',
    )
    return false
  }
}
