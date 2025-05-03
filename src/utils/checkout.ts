/**
 * Utility functions for handling checkout and payment processing
 */
import { Payload } from 'payload'
import { logger } from '@/utils/logger'
import { findOrCreateSubscriber } from './subscribers'

/**
 * Process a successful checkout and create/update subscriber record
 * @param payload Payload instance
 * @param checkoutData Checkout data from payment provider
 * @returns The created or updated subscriber
 */
export const processSuccessfulCheckout = async (
  payload: Payload,
  checkoutData: {
    email: string
    fullName: string
    paymentProvider: 'stripe' | 'paypal'
    customerId: string
    subscriptionId?: string
    planId?: string
    isSubscription: boolean
    contentId?: string // For rentals
    rentalDurationHours?: number // For rentals
    eventId?: string // For PPV events
  }
) => {
  try {
    const {
      email,
      fullName,
      paymentProvider,
      customerId,
      subscriptionId,
      planId,
      isSubscription,
      contentId,
      rentalDurationHours,
      eventId,
    } = checkoutData

    // Find or create subscriber
    const subscriber = await findOrCreateSubscriber(
      payload,
      email,
      fullName,
      paymentProvider,
      customerId
    )

    // If this is a subscription purchase
    if (isSubscription && planId) {
      // Update subscription status to active
      const expiresAt = new Date()
      expiresAt.setMonth(expiresAt.getMonth() + 1) // Default to 1 month from now

      await payload.update({
        collection: 'subscribers',
        id: subscriber.id,
        data: {
          subscriptionStatus: 'active',
          subscriptionExpiresAt: expiresAt.toISOString(),
          activePlans: [planId],
        },
      })
    }

    // If this is a rental purchase
    if (contentId && rentalDurationHours) {
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + rentalDurationHours)

      // Get current rentals
      const currentRentals = subscriber.purchasedRentals || []
      const currentExpirations = subscriber.rentalExpirations || []

      // Add or update rental
      if (!currentRentals.includes(contentId)) {
        currentRentals.push(contentId)
      }

      // Find existing expiration entry
      const existingExpIndex = currentExpirations.findIndex(
        (exp) => exp.contentId === contentId
      )

      if (existingExpIndex >= 0) {
        // Update existing expiration
        currentExpirations[existingExpIndex].expiresAt = expiresAt.toISOString()
      } else {
        // Add new expiration
        currentExpirations.push({
          contentId,
          expiresAt: expiresAt.toISOString(),
        })
      }

      // Update subscriber
      await payload.update({
        collection: 'subscribers',
        id: subscriber.id,
        data: {
          purchasedRentals: currentRentals,
          rentalExpirations: currentExpirations,
        },
      })
    }

    // If this is a PPV event purchase
    if (eventId) {
      // Get current PPV events
      const currentPPV = subscriber.purchasedPPV || []

      // Add event if not already purchased
      if (!currentPPV.includes(eventId)) {
        currentPPV.push(eventId)

        // Update subscriber
        await payload.update({
          collection: 'subscribers',
          id: subscriber.id,
          data: {
            purchasedPPV: currentPPV,
          },
        })
      }
    }

    // Return the updated subscriber
    return await payload.findByID({
      collection: 'subscribers',
      id: subscriber.id,
    })
  } catch (error) {
    logger.error(
      { error, context: 'processSuccessfulCheckout' },
      'Error processing successful checkout'
    )
    throw error
  }
}
