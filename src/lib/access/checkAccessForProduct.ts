/**
 * Utility to check if a user has access to a digital product
 *
 * This function determines whether a user has purchased a given digital product
 */
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import { logger } from '@/utils/logger'

export interface CheckProductAccessParams {
  userEmail: string
  productId: string
}

/**
 * Check if a user has access to a digital product
 *
 * @param userEmail - The email of the user to check access for
 * @param productId - The ID of the digital product to check access for
 * @returns A boolean indicating whether the user has access to the product
 */
export async function checkAccessForProduct({
  userEmail,
  productId,
}: CheckProductAccessParams): Promise<boolean> {
  if (!userEmail || !productId) return false

  try {
    // Get Payload instance
    const payload = await getPayloadHMR({ config: configPromise })

    // Fetch subscriber data
    const subscriberResult = await payload.find({
      collection: 'subscribers',
      where: { email: { equals: userEmail } },
    })

    // If subscriber not found, deny access
    if (!subscriberResult.docs.length) return false

    const subscriber = subscriberResult.docs[0]

    // Check for manual subscription override (grants access to everything)
    if (subscriber.hasManualSubscription) {
      logger.info(
        { userEmail, productId, context: 'checkAccessForProduct' },
        'Granting access due to manual subscription override',
      )
      return true
    }

    // Check if the product is in the purchasedProducts array
    const hasPurchased = subscriber.purchasedProducts?.includes(productId) || false

    return hasPurchased
  } catch (error) {
    logger.error(
      { error, userEmail, productId, context: 'checkAccessForProduct' },
      'Error checking product access',
    )
    return false
  }
}
