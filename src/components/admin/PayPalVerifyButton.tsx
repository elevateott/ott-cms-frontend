'use client'

import React, { useCallback, useState } from 'react'
import { useField, useFormFields } from '@payloadcms/ui/forms'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { clientLogger } from '@/utils/clientLogger'

const PayPalVerifyButton: React.FC = () => {
  const { toast } = useToast()
  const { value: clientId } = useField<string>({ path: 'paypal.clientId' })
  const { value: clientSecret } = useField<string>({ path: 'paypal.clientSecret' })
  const { value: environment } = useField<string>({ path: 'paypal.environment' })
  const { value: connected } = useField<boolean>({ path: 'paypal.connected' })
  const [isLoading, setIsLoading] = useState(false)

  // Get the form fields to update them programmatically
  const { dispatchFields } = useFormFields()

  // Function to verify PayPal credentials
  const verifyCredentials = useCallback(async () => {
    if (!clientId || !clientSecret) {
      toast({
        title: 'Missing Credentials',
        description: 'Please enter both Client ID and Client Secret.',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsLoading(true)

      // Call API to verify credentials
      const response = await fetch('/api/payments/paypal/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          clientSecret,
          environment,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Update the connected status
        dispatchFields({
          type: 'UPDATE',
          path: 'paypal.connected',
          value: true,
        })

        toast({
          title: 'PayPal Connected',
          description: 'Your PayPal credentials have been verified successfully.',
        })
      } else {
        dispatchFields({
          type: 'UPDATE',
          path: 'paypal.connected',
          value: false,
        })

        throw new Error(data.error || 'Failed to verify PayPal credentials')
      }
    } catch (error) {
      clientLogger.error(error, 'PayPalVerifyButton')
      toast({
        title: 'Verification Failed',
        description: 'Failed to verify PayPal credentials. Please check and try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [clientId, clientSecret, dispatchFields, environment, toast])

  return (
    <div className="py-2">
      {connected ? (
        <div>
          <div className="flex items-center mb-2">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
            <span>PayPal credentials verified</span>
          </div>
          <Button onClick={verifyCredentials} disabled={isLoading}>
            {isLoading ? 'Verifying...' : 'Re-verify Credentials'}
          </Button>
        </div>
      ) : (
        <Button
          onClick={verifyCredentials}
          disabled={isLoading || !clientId || !clientSecret}
          className="bg-[#0070ba] hover:bg-[#005ea6] text-white"
        >
          {isLoading ? 'Verifying...' : 'Verify PayPal Connection'}
        </Button>
      )}
    </div>
  )
}

export default PayPalVerifyButton
