'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ManageBillingButton } from '@/components/payments/ManageBillingButton'
import { useToast } from '@/hooks/use-toast'
import { clientLogger } from '@/utils/clientLogger'

export default function StripePortalTestPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Fetch the current user on page load
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/users/me')
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch user')
        }

        setUser(data.user)
      } catch (err) {
        clientLogger.error(err, 'StripePortalTestPage.fetchUser')
        setError(err instanceof Error ? err.message : 'An error occurred')
        
        toast({
          title: 'Error',
          description: err instanceof Error ? err.message : 'Failed to fetch user',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [toast])

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Stripe Customer Portal Test</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Manage Your Subscription</CardTitle>
          <CardDescription>
            Access the Stripe Customer Portal to manage your billing information, subscription, and payment methods.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading user information...</p>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600">{error}</p>
              <p className="text-sm mt-2">Please log in to access the billing portal.</p>
            </div>
          ) : !user ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-amber-600">You need to be logged in to access the billing portal.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                <h3 className="font-medium">User Information</h3>
                <p className="text-sm mt-1">Email: {user.email}</p>
                <p className="text-sm">Name: {user.name || 'N/A'}</p>
              </div>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h3 className="font-medium text-blue-700">Stripe Customer Portal</h3>
                <p className="text-sm mt-1 mb-4">
                  Click the button below to access the Stripe Customer Portal where you can:
                </p>
                <ul className="list-disc list-inside text-sm space-y-1 mb-4">
                  <li>Update your payment methods</li>
                  <li>View your billing history</li>
                  <li>Download invoices</li>
                  <li>Cancel or resume your subscription</li>
                </ul>
                <p className="text-xs text-gray-500 mb-4">
                  Note: You will be redirected to a secure Stripe-hosted page to manage your billing information.
                </p>
                
                <ManageBillingButton 
                  variant="default" 
                  size="default"
                  returnUrl={`${window.location.origin}/test/stripe-portal`}
                />
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-xs text-gray-500">
            This is a test page for the Stripe Customer Portal integration.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
