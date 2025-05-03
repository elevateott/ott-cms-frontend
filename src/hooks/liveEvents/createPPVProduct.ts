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
  req 
}) => {
  try {
    // Only proceed if PPV is enabled and we have a price
    if (!data.ppvEnabled || !data.ppvPrice) {
      return data
    }

    // For create operation, or when PPV is newly enabled, or when price changes
    const isPPVNew = operation === 'create' || 
      (originalDoc && !originalDoc.ppvEnabled) || 
      (originalDoc && originalDoc.ppvPrice !== data.ppvPrice)

    if (isPPVNew) {
      // Create a Stripe product and price
      const result = await createStripeOneTimeProduct({
        name: `PPV: ${data.title}`,
        description: data.description || `Pay-per-view access to ${data.title}`,
        price: data.ppvPrice,
      })

      // Store the Stripe product and price IDs
      data.ppvStripeProductId = result.productId
      data.ppvStripePriceId = result.priceId

      logger.info(
        { 
          eventId: data.id || 'new', 
          productId: result.productId, 
          priceId: result.priceId,
          context: 'createPPVProduct' 
        }, 
        'Created Stripe PPV product'
      )
    }

    return data
  } catch (error) {
    logger.error(
      { error, eventId: data.id || 'new', context: 'createPPVProduct' },
      'Error creating PPV product'
    )
    
    // Continue without creating the product
    // We don't want to block the save operation
    return data
  }
}
