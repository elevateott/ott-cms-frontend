/**
 * Service to create a Stripe product and price for a subscription plan
 */
import { logger } from '@/utils/logger'
import { getPaymentSettings } from '@/utilities/getPaymentSettings'

interface CreateStripePlanParams {
  name: string
  description?: string
  price: number // in cents
  interval: 'month' | 'quarter' | 'semi-annual' | 'year'
  trialDays?: number
  setupFeeAmount?: number
}

interface StripePlanResult {
  productId: string
  priceId: string
  setupFeeId?: string
}

/**
 * Create a Stripe product and price for a subscription plan
 */
export const createStripePlan = async (params: CreateStripePlanParams): Promise<StripePlanResult> => {
  try {
    const { name, description, price, interval, trialDays, setupFeeAmount } = params

    // Get Stripe settings
    const settings = await getPaymentSettings()
    const { stripe: stripeSettings } = settings

    // Check if Stripe is enabled
    if (!stripeSettings.enabled) {
      throw new Error('Stripe payments are not enabled')
    }

    // Initialize Stripe
    const stripe = require('stripe')(
      stripeSettings.testMode ? stripeSettings.apiKey : stripeSettings.liveApiKey
    )

    // Create a product
    const product = await stripe.products.create({
      name,
      description,
      metadata: {
        source: 'ott-cms',
      },
    })

    // Map interval to Stripe's format
    let stripeInterval: 'day' | 'week' | 'month' | 'year' = 'month'
    let intervalCount = 1

    switch (interval) {
      case 'month':
        stripeInterval = 'month'
        intervalCount = 1
        break
      case 'quarter':
        stripeInterval = 'month'
        intervalCount = 3
        break
      case 'semi-annual':
        stripeInterval = 'month'
        intervalCount = 6
        break
      case 'year':
        stripeInterval = 'year'
        intervalCount = 1
        break
    }

    // Create a price
    const priceObj = await stripe.prices.create({
      product: product.id,
      unit_amount: price,
      currency: 'usd',
      recurring: {
        interval: stripeInterval,
        interval_count: intervalCount,
      },
      metadata: {
        source: 'ott-cms',
      },
    })

    // Create a setup fee price if needed
    let setupFeeId: string | undefined
    if (setupFeeAmount && setupFeeAmount > 0) {
      const setupFeePrice = await stripe.prices.create({
        product: product.id,
        unit_amount: setupFeeAmount,
        currency: 'usd',
        metadata: {
          type: 'setup_fee',
          source: 'ott-cms',
        },
      })
      setupFeeId = setupFeePrice.id
    }

    return {
      productId: product.id,
      priceId: priceObj.id,
      setupFeeId,
    }
  } catch (error) {
    logger.error(
      { error, context: 'createStripePlan' },
      'Error creating Stripe plan'
    )
    throw error
  }
}
