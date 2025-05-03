'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { clientLogger } from '@/utils/clientLogger'
import PayPalButton from '@/components/payments/PayPalButton'
import { API_ROUTES } from '@/constants/api'
import TestModeBadge from '@/components/admin/TestModeBadge'
import TestModeWarning from '@/components/admin/TestModeWarning'

export default function TestPayPalPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<any>(null)
  const [amount, setAmount] = useState('10.00')
  const [currency, setCurrency] = useState('USD')
  const [description, setDescription] = useState('Test Payment')

  // Fetch payment settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true)

        const response = await fetch(API_ROUTES.PAYMENTS.TEST)
        const data = await response.json()

        if (data.success) {
          setSettings(data.settings)
        } else {
          throw new Error(data.error || 'Failed to fetch payment settings')
        }
      } catch (err: any) {
        clientLogger.error(err, 'test-paypal/page')
        toast({
          title: 'Error',
          description: err.message || 'Failed to fetch payment settings',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [toast])

  const handleSuccess = (details: any) => {
    console.log('Payment successful:', details)
    toast({
      title: 'Payment Successful',
      description: `Transaction ID: ${details.id}`,
    })
  }

  const handleError = (error: any) => {
    console.error('Payment error:', error)
  }

  const handleCancel = () => {
    console.log('Payment cancelled')
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  const isPayPalEnabled = settings?.paypal?.enabled
  const isPayPalConnected = settings?.paypal?.connected
  const hasPayPalClientId = settings?.paypal?.hasClientId
  const hasPayPalClientSecret = settings?.paypal?.hasClientSecret
  const paypalEnvironment = settings?.paypal?.environment
  const isPayPalTestMode = settings?.paypal?.testMode
  const testModeGateways = settings?.testMode?.gateways || []

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Test PayPal Integration</h1>
        {isPayPalTestMode && <TestModeBadge gateway="paypal" />}
      </div>

      {testModeGateways.length > 0 && (
        <TestModeWarning gateways={testModeGateways} className="mb-6" />
      )}

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>PayPal Settings</CardTitle>
          <CardDescription>Current configuration for PayPal integration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-semibold">Enabled:</p>
              <p>{isPayPalEnabled ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <p className="font-semibold">Connected:</p>
              <p>{isPayPalConnected ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <p className="font-semibold">Environment:</p>
              <p>
                {paypalEnvironment || 'Not set'}
                {isPayPalTestMode && (
                  <span className="ml-2 text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-800 rounded">
                    Test Mode
                  </span>
                )}
              </p>
            </div>
            <div>
              <p className="font-semibold">Client ID:</p>
              <p>{hasPayPalClientId ? 'Configured' : 'Not configured'}</p>
            </div>
            <div>
              <p className="font-semibold">Client Secret:</p>
              <p>{hasPayPalClientSecret ? 'Configured' : 'Not configured'}</p>
            </div>
          </div>

          {(!isPayPalEnabled ||
            !isPayPalConnected ||
            !hasPayPalClientId ||
            !hasPayPalClientSecret) && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-yellow-800">
                PayPal integration is not fully configured. Please go to the Payment Settings page
                to complete the setup.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Payment</CardTitle>
          <CardDescription>Process a test payment with PayPal</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="10.00"
                />
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  placeholder="USD"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Test Payment"
              />
            </div>
          </div>

          <Separator className="my-6" />

          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">PayPal Checkout</h3>

            {isPayPalEnabled && isPayPalConnected && hasPayPalClientId && hasPayPalClientSecret ? (
              <PayPalButton
                amount={parseFloat(amount)}
                currency={currency}
                description={description}
                onSuccess={handleSuccess}
                onError={handleError}
                onCancel={handleCancel}
                className="max-w-md mx-auto"
              />
            ) : (
              <div className="p-4 bg-gray-100 border border-gray-200 rounded-md text-center">
                <p>PayPal integration is not fully configured.</p>
                <Button
                  className="mt-2"
                  variant="outline"
                  onClick={() => {
                    // Navigate to payment settings
                    window.location.href = '/admin/globals/payment-settings'
                  }}
                >
                  Configure PayPal
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
