'use client'

import React, { useEffect, useState } from 'react'
import Script from 'next/script'
import { useToast } from '@/hooks/use-toast'
import { clientLogger } from '@/utils/clientLogger'
import { API_ROUTES } from '@/constants/api'

// Define PayPal button props
interface PayPalButtonProps {
  amount: number
  currency?: string
  description?: string
  items?: Array<{
    name: string
    description?: string
    quantity: string
    unit_amount: {
      currency_code: string
      value: string
    }
  }>
  customId?: string
  onSuccess?: (details: any) => void
  onError?: (error: any) => void
  onCancel?: () => void
  disabled?: boolean
  className?: string
}

// Define PayPal window object
declare global {
  interface Window {
    paypal?: any
  }
}

const PayPalButton: React.FC<PayPalButtonProps> = ({
  amount,
  currency = 'USD',
  description = 'OTT Platform Purchase',
  items = [],
  customId,
  onSuccess,
  onError,
  onCancel,
  disabled = false,
  className = '',
}) => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [clientId, setClientId] = useState<string | null>(null)
  const [isTestMode, setIsTestMode] = useState(false)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [buttonRendered, setButtonRendered] = useState(false)

  const buttonContainerId = 'paypal-button-container'

  // Fetch PayPal client ID
  useEffect(() => {
    const fetchClientId = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch payment settings
        const response = await fetch(API_ROUTES.PAYMENTS.TEST)
        const data = await response.json()

        if (!data.success) {
          throw new Error('Failed to fetch payment settings')
        }

        // Check if PayPal is enabled and connected
        if (!data.settings.paypal.enabled) {
          throw new Error('PayPal payments are not enabled')
        }

        if (!data.settings.paypal.hasClientId) {
          throw new Error('PayPal Client ID is not configured')
        }

        // Set test mode status
        setIsTestMode(data.settings.paypal.testMode)

        // Fetch client ID
        const clientIdResponse = await fetch(API_ROUTES.PAYMENTS.PAYPAL.CLIENT_ID)
        const clientIdData = await clientIdResponse.json()

        if (!clientIdData.success) {
          throw new Error(clientIdData.error || 'Failed to fetch PayPal Client ID')
        }

        setClientId(clientIdData.clientId)

        // Double-check test mode from API response
        if (clientIdData.testMode !== undefined) {
          setIsTestMode(clientIdData.testMode)
        }
      } catch (err: any) {
        clientLogger.error(err, 'PayPalButton')
        setError(err.message || 'Failed to initialize PayPal')
        toast({
          title: 'PayPal Error',
          description: err.message || 'Failed to initialize PayPal',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchClientId()
  }, [toast])

  // Render PayPal button when script is loaded
  useEffect(() => {
    if (!scriptLoaded || !clientId || buttonRendered || disabled) return

    const renderButton = async () => {
      try {
        // Clear any existing buttons
        const container = document.getElementById(buttonContainerId)
        if (container) {
          container.innerHTML = ''
        }

        // Render the PayPal button
        window.paypal
          ?.Buttons({
            // Set up the transaction
            createOrder: async () => {
              try {
                // Call your server to create the order
                const response = await fetch(API_ROUTES.PAYMENTS.PAYPAL.CREATE_ORDER, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    amount,
                    currency,
                    description,
                    items,
                    customId,
                  }),
                })

                const data = await response.json()

                if (!response.ok) {
                  throw new Error(data.error || 'Failed to create order')
                }

                return data.id
              } catch (err: any) {
                clientLogger.error(err, 'PayPalButton.createOrder')
                toast({
                  title: 'Payment Error',
                  description: err.message || 'Failed to create order',
                  variant: 'destructive',
                })

                if (onError) {
                  onError(err)
                }

                throw err
              }
            },
            // Handle the approval
            onApprove: async (data: any) => {
              try {
                // Call your server to capture the order
                const response = await fetch(API_ROUTES.PAYMENTS.PAYPAL.CAPTURE_ORDER, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    orderId: data.orderID,
                  }),
                })

                const orderData = await response.json()

                if (!response.ok) {
                  throw new Error(orderData.error || 'Failed to capture order')
                }

                // Show a success message
                toast({
                  title: 'Payment Successful',
                  description: 'Thank you for your payment!',
                })

                if (onSuccess) {
                  onSuccess(orderData)
                }
              } catch (err: any) {
                clientLogger.error(err, 'PayPalButton.onApprove')
                toast({
                  title: 'Payment Error',
                  description: err.message || 'Failed to complete payment',
                  variant: 'destructive',
                })

                if (onError) {
                  onError(err)
                }
              }
            },
            // Handle errors
            onError: (err: any) => {
              clientLogger.error(err, 'PayPalButton.onError')
              toast({
                title: 'Payment Error',
                description: 'An error occurred during the payment process',
                variant: 'destructive',
              })

              if (onError) {
                onError(err)
              }
            },
            // Handle cancellation
            onCancel: () => {
              toast({
                title: 'Payment Cancelled',
                description: 'You have cancelled the payment process',
              })

              if (onCancel) {
                onCancel()
              }
            },
            style: {
              layout: 'vertical',
              color: 'blue',
              shape: 'rect',
              label: 'pay',
            },
          })
          .render(`#${buttonContainerId}`)

        setButtonRendered(true)
      } catch (err: any) {
        clientLogger.error(err, 'PayPalButton.renderButton')
        setError(err.message || 'Failed to render PayPal button')
        toast({
          title: 'PayPal Error',
          description: err.message || 'Failed to render PayPal button',
          variant: 'destructive',
        })
      }
    }

    renderButton()

    // Cleanup
    return () => {
      setButtonRendered(false)
    }
  }, [
    scriptLoaded,
    clientId,
    buttonRendered,
    disabled,
    amount,
    currency,
    description,
    items,
    customId,
    onSuccess,
    onError,
    onCancel,
    toast,
  ])

  // Reset button rendered state when props change
  useEffect(() => {
    if (buttonRendered) {
      setButtonRendered(false)
    }
  }, [amount, currency, description, items, customId, disabled])

  if (error) {
    return <div className={`text-red-500 ${className}`}>{error}</div>
  }

  if (loading || !clientId) {
    return (
      <div className={`flex justify-center items-center p-4 ${className}`}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <>
      <Script
        src={`https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}`}
        onLoad={() => setScriptLoaded(true)}
        strategy="lazyOnload"
      />
      <div className="relative">
        {isTestMode && (
          <div className="absolute -top-6 left-0 right-0 flex justify-center">
            <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-t-md border border-yellow-200 border-b-0">
              Test Mode - No real payments will be processed
            </span>
          </div>
        )}
        <div id={buttonContainerId} className={className}></div>
      </div>
    </>
  )
}

export default PayPalButton
