/**
 * PayPal Utilities
 * 
 * This file provides utility functions for working with PayPal.
 */

import { logger } from '@/utils/logger'
import { getPaymentSettings } from './getPaymentSettings'

/**
 * Get PayPal access token using client credentials
 */
export const getPayPalAccessToken = async (
  clientId?: string,
  clientSecret?: string,
  environment?: 'sandbox' | 'live'
): Promise<string> => {
  try {
    // If credentials are not provided, get them from settings
    if (!clientId || !clientSecret || !environment) {
      const settings = await getPaymentSettings()
      clientId = settings.paypal.clientId
      clientSecret = settings.paypal.clientSecret
      environment = settings.paypal.environment
    }

    if (!clientId || !clientSecret) {
      throw new Error('PayPal credentials are not configured')
    }

    // Determine the base URL based on environment
    const baseURL = environment === 'sandbox'
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.paypal.com'

    // Get OAuth token
    const tokenResponse = await fetch(`${baseURL}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en_US',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: 'grant_type=client_credentials',
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok || !tokenData.access_token) {
      logger.error({ tokenData }, 'PayPal authentication failed')
      throw new Error('Failed to get PayPal access token')
    }

    return tokenData.access_token
  } catch (error) {
    logger.error(error, 'Failed to get PayPal access token')
    throw error
  }
}

/**
 * Get PayPal API base URL based on environment
 */
export const getPayPalBaseURL = (environment: 'sandbox' | 'live'): string => {
  return environment === 'sandbox'
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com'
}

/**
 * Get PayPal client ID for frontend integration
 */
export const getPayPalClientID = async (): Promise<string> => {
  const settings = await getPaymentSettings()
  
  if (!settings.paypal.clientId) {
    throw new Error('PayPal Client ID is not configured')
  }
  
  return settings.paypal.clientId
}
