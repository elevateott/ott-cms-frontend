/**
 * Service to create a Stripe product and price for a one-time purchase (PPV)
 */
import { logger } from '@/utils/logger'
import { getPaymentSettings } from '@/utilities/getPaymentSettings'

interface CreateStripeOneTimeProductParams {
  name: string
  description?: string
  price: number // in cents
}

interface StripeOneTimeProductResult {
  productId: string
  priceId: string
}

/**
 * Create a Stripe product and price for a one-time purchase
 */
export const createStripeOneTimeProduct = async (
  params: CreateStripeOneTimeProductParams,
): Promise<StripeOneTimeProductResult> => {
  try {
    const { name, description, price } = params

    // Get Stripe settings
    const settings = await getPaymentSettings()
    const { stripe: stripeSettings } = settings

    // Check if Stripe is enabled
    if (!stripeSettings.enabled) {
      throw new Error('Stripe payments are not enabled')
    }

    // Initialize Stripe
    // Use dynamic import for ESM compatibility
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(
      stripeSettings.testMode ? stripeSettings.apiKey : stripeSettings.liveApiKey,
    )

    // Create a product
    const product = await stripe.products.create({
      name,
      description,
      metadata: {
        source: 'ott-cms',
        type: 'ppv',
      },
    })

    // Create a one-time price
    const priceObj = await stripe.prices.create({
      product: product.id,
      unit_amount: price,
      currency: 'usd',
      metadata: {
        source: 'ott-cms',
        type: 'ppv',
      },
    })

    return {
      productId: product.id,
      priceId: priceObj.id,
    }
  } catch (error) {
    logger.error({ error, context: 'createStripeOneTimeProduct' }, 'Error creating Stripe one-time product')
    throw error
  }
}
