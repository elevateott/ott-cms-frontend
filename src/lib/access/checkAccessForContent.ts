/**
 * Utility to check if a user has access to content
 *
 * This function determines whether a user has access to a given content item based on:
 * - Active subscription
 * - Valid (non-expired) rental
 * - Manual subscription override
 */
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import { logger } from '@/utils/logger'

export interface CheckAccessParams {
  userEmail: string
  contentId: string
}

/**
 * Check if a user has access to content
 *
 * @param userEmail - The email of the user to check access for
 * @param contentId - The ID of the content to check access for
 * @returns A boolean indicating whether the user has access to the content
 */
export async function checkAccessForContent({
  userEmail,
  contentId,
}: CheckAccessParams): Promise<boolean> {
  if (!userEmail || !contentId) return false

  try {
    // Get Payload instance
    const payload = await getPayloadHMR({ config: configPromise })

    // Fetch subscriber and content data in parallel
    const [subscriberResult, content] = await Promise.all([
      payload.find({
        collection: 'subscribers',
        where: { email: { equals: userEmail } },
      }),
      payload.findByID({
        collection: 'content',
        id: contentId,
      }),
    ])

    // If subscriber not found, deny access
    if (!subscriberResult.docs.length) return false

    const subscriber = subscriberResult.docs[0]

    // If content is free, grant access
    if (content.isFree) return true

    // Check for manual subscription override
    if (subscriber.hasManualSubscription) {
      logger.info(
        { userEmail, contentId, context: 'checkAccessForContent' },
        'Granting access due to manual subscription override',
      )
      return true
    }

    // Check for active subscription
    const isSubscribed =
      subscriber.subscriptionStatus === 'active' || subscriber.subscriptionStatus === 'trialing'

    // If user has an active subscription, check for required plans
    if (isSubscribed) {
      // Extract required plan IDs
      const requiredPlanIds = Array.isArray(content.requiredPlans)
        ? content.requiredPlans.map((p) => (typeof p === 'string' ? p : p.id))
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
          { userEmail, contentId, context: 'checkAccessForContent' },
          'Granting access due to subscription with required plan',
        )
        return true
      }

      // If the user has an active subscription but not the required plan,
      // continue checking other access methods (rental, etc.)
    }

    // Check for valid rental
    if (subscriber.purchasedRentals?.includes(contentId)) {
      // Find the rental expiration
      const rental = subscriber.rentalExpirations?.find((r: any) => r.contentId === contentId)

      // If rental exists and is not expired, grant access
      if (rental && new Date() < new Date(rental.expiresAt)) {
        return true
      }
    }

    // Default to denying access
    return false
  } catch (error) {
    logger.error(
      { error, userEmail, contentId, context: 'checkAccessForContent' },
      'Error checking content access',
    )
    return false
  }
}
