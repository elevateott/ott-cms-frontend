// src/collections/AddOns/hooks/createStripeProduct.ts
import { CollectionAfterChangeHook } from 'payload/types'
import { logger } from '@/utils/logger'
import { getPaymentSettings } from '@/utilities/getPaymentSettings'
import { createStripeOneTimeProduct } from '@/services/stripe/createOneTimeProduct'
import { createStripePlan } from '@/services/stripe/createPlan'

/**
 * Create a Stripe product and price when an add-on is created
 */
export const createStripeProduct: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  // Only run on create operation
  if (operation !== 'create') return doc

  try {
    // Skip if the add-on already has a Stripe product ID
    if (doc.stripeProductId && doc.stripePriceId) return doc

    // Get Stripe settings
    const settings = await getPaymentSettings()
    const { stripe: stripeSettings } = settings

    // Skip if Stripe is not enabled
    if (!stripeSettings.enabled) {
      logger.warn(
        { context: 'createStripeProduct', addonId: doc.id },
        'Stripe is not enabled, skipping product creation'
      )
      return doc
    }

    // Create Stripe product and price based on add-on type
    if (doc.type === 'one-time') {
      // Create a one-time product
      const result = await createStripeOneTimeProduct({
        name: doc.title,
        description: doc.description || undefined,
        pricesByCurrency: doc.pricesByCurrency,
        metadata: {
          type: 'addon',
          addonId: doc.id,
          addonType: 'one-time',
        },
      })

      // Update the add-on with Stripe IDs
      const updatedDoc = await req.payload.update({
        collection: 'addons',
        id: doc.id,
        data: {
          stripeProductId: result.productId,
          stripePriceId: result.priceId,
          pricesByCurrency: result.pricesByCurrency,
        },
      })

      logger.info(
        {
          context: 'createStripeProduct',
          addonId: doc.id,
          stripeProductId: result.productId,
          stripePriceId: result.priceId,
        },
        'Created Stripe one-time product for add-on'
      )

      return updatedDoc
    } else if (doc.type === 'recurring') {
      // Create a recurring subscription product
      const result = await createStripePlan({
        name: doc.title,
        description: doc.description || undefined,
        pricesByCurrency: doc.pricesByCurrency,
        interval: 'month', // Add-ons are monthly only for simplicity
        metadata: {
          type: 'addon',
          addonId: doc.id,
          addonType: 'recurring',
        },
      })

      // Update the add-on with Stripe IDs
      const updatedDoc = await req.payload.update({
        collection: 'addons',
        id: doc.id,
        data: {
          stripeProductId: result.productId,
          stripePriceId: result.priceId,
          pricesByCurrency: result.pricesByCurrency,
        },
      })

      logger.info(
        {
          context: 'createStripeProduct',
          addonId: doc.id,
          stripeProductId: result.productId,
          stripePriceId: result.priceId,
        },
        'Created Stripe recurring product for add-on'
      )

      return updatedDoc
    }

    return doc
  } catch (error) {
    logger.error(
      { error, context: 'createStripeProduct', addonId: doc.id },
      'Error creating Stripe product and price'
    )
    return doc
  }
}
