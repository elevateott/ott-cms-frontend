'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useField, useFormFields } from '@payloadcms/ui/forms'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { clientLogger } from '@/utils/clientLogger'

const StripeConnectButton: React.FC = () => {
  const { toast } = useToast()
  const { value: accountId } = useField<string>({ path: 'stripe.accountId' })
  const { value: connected } = useField<boolean>({ path: 'stripe.connected' })
  const { value: testMode } = useField<boolean>({ path: 'stripe.testMode' })
  const [isLoading, setIsLoading] = useState(false)

  // Get the form fields to update them programmatically
  const { dispatchFields } = useFormFields()

  // Function to handle OAuth redirect
  const handleOAuthRedirect = useCallback(async () => {
    try {
      setIsLoading(true)

      // Get the OAuth URL from our API
      const response = await fetch('/api/payments/stripe/oauth-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testMode,
          redirectUri: window.location.origin + '/api/payments/stripe/oauth-callback',
        }),
      })

      const data = await response.json()

      if (data.url) {
        // Open the OAuth URL in a new window
        window.open(data.url, 'StripeConnect', 'width=600,height=700')

        // Listen for messages from the OAuth callback
        window.addEventListener('message', (event) => {
          if (event.origin === window.location.origin && event.data.type === 'stripe-connected') {
            // Update the form fields
            dispatchFields({
              type: 'UPDATE',
              path: 'stripe.accountId',
              value: event.data.accountId,
            })

            dispatchFields({
              type: 'UPDATE',
              path: 'stripe.connected',
              value: true,
            })

            toast({
              title: 'Stripe Connected',
              description: 'Your Stripe account has been successfully connected.',
            })
          }
        })
      } else {
        throw new Error(data.error || 'Failed to get OAuth URL')
      }
    } catch (error) {
      clientLogger.error(error, 'StripeConnectButton')
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect to Stripe. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [dispatchFields, testMode, toast])

  // Function to disconnect Stripe
  const handleDisconnect = useCallback(async () => {
    try {
      setIsLoading(true)

      // Call API to disconnect
      const response = await fetch('/api/payments/stripe/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId,
          testMode,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Update the form fields
        dispatchFields({
          type: 'UPDATE',
          path: 'stripe.accountId',
          value: '',
        })

        dispatchFields({
          type: 'UPDATE',
          path: 'stripe.connected',
          value: false,
        })

        toast({
          title: 'Stripe Disconnected',
          description: 'Your Stripe account has been successfully disconnected.',
        })
      } else {
        throw new Error(data.error || 'Failed to disconnect Stripe')
      }
    } catch (error) {
      clientLogger.error(error, 'StripeConnectButton')
      toast({
        title: 'Disconnection Failed',
        description: 'Failed to disconnect from Stripe. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [accountId, dispatchFields, testMode, toast])

  return (
    <div className="py-2">
      {connected ? (
        <div>
          <div className="flex items-center mb-2">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
            <span>Connected to Stripe Account: {accountId}</span>
          </div>
          <Button variant="destructive" onClick={handleDisconnect} disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Disconnect Stripe'}
          </Button>
        </div>
      ) : (
        <Button
          onClick={handleOAuthRedirect}
          disabled={isLoading}
          className="bg-[#6772e5] hover:bg-[#5469d4] text-white"
        >
          {isLoading ? 'Processing...' : 'Connect with Stripe'}
        </Button>
      )}
    </div>
  )
}

export default StripeConnectButton
