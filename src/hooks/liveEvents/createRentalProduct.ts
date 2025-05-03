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
  req,
}) => {
  try {
    // Only proceed if rental is enabled
    if (!data.rentalEnabled) {
      return data
    }

    // Check if we have prices (either multi-currency or legacy)
    const hasPrices =
      (data.rentalPricesByCurrency && data.rentalPricesByCurrency.length > 0) ||
      data.rentalPrice > 0

    if (!hasPrices) {
      return data
    }

    // For create operation, or when rental is newly enabled, or when prices change
    const isRentalNew =
      operation === 'create' ||
      (originalDoc && !originalDoc.rentalEnabled) ||
      JSON.stringify(originalDoc?.rentalPricesByCurrency) !==
        JSON.stringify(data.rentalPricesByCurrency) ||
      (originalDoc && originalDoc.rentalPrice !== data.rentalPrice)

    if (isRentalNew) {
      // Create a Stripe product and price
      const result = await createStripeOneTimeProduct({
        name: `Rental: ${data.title} (${data.rentalDurationHours}h)`,
        description:
          data.description || `${data.rentalDurationHours}-hour rental access to ${data.title}`,
        price: data.rentalPrice, // Legacy price
        pricesByCurrency: data.rentalPricesByCurrency, // Multi-currency prices
        metadata: {
          type: 'rental',
          durationHours: data.rentalDurationHours.toString(),
          eventId: data.id || 'new',
        },
      })

      // Store the Stripe product and price IDs
      data.rentalStripeProductId = result.productId
      data.rentalStripePriceId = result.priceId

      // Update pricesByCurrency with Stripe price IDs
      if (result.pricesByCurrency && result.pricesByCurrency.length > 0) {
        data.rentalPricesByCurrency = result.pricesByCurrency
      }

      logger.info(
        {
          eventId: data.id || 'new',
          productId: result.productId,
          priceId: result.priceId,
          context: 'createRentalProduct',
        },
        'Created Stripe rental product',
      )
    }

    return data
  } catch (error) {
    logger.error(
      { error, eventId: data.id || 'new', context: 'createRentalProduct' },
      'Error creating rental product',
    )

    // Continue without creating the product
    // We don't want to block the save operation
    return data
  }
}
