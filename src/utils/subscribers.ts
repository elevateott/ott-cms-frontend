/**
 * Utility functions for managing subscribers
 */
import { Payload } from 'payload'
import { logger } from '@/utils/logger'
import crypto from 'crypto'

/**
 * Generate a subscriber token
 * @returns A random token string
 */
export const generateSubscriberToken = (): string => {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Find a subscriber by user ID
 * @param payload Payload instance
 * @param userId User ID to find subscriber for
 * @returns The subscriber record or null if not found
 */
export const findSubscriberByUserId = async (payload: Payload, userId: string) => {
  try {
    // Get the user
    const user = await payload.findByID({
      collection: 'users',
      id: userId,
    })

    if (!user || !user.email) {
      return null
    }

    // Find subscriber by email
    const subscriberResult = await payload.find({
      collection: 'subscribers',
      where: {
        email: {
          equals: user.email,
        },
      },
      limit: 1,
    })

    if (subscriberResult.docs.length === 0) {
      return null
    }

    return subscriberResult.docs[0]
  } catch (error) {
    logger.error(
      { error, userId, context: 'findSubscriberByUserId' },
      'Error finding subscriber by user ID',
    )
    return null
  }
}

/**
 * Find a subscriber by email
 * @param payload Payload instance
 * @param email Email to find subscriber for
 * @returns The subscriber record or null if not found
 */
export const findSubscriberByEmail = async (payload: Payload, email: string) => {
  try {
    // Find subscriber by email
    const subscriberResult = await payload.find({
      collection: 'subscribers',
      where: {
        email: {
          equals: email,
        },
      },
      limit: 1,
    })

    if (subscriberResult.docs.length === 0) {
      return null
    }

    return subscriberResult.docs[0]
  } catch (error) {
    logger.error(
      { error, email, context: 'findSubscriberByEmail' },
      'Error finding subscriber by email',
    )
    return null
  }
}

/**
 * Find or create a subscriber record
 * @param payload Payload instance
 * @param email Subscriber email
 * @param fullName Subscriber full name
 * @param paymentProvider Payment provider (stripe or paypal)
 * @param customerId Customer ID from payment provider
 * @returns The subscriber record
 */
export const findOrCreateSubscriber = async (
  payload: Payload,
  email: string,
  fullName: string,
  paymentProvider: 'stripe' | 'paypal',
  customerId: string,
) => {
  try {
    // Check if subscriber already exists
    const existingResult = await payload.find({
      collection: 'subscribers',
      where: {
        email: {
          equals: email,
        },
      },
      limit: 1,
    })

    if (existingResult.docs.length > 0) {
      // Update existing subscriber
      const subscriber = await payload.update({
        collection: 'subscribers',
        id: existingResult.docs[0].id,
        data: {
          fullName,
          paymentProvider,
          paymentProviderCustomerId: customerId,
        },
      })
      return subscriber
    } else {
      // Create new subscriber with a token
      const subscriberToken = generateSubscriberToken()

      const subscriber = await payload.create({
        collection: 'subscribers',
        data: {
          email,
          fullName,
          paymentProvider,
          paymentProviderCustomerId: customerId,
          subscriberToken,
        },
      })
      return subscriber
    }
  } catch (error) {
    logger.error(
      { error, context: 'findOrCreateSubscriber' },
      'Error finding or creating subscriber',
    )
    throw error
  }
}

/**
 * Update a subscriber's subscription status
 * @param payload Payload instance
 * @param customerId Customer ID from payment provider
 * @param status New subscription status
 * @param expiresAt When the subscription expires (optional)
 * @param planIds Array of subscription plan IDs (optional)
 */
export const updateSubscriptionStatus = async (
  payload: Payload,
  customerId: string,
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'none',
  expiresAt?: Date,
  planIds?: string[],
) => {
  try {
    // Find subscriber by customer ID
    const subscriberResult = await payload.find({
      collection: 'subscribers',
      where: {
        paymentProviderCustomerId: {
          equals: customerId,
        },
      },
      limit: 1,
    })

    if (subscriberResult.docs.length === 0) {
      logger.warn(
        { customerId, context: 'updateSubscriptionStatus' },
        'No subscriber found with the provided customer ID',
      )
      return null
    }

    // Update subscription status
    const updateData: Record<string, any> = {
      subscriptionStatus: status,
    }

    // Add expiration date if provided
    if (expiresAt) {
      updateData.subscriptionExpiresAt = expiresAt.toISOString()
    }

    // Add plan IDs if provided
    if (planIds && planIds.length > 0) {
      updateData.activePlans = planIds
    }

    // Update the subscriber
    const updatedSubscriber = await payload.update({
      collection: 'subscribers',
      id: subscriberResult.docs[0].id,
      data: updateData,
    })

    return updatedSubscriber
  } catch (error) {
    logger.error(
      { error, customerId, context: 'updateSubscriptionStatus' },
      'Error updating subscription status',
    )
    throw error
  }
}

/**
 * Add a rental to a subscriber
 * @param payload Payload instance
 * @param subscriberId Subscriber ID
 * @param contentId Content ID being rented
 * @param expiresAt When the rental expires
 */
export const addRentalToSubscriber = async (
  payload: Payload,
  subscriberId: string,
  contentId: string,
  expiresAt: Date,
) => {
  try {
    // Get current subscriber data
    const subscriber = await payload.findByID({
      collection: 'subscribers',
      id: subscriberId,
    })

    // Prepare rental expirations array
    const rentalExpirations = [...(subscriber.rentalExpirations || [])]

    // Add or update rental expiration
    const existingIndex = rentalExpirations.findIndex((rental) => rental.contentId === contentId)

    if (existingIndex >= 0) {
      // Update existing rental
      rentalExpirations[existingIndex].expiresAt = expiresAt.toISOString()
    } else {
      // Add new rental
      rentalExpirations.push({
        contentId,
        expiresAt: expiresAt.toISOString(),
      })
    }

    // Update purchasedRentals array
    let purchasedRentals = [...(subscriber.purchasedRentals || [])]
    if (!purchasedRentals.includes(contentId)) {
      purchasedRentals.push(contentId)
    }

    // Update the subscriber
    const updatedSubscriber = await payload.update({
      collection: 'subscribers',
      id: subscriberId,
      data: {
        rentalExpirations,
        purchasedRentals,
      },
    })

    return updatedSubscriber
  } catch (error) {
    logger.error(
      { error, subscriberId, contentId, context: 'addRentalToSubscriber' },
      'Error adding rental to subscriber',
    )
    throw error
  }
}

/**
 * Add a PPV event to a subscriber
 * @param payload Payload instance
 * @param subscriberId Subscriber ID
 * @param eventId Live event ID being purchased
 */
export const addPPVToSubscriber = async (
  payload: Payload,
  subscriberId: string,
  eventId: string,
) => {
  try {
    // Get current subscriber data
    const subscriber = await payload.findByID({
      collection: 'subscribers',
      id: subscriberId,
    })

    // Update purchasedPPV array
    let purchasedPPV = [...(subscriber.purchasedPPV || [])]
    if (!purchasedPPV.includes(eventId)) {
      purchasedPPV.push(eventId)
    }

    // Update the subscriber
    const updatedSubscriber = await payload.update({
      collection: 'subscribers',
      id: subscriberId,
      data: {
        purchasedPPV,
      },
    })

    return updatedSubscriber
  } catch (error) {
    logger.error(
      { error, subscriberId, eventId, context: 'addPPVToSubscriber' },
      'Error adding PPV event to subscriber',
    )
    throw error
  }
}

/**
 * Check if a subscriber has access to content
 * @param payload Payload instance
 * @param subscriberId Subscriber ID
 * @param contentId Content ID to check access for
 * @returns Boolean indicating whether the subscriber has access
 */
export const hasContentAccess = async (
  payload: Payload,
  subscriberId: string,
  contentId: string,
) => {
  try {
    // Get subscriber data
    const subscriber = await payload.findByID({
      collection: 'subscribers',
      id: subscriberId,
    })

    // Check if subscriber has an active subscription
    if (
      subscriber.subscriptionStatus === 'active' ||
      subscriber.subscriptionStatus === 'trialing'
    ) {
      return true
    }

    // Check if content is in purchasedRentals
    if (subscriber.purchasedRentals && subscriber.purchasedRentals.includes(contentId)) {
      // Check if rental is still valid
      if (subscriber.rentalExpirations) {
        const rental = subscriber.rentalExpirations.find((r) => r.contentId === contentId)

        if (rental && new Date(rental.expiresAt) > new Date()) {
          return true
        }
      }
    }

    return false
  } catch (error) {
    logger.error(
      { error, subscriberId, contentId, context: 'hasContentAccess' },
      'Error checking content access',
    )
    return false
  }
}

/**
 * Check if a subscriber has access to a live event
 * @param payload Payload instance
 * @param subscriberId Subscriber ID
 * @param eventId Live event ID to check access for
 * @returns Boolean indicating whether the subscriber has access
 */
/**
 * Add an event rental to a subscriber
 * @param payload Payload instance
 * @param subscriberId Subscriber ID
 * @param eventId Live event ID being rented
 * @param durationHours Duration of the rental in hours
 */
export const addEventRentalToSubscriber = async (
  payload: Payload,
  subscriberId: string,
  eventId: string,
  durationHours: number,
) => {
  try {
    // Get current subscriber data
    const subscriber = await payload.findByID({
      collection: 'subscribers',
      id: subscriberId,
    })

    // Calculate expiration date
    const purchasedAt = new Date()
    const expiresAt = new Date(purchasedAt)
    expiresAt.setHours(expiresAt.getHours() + durationHours)

    // Prepare rental expirations array
    const eventRentalExpirations = [...(subscriber.eventRentalExpirations || [])]

    // Add or update rental expiration
    const existingIndex = eventRentalExpirations.findIndex((rental) => rental.eventId === eventId)

    if (existingIndex >= 0) {
      // Update existing rental
      eventRentalExpirations[existingIndex].purchasedAt = purchasedAt.toISOString()
      eventRentalExpirations[existingIndex].expiresAt = expiresAt.toISOString()
    } else {
      // Add new rental
      eventRentalExpirations.push({
        eventId,
        purchasedAt: purchasedAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
      })
    }

    // Update purchasedEventRentals array
    let purchasedEventRentals = [...(subscriber.purchasedEventRentals || [])]
    if (!purchasedEventRentals.includes(eventId)) {
      purchasedEventRentals.push(eventId)
    }

    // Update the subscriber
    const updatedSubscriber = await payload.update({
      collection: 'subscribers',
      id: subscriberId,
      data: {
        eventRentalExpirations,
        purchasedEventRentals,
      },
    })

    return updatedSubscriber
  } catch (error) {
    logger.error(
      { error, subscriberId, eventId, context: 'addEventRentalToSubscriber' },
      'Error adding event rental to subscriber',
    )
    throw error
  }
}

export const hasEventAccess = async (payload: Payload, subscriberId: string, eventId: string) => {
  try {
    // Get subscriber data
    const subscriber = await payload.findByID({
      collection: 'subscribers',
      id: subscriberId,
    })

    // Get event data
    const event = await payload.findByID({
      collection: 'live-events',
      id: eventId,
    })

    // If event is free, everyone has access
    if (event.accessType === 'free') {
      return true
    }

    // If event requires subscription, check subscription status
    if (event.accessType === 'subscription') {
      return (
        subscriber.subscriptionStatus === 'active' || subscriber.subscriptionStatus === 'trialing'
      )
    }

    // If event requires ticket, check if in purchasedPPV
    if (event.accessType === 'paid_ticket') {
      return subscriber.purchasedPPV && subscriber.purchasedPPV.includes(eventId)
    }

    // Check if event is in purchasedEventRentals and rental is still valid
    if (
      event.rentalEnabled &&
      subscriber.purchasedEventRentals &&
      subscriber.purchasedEventRentals.includes(eventId)
    ) {
      // Check if rental is still valid
      if (subscriber.eventRentalExpirations) {
        const rental = subscriber.eventRentalExpirations.find((r) => r.eventId === eventId)

        if (rental && new Date(rental.expiresAt) > new Date()) {
          return true
        }
      }
    }

    // Check if event is PPV and user has purchased it
    if (event.ppvEnabled && subscriber.purchasedPPV && subscriber.purchasedPPV.includes(eventId)) {
      return true
    }

    return false
  } catch (error) {
    logger.error(
      { error, subscriberId, eventId, context: 'hasEventAccess' },
      'Error checking event access',
    )
    return false
  }
}
