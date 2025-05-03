/**
 * Service to create a PayPal plan for a subscription
 */
import { logger } from '@/utils/logger'
import { getPaymentSettings } from '@/utilities/getPaymentSettings'
import { getPayPalAccessToken, getPayPalBaseURL } from '@/utilities/paypal'

interface CreatePayPalPlanParams {
  name: string
  description?: string
  price: number // in cents
  interval: 'month' | 'quarter' | 'semi-annual' | 'year'
  trialDays?: number
  setupFeeAmount?: number
}

interface PayPalPlanResult {
  planId: string
  productId: string
}

/**
 * Create a PayPal plan for a subscription
 */
export const createPayPalPlan = async (params: CreatePayPalPlanParams): Promise<PayPalPlanResult | null> => {
  try {
    const { name, description, price, interval, trialDays, setupFeeAmount } = params

    // Get PayPal settings
    const settings = await getPaymentSettings()
    const { paypal: paypalSettings } = settings

    // Check if PayPal is enabled
    if (!paypalSettings.enabled) {
      logger.warn(
        { context: 'createPayPalPlan' },
        'PayPal payments are not enabled, skipping plan creation'
      )
      return null
    }

    // Check if PayPal is connected
    if (!paypalSettings.connected) {
      logger.warn(
        { context: 'createPayPalPlan' },
        'PayPal is not connected, skipping plan creation'
      )
      return null
    }

    // Get access token
    const accessToken = await getPayPalAccessToken(
      paypalSettings.clientId,
      paypalSettings.clientSecret,
      paypalSettings.environment
    )

    // Get base URL
    const baseURL = getPayPalBaseURL(paypalSettings.environment)

    // Map interval to PayPal's format
    let paypalInterval: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR' = 'MONTH'
    let intervalCount = 1

    switch (interval) {
      case 'month':
        paypalInterval = 'MONTH'
        intervalCount = 1
        break
      case 'quarter':
        paypalInterval = 'MONTH'
        intervalCount = 3
        break
      case 'semi-annual':
        paypalInterval = 'MONTH'
        intervalCount = 6
        break
      case 'year':
        paypalInterval = 'YEAR'
        intervalCount = 1
        break
    }

    // Create a product
    const productResponse = await fetch(`${baseURL}/v1/catalogs/products`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        description: description || name,
        type: 'SERVICE',
        category: 'DIGITAL_MEDIA_SUBSCRIPTIONS',
      }),
    })

    if (!productResponse.ok) {
      const errorData = await productResponse.json()
      throw new Error(`Failed to create PayPal product: ${JSON.stringify(errorData)}`)
    }

    const product = await productResponse.json()

    // Format price for PayPal (convert cents to dollars)
    const formattedPrice = (price / 100).toFixed(2)

    // Create a billing plan
    const planData: any = {
      product_id: product.id,
      name: `${name} Plan`,
      description: description || `Subscription plan for ${name}`,
      status: 'ACTIVE',
      billing_cycles: [
        {
          frequency: {
            interval_unit: paypalInterval,
            interval_count: intervalCount,
          },
          tenure_type: 'REGULAR',
          sequence: 1,
          total_cycles: 0, // Infinite
          pricing_scheme: {
            fixed_price: {
              value: formattedPrice,
              currency_code: 'USD',
            },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee: setupFeeAmount
          ? {
              value: (setupFeeAmount / 100).toFixed(2),
              currency_code: 'USD',
            }
          : undefined,
        payment_failure_threshold: 3,
      },
    }

    // Add trial period if specified
    if (trialDays && trialDays > 0) {
      planData.billing_cycles.unshift({
        frequency: {
          interval_unit: 'DAY',
          interval_count: trialDays,
        },
        tenure_type: 'TRIAL',
        sequence: 0,
        total_cycles: 1,
        pricing_scheme: {
          fixed_price: {
            value: '0',
            currency_code: 'USD',
          },
        },
      })
    }

    const planResponse = await fetch(`${baseURL}/v1/billing/plans`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': `plan-${Date.now()}`,
      },
      body: JSON.stringify(planData),
    })

    if (!planResponse.ok) {
      const errorData = await planResponse.json()
      throw new Error(`Failed to create PayPal plan: ${JSON.stringify(errorData)}`)
    }

    const plan = await planResponse.json()

    return {
      planId: plan.id,
      productId: product.id,
    }
  } catch (error) {
    logger.error(
      { error, context: 'createPayPalPlan' },
      'Error creating PayPal plan'
    )
    // Return null instead of throwing to allow Stripe-only plans
    return null
  }
}
