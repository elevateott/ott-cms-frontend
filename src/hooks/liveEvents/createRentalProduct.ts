/**
 * Hook to create a Stripe product and price for a rental live event
 */
import { CollectionBeforeChangeHook } from 'payload/types'
import { createStripeOneTimeProduct } from '@/services/stripe/createOneTimeProduct'
import { logger } from '@/utils/logger'

export const createRentalProduct: CollectionBeforeChangeHook = async ({ 
  data, 
  originalDoc, 
  operation, 
  req 
}) => {
  try {
    // Only proceed if rental is enabled and we have a price
    if (!data.rentalEnabled || !data.rentalPrice) {
      return data
    }

    // For create operation, or when rental is newly enabled, or when price changes
    const isRentalNew = operation === 'create' || 
      (originalDoc && !originalDoc.rentalEnabled) || 
      (originalDoc && originalDoc.rentalPrice !== data.rentalPrice)

    if (isRentalNew) {
      // Create a Stripe product and price
      const result = await createStripeOneTimeProduct({
        name: `Rental: ${data.title} (${data.rentalDurationHours}h)`,
        description: data.description || `${data.rentalDurationHours}-hour rental access to ${data.title}`,
        price: data.rentalPrice,
        metadata: {
          type: 'rental',
          durationHours: data.rentalDurationHours.toString(),
        }
      })

      // Store the Stripe product and price IDs
      data.rentalStripeProductId = result.productId
      data.rentalStripePriceId = result.priceId

      logger.info(
        { 
          eventId: data.id || 'new', 
          productId: result.productId, 
          priceId: result.priceId,
          context: 'createRentalProduct' 
        }, 
        'Created Stripe rental product'
      )
    }

    return data
  } catch (error) {
    logger.error(
      { error, eventId: data.id || 'new', context: 'createRentalProduct' },
      'Error creating rental product'
    )
    
    // Continue without creating the product
    // We don't want to block the save operation
    return data
  }
}
