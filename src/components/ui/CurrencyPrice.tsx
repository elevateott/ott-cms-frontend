'use client'

import React, { useState, useEffect } from 'react'
import { formatPrice, getUserCurrency } from '@/utilities/client/currency'

interface CurrencyPriceProps {
  pricesByCurrency?: Array<{ currency: string; amount: number }>
  fallbackPrice?: number
  fallbackCurrency?: string
  className?: string
}

/**
 * Component to display a price in the user's preferred currency
 * Falls back to USD or specified fallback currency if the preferred currency is not available
 */
export function CurrencyPrice({
  pricesByCurrency,
  fallbackPrice,
  fallbackCurrency = 'usd',
  className,
}: CurrencyPriceProps) {
  const [formattedPrice, setFormattedPrice] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadCurrency = async () => {
      try {
        setIsLoading(true)

        // Get user's preferred currency
        const userCurrency = await getUserCurrency()

        // If we have prices by currency
        if (pricesByCurrency && pricesByCurrency.length > 0) {
          // Try to find price in user's currency
          const priceInUserCurrency = pricesByCurrency.find((p) => p.currency === userCurrency)

          if (priceInUserCurrency) {
            setFormattedPrice(formatPrice(priceInUserCurrency.amount, userCurrency))
            return
          }

          // Fall back to USD if available
          const usdPrice = pricesByCurrency.find((p) => p.currency === 'usd')
          if (usdPrice) {
            setFormattedPrice(formatPrice(usdPrice.amount, 'usd'))
            return
          }

          // Fall back to first available price
          setFormattedPrice(formatPrice(pricesByCurrency[0].amount, pricesByCurrency[0].currency))
          return
        }

        // Fall back to fallbackPrice if provided
        if (fallbackPrice !== undefined) {
          setFormattedPrice(formatPrice(fallbackPrice, fallbackCurrency))
          return
        }

        // Ultimate fallback
        setFormattedPrice('N/A')
      } catch (error) {
        console.error('Error loading currency price:', error)

        // Show fallback price on error
        if (fallbackPrice !== undefined) {
          setFormattedPrice(formatPrice(fallbackPrice, fallbackCurrency))
        } else {
          setFormattedPrice('N/A')
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadCurrency()
  }, [pricesByCurrency, fallbackPrice, fallbackCurrency])

  if (isLoading) {
    return <span className={className}>...</span>
  }

  return <span className={className}>{formattedPrice}</span>
}

export default CurrencyPrice
