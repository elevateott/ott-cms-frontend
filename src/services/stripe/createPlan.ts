/**
 * Service to create a Stripe product and price for a subscription plan
 */
import { logger } from '@/utils/logger'
import { getPaymentSettings } from '@/utilities/getPaymentSettings'

interface PriceByCurrency {
  currency: string
  amount: number
  stripePriceId?: string
}

interface CreateStripePlanParams {
  name: string
  description?: string
  price?: number // Legacy price in USD cents
  pricesByCurrency?: PriceByCurrency[] // New multi-currency prices
  interval: 'month' | 'quarter' | 'semi-annual' | 'year'
  trialDays?: number
  setupFeeAmount?: number
}

interface StripePlanResult {
  productId: string
  priceId: string // Legacy USD price ID
  pricesByCurrency?: PriceByCurrency[] // Updated with Stripe price IDs
  setupFeeId?: string
}

/**
 * Create a Stripe product and price for a subscription plan
 */
export const createStripePlan = async (
  params: CreateStripePlanParams,
): Promise<StripePlanResult> => {
  try {
    const { name, description, price, pricesByCurrency, interval, trialDays, setupFeeAmount } =
      params

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

    // Determine which currencies to create prices for
    let pricesToCreate: PriceByCurrency[] = []

    // If we have pricesByCurrency, use those
    if (pricesByCurrency && pricesByCurrency.length > 0) {
      pricesToCreate = [...pricesByCurrency]
    }
    // Otherwise, use the legacy price field (USD only)
    else if (price !== undefined) {
      pricesToCreate = [{ currency: 'usd', amount: price }]
    }
    // If neither is provided, throw an error
    else {
      throw new Error('Either price or pricesByCurrency must be provided')
    }

    // Get supported currencies from settings
    const supportedCurrencies = settings.currency.supportedCurrencies || ['usd']

    // Filter out unsupported currencies
    pricesToCreate = pricesToCreate.filter((p) => supportedCurrencies.includes(p.currency))

    // Ensure we have at least one price
    if (pricesToCreate.length === 0) {
      throw new Error('No valid prices provided')
    }

    // Create prices for each currency
    const updatedPrices: PriceByCurrency[] = []
    let usdPriceId: string | undefined

    for (const priceData of pricesToCreate) {
      // Create a price with trial period if specified
      const priceObj = await stripe.prices.create({
        product: product.id,
        unit_amount: priceData.amount,
        currency: priceData.currency,
        recurring: {
          interval: stripeInterval,
          interval_count: intervalCount,
          ...(trialDays && trialDays > 0 ? { trial_period_days: trialDays } : {}),
        },
        metadata: {
          source: 'ott-cms',
          currency: priceData.currency,
          ...(trialDays && trialDays > 0 ? { trial_days: trialDays.toString() } : {}),
          ...(setupFeeAmount && setupFeeAmount > 0 ? { setup_fee: setupFeeAmount.toString() } : {}),
        },
      })

      // Store the price ID
      updatedPrices.push({
        currency: priceData.currency,
        amount: priceData.amount,
        stripePriceId: priceObj.id,
      })

      // Store the USD price ID for backward compatibility
      if (priceData.currency === 'usd') {
        usdPriceId = priceObj.id
      }
    }

    // Create a setup fee price if needed (USD only for now)
    let setupFeeId: string | undefined
    if (setupFeeAmount && setupFeeAmount > 0) {
      const setupFeePrice = await stripe.prices.create({
        product: product.id,
        unit_amount: setupFeeAmount,
        currency: 'usd', // Setup fee is USD only for now
        metadata: {
          type: 'setup_fee',
          source: 'ott-cms',
        },
      })
      setupFeeId = setupFeePrice.id
    }

    return {
      productId: product.id,
      priceId: usdPriceId || '', // For backward compatibility
      pricesByCurrency: updatedPrices,
      setupFeeId,
    }
  } catch (error) {
    logger.error({ error, context: 'createStripePlan' }, 'Error creating Stripe plan')
    throw error
  }
}
