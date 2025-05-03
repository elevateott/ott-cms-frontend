// src/collections/DigitalProducts/hooks/createStripeProduct.ts
import { CollectionAfterChangeHook } from 'payload/types'
import { logger } from '@/utils/logger'
import { getPaymentSettings } from '@/utilities/getPaymentSettings'

/**
 * Create a Stripe product and price when a digital product is created
 */
export const createStripeProduct: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  // Only run on create operation
  if (operation !== 'create') return doc

  try {
    // Skip if the product already has a Stripe product ID
    if (doc.stripeProductId && doc.stripePriceId) return doc

    // Get Stripe settings
    const settings = await getPaymentSettings()
    const { stripe: stripeSettings } = settings

    // Skip if Stripe is not enabled
    if (!stripeSettings.enabled) {
      logger.warn(
        { context: 'createStripeProduct', productId: doc.id },
        'Stripe is not enabled, skipping product creation'
      )
      return doc
    }

    // Initialize Stripe
    // Use dynamic import for ESM compatibility
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(
      stripeSettings.testMode ? stripeSettings.apiKey : stripeSettings.liveApiKey
    )

    // Create a Stripe product
    const product = await stripe.products.create({
      name: doc.name,
      description: doc.description || undefined,
      metadata: {
        productId: doc.id,
        type: 'digital-product',
      },
    })

    // Create a Stripe price
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(doc.price * 100), // Convert to cents
      currency: 'usd',
    })

    // Update the digital product with Stripe IDs
    const updatedDoc = await req.payload.update({
      collection: 'digital-products',
      id: doc.id,
      data: {
        stripeProductId: product.id,
        stripePriceId: price.id,
      },
    })

    logger.info(
      {
        context: 'createStripeProduct',
        productId: doc.id,
        stripeProductId: product.id,
        stripePriceId: price.id,
      },
      'Created Stripe product and price for digital product'
    )

    return updatedDoc
  } catch (error) {
    logger.error(
      { error, context: 'createStripeProduct', productId: doc.id },
      'Error creating Stripe product and price'
    )
    return doc
  }
}
