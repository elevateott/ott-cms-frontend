/**
 * Service to check if a subscription plan has any subscribers
 */
import { Payload } from 'payload'
import { logger } from '@/utils/logger'

/**
 * Check if a subscription plan has any subscribers
 * @param payload Payload instance
 * @param planId Subscription plan ID
 * @returns Boolean indicating whether the plan has subscribers
 */
export const hasPlanSubscribers = async (payload: Payload, planId: string): Promise<boolean> => {
  try {
    // Find subscribers with this plan
    const subscribers = await payload.find({
      collection: 'subscribers',
      where: {
        activePlans: {
          contains: planId,
        },
      },
      limit: 1, // We only need to know if there's at least one
    })

    return subscribers.docs.length > 0
  } catch (error) {
    logger.error(
      { error, context: 'hasPlanSubscribers', planId },
      'Error checking if plan has subscribers'
    )
    // Default to true to prevent accidental edits
    return true
  }
}
