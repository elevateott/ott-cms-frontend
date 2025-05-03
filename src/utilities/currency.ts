/**
 * Utility functions for currency handling
 */
import { getPaymentSettings } from './getPaymentSettings'

/**
 * Format a price in the specified currency
 * 
 * @param amount - Amount in cents (e.g., 1000 = $10.00)
 * @param currency - Currency code (e.g., 'usd', 'eur')
 * @returns Formatted price string
 */
export function formatPrice(amount: number, currency: string = 'usd'): string {
  if (amount === undefined || amount === null) {
    return 'N/A'
  }
  
  // Convert from cents to dollars/euros/etc.
  const value = amount / 100
  
  // Format based on currency
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(value)
}

/**
 * Detect user's currency based on browser locale
 * Falls back to default currency if detection fails
 * 
 * @returns Currency code (e.g., 'usd', 'eur')
 */
export async function detectUserCurrency(): Promise<string> {
  try {
    // Get payment settings
    const settings = await getPaymentSettings()
    
    // If currency detection is disabled, return default currency
    if (!settings.currency.detectUserCurrency) {
      return settings.currency.defaultCurrency
    }
    
    // Try to detect currency from browser locale
    const locale = navigator.language || 'en-US'
    
    // Map of common locales to currencies
    const localeToCurrency: Record<string, string> = {
      'en-US': 'usd',
      'en-GB': 'gbp',
      'en-CA': 'cad',
      'en-AU': 'aud',
      'fr-FR': 'eur',
      'de-DE': 'eur',
      'es-ES': 'eur',
      'it-IT': 'eur',
      'ja-JP': 'jpy',
    }
    
    // Get currency from locale or fallback to region
    let detectedCurrency = localeToCurrency[locale]
    
    if (!detectedCurrency) {
      // Try to match by region code
      const region = locale.split('-')[1]
      if (region === 'US') detectedCurrency = 'usd'
      else if (['GB'].includes(region)) detectedCurrency = 'gbp'
      else if (['CA'].includes(region)) detectedCurrency = 'cad'
      else if (['AU'].includes(region)) detectedCurrency = 'aud'
      else if (['FR', 'DE', 'ES', 'IT', 'NL', 'BE', 'AT', 'IE', 'PT', 'FI', 'LU', 'GR'].includes(region)) {
        detectedCurrency = 'eur'
      } else if (['JP'].includes(region)) detectedCurrency = 'jpy'
    }
    
    // Check if detected currency is supported, otherwise use default
    if (detectedCurrency && settings.currency.supportedCurrencies.includes(detectedCurrency)) {
      return detectedCurrency
    }
    
    // Fallback to default currency
    return settings.currency.defaultCurrency
  } catch (error) {
    console.error('Error detecting user currency:', error)
    return 'usd' // Ultimate fallback
  }
}

/**
 * Get currency symbol for a given currency code
 * 
 * @param currency - Currency code (e.g., 'usd', 'eur')
 * @returns Currency symbol (e.g., '$', '€')
 */
export function getCurrencySymbol(currency: string = 'usd'): string {
  const symbols: Record<string, string> = {
    usd: '$',
    eur: '€',
    gbp: '£',
    cad: 'C$',
    aud: 'A$',
    jpy: '¥',
  }
  
  return symbols[currency.toLowerCase()] || currency.toUpperCase()
}

/**
 * Get user's preferred currency
 * Checks localStorage first, then detects from browser locale
 * 
 * @returns Currency code (e.g., 'usd', 'eur')
 */
export async function getUserCurrency(): Promise<string> {
  try {
    // Check if we have a stored preference
    const storedCurrency = typeof window !== 'undefined' ? localStorage.getItem('preferredCurrency') : null
    
    // Get payment settings
    const settings = await getPaymentSettings()
    
    // If we have a stored preference and it's supported, use it
    if (storedCurrency && settings.currency.supportedCurrencies.includes(storedCurrency)) {
      return storedCurrency
    }
    
    // Otherwise detect from browser
    const detectedCurrency = await detectUserCurrency()
    
    // Store the detected currency for future use
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferredCurrency', detectedCurrency)
    }
    
    return detectedCurrency
  } catch (error) {
    console.error('Error getting user currency:', error)
    return 'usd' // Ultimate fallback
  }
}

/**
 * Set user's preferred currency
 * 
 * @param currency - Currency code (e.g., 'usd', 'eur')
 */
export function setUserCurrency(currency: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('preferredCurrency', currency.toLowerCase())
  }
}
