/**
 * Hook to create a Stripe product and price for a PPV live event
 */
import { CollectionBeforeChangeHook } from 'payload/types'
import { createStripeOneTimeProduct } from '@/services/stripe/createOneTimeProduct'
import { logger } from '@/utils/logger'

export const createPPVProduct: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  operation,
  req,
}) => {
  try {
    // Only proceed if PPV is enabled
    if (!data.ppvEnabled) {
      return data
    }

    // Check if we have prices (either multi-currency or legacy)
    const hasPrices =
      (data.ppvPricesByCurrency && data.ppvPricesByCurrency.length > 0) || data.ppvPrice > 0

    if (!hasPrices) {
      return data
    }

    // For create operation, or when PPV is newly enabled, or when prices change
    const isPPVNew =
      operation === 'create' ||
      (originalDoc && !originalDoc.ppvEnabled) ||
      JSON.stringify(originalDoc?.ppvPricesByCurrency) !==
        JSON.stringify(data.ppvPricesByCurrency) ||
      (originalDoc && originalDoc.ppvPrice !== data.ppvPrice)

    if (isPPVNew) {
      // Create a Stripe product and price
      const result = await createStripeOneTimeProduct({
        name: `PPV: ${data.title}`,
        description: data.description || `Pay-per-view access to ${data.title}`,
        price: data.ppvPrice, // Legacy price
        pricesByCurrency: data.ppvPricesByCurrency, // Multi-currency prices
        metadata: {
          type: 'ppv',
          eventId: data.id || 'new',
        },
      })

      // Store the Stripe product and price IDs
      data.ppvStripeProductId = result.productId
      data.ppvStripePriceId = result.priceId

      // Update pricesByCurrency with Stripe price IDs
      if (result.pricesByCurrency && result.pricesByCurrency.length > 0) {
        data.ppvPricesByCurrency = result.pricesByCurrency
      }

      logger.info(
        {
          eventId: data.id || 'new',
          productId: result.productId,
          priceId: result.priceId,
          context: 'createPPVProduct',
        },
        'Created Stripe PPV product',
      )
    }

    return data
  } catch (error) {
    logger.error(
      { error, eventId: data.id || 'new', context: 'createPPVProduct' },
      'Error creating PPV product',
    )

    // Continue without creating the product
    // We don't want to block the save operation
    return data
  }
}
