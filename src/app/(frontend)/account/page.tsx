'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ManageBillingButton } from '@/components/payments/ManageBillingButton'
import { useToast } from '@/hooks/use-toast'
import { clientLogger } from '@/utils/clientLogger'

export default function AccountPage() {
  const [user, setUser] = useState<any>(null)
  const [subscriber, setSubscriber] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Fetch the current user and subscriber data on page load
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch user data
        const userResponse = await fetch('/api/users/me')
        const userData = await userResponse.json()

        if (!userResponse.ok) {
          throw new Error(userData.error || 'Failed to fetch user')
        }

        setUser(userData.user)

        // Fetch subscriber data if user is logged in
        if (userData.user) {
          try {
            const subscriberResponse = await fetch('/api/subscribers/me', {
              headers: {
                'x-subscriber-token': localStorage.getItem('subscriberToken') || '',
              },
            })

            if (subscriberResponse.ok) {
              const subscriberData = await subscriberResponse.json()
              setSubscriber(subscriberData)
            }
          } catch (subscriberError) {
            // Just log the error but don't show it to the user
            clientLogger.error(subscriberError, 'AccountPage.fetchSubscriberData')
          }
        }
      } catch (err) {
        clientLogger.error(err, 'AccountPage.fetchData')
        setError(err instanceof Error ? err.message : 'An error occurred')
        
        toast({
          title: 'Error',
          description: err instanceof Error ? err.message : 'Failed to fetch user data',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [toast])

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">My Account</h1>
      
      {loading ? (
        <div className="flex justify-center">
          <p>Loading account information...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
          <p className="text-sm mt-2">Please log in to access your account.</p>
        </div>
      ) : !user ? (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
          <p className="text-amber-600">You need to be logged in to view your account.</p>
        </div>
      ) : (
        <Tabs defaultValue="profile">
          <TabsList className="mb-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
            <TabsTrigger value="purchases">Purchases</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Your account details and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Name</h3>
                      <p>{user.name || 'Not set'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Email</h3>
                      <p>{user.email}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="subscription">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Management</CardTitle>
                <CardDescription>
                  Manage your subscription and billing information
                </CardDescription>
              </CardHeader>
              <CardContent>
                {subscriber ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Subscription Status</h3>
                        <p className={`font-medium ${
                          subscriber.subscriptionStatus === 'active' || subscriber.subscriptionStatus === 'trialing'
                            ? 'text-green-600'
                            : subscriber.subscriptionStatus === 'past_due'
                            ? 'text-amber-600'
                            : 'text-gray-600'
                        }`}>
                          {subscriber.subscriptionStatus === 'active'
                            ? 'Active'
                            : subscriber.subscriptionStatus === 'trialing'
                            ? 'Trial'
                            : subscriber.subscriptionStatus === 'past_due'
                            ? 'Past Due'
                            : subscriber.subscriptionStatus === 'canceled'
                            ? 'Canceled'
                            : 'None'}
                        </p>
                      </div>
                      {subscriber.subscriptionExpiresAt && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Next Billing Date</h3>
                          <p>{formatDate(subscriber.subscriptionExpiresAt)}</p>
                        </div>
                      )}
                    </div>
                    
                    {subscriber.activePlans && subscriber.activePlans.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Active Plans</h3>
                        <ul className="list-disc list-inside">
                          {subscriber.activePlans.map((plan: any) => (
                            <li key={plan.id}>{plan.name || plan.id}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div className="pt-4 border-t border-gray-200">
                      <h3 className="text-sm font-medium text-gray-500 mb-3">Billing Management</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        You can manage your payment methods, view billing history, and update subscription settings through our secure billing portal.
                      </p>
                      
                      <ManageBillingButton 
                        variant="default" 
                        returnUrl={`${window.location.origin}/account`}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                    <p>You don't have an active subscription.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="purchases">
            <Card>
              <CardHeader>
                <CardTitle>Purchase History</CardTitle>
                <CardDescription>
                  Your rentals and pay-per-view purchases
                </CardDescription>
              </CardHeader>
              <CardContent>
                {subscriber ? (
                  <div className="space-y-6">
                    {subscriber.purchasedRentals && subscriber.purchasedRentals.length > 0 ? (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Rentals</h3>
                        <ul className="divide-y divide-gray-200">
                          {subscriber.purchasedRentals.map((rental: any) => (
                            <li key={rental.id} className="py-3">
                              <div className="flex justify-between">
                                <span>{rental.title || rental.id}</span>
                                {subscriber.rentalExpirations && subscriber.rentalExpirations.find((exp: any) => exp.contentId === rental.id) && (
                                  <span className="text-sm text-gray-500">
                                    Expires: {formatDate(subscriber.rentalExpirations.find((exp: any) => exp.contentId === rental.id).expiresAt)}
                                  </span>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                        <p>You don't have any rentals.</p>
                      </div>
                    )}
                    
                    {subscriber.purchasedPPV && subscriber.purchasedPPV.length > 0 ? (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Pay-Per-View Events</h3>
                        <ul className="divide-y divide-gray-200">
                          {subscriber.purchasedPPV.map((event: any) => (
                            <li key={event.id} className="py-3">
                              <span>{event.title || event.id}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                        <p>You don't have any pay-per-view purchases.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                    <p>No purchase history found.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
