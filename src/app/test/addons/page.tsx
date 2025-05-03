'use client'

import React, { useState, useEffect } from 'react'
import { AddOnsList } from '@/components/addons/AddOnsList'
import { PurchasedAddOns } from '@/components/addons/PurchasedAddOns'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function AddOnsTestPage() {
  const [subscriber, setSubscriber] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Fetch subscriber data
  useEffect(() => {
    const fetchSubscriber = async () => {
      try {
        setLoading(true)
        // In a real implementation, this would fetch the current user's subscriber data
        // For testing, we'll simulate a subscriber with some purchased add-ons
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Mock subscriber data
        setSubscriber({
          id: 'test-subscriber',
          email: 'test@example.com',
          purchasedAddOns: [],
          activeRecurringAddOns: [],
        })
      } catch (error) {
        console.error('Error fetching subscriber:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchSubscriber()
  }, [])

  // Refresh subscriber data
  const refreshSubscriber = () => {
    setLoading(true)
    // In a real implementation, this would re-fetch the subscriber data
    setTimeout(() => {
      setLoading(false)
    }, 1000)
  }

  if (loading) {
    return (
      <div className="container py-12 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold mb-8">Add-Ons Test Page</h1>
      
      <Tabs defaultValue="available" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="available">Available Add-Ons</TabsTrigger>
          <TabsTrigger value="purchased">My Add-Ons</TabsTrigger>
        </TabsList>
        
        <TabsContent value="available">
          <Card>
            <CardHeader>
              <CardTitle>Available Add-Ons</CardTitle>
              <CardDescription>
                Enhance your subscription with these optional add-ons
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AddOnsList 
                subscriberId={subscriber?.id}
                purchasedAddOns={subscriber?.purchasedAddOns}
                activeRecurringAddOns={subscriber?.activeRecurringAddOns}
                onSuccess={refreshSubscriber}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="purchased">
          <Card>
            <CardHeader>
              <CardTitle>My Add-Ons</CardTitle>
              <CardDescription>
                Add-ons you've purchased or subscribed to
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PurchasedAddOns 
                oneTimeAddOns={subscriber?.purchasedAddOns?.map((id: string) => ({ 
                  id, 
                  title: 'One-Time Add-On', 
                  description: 'This is a purchased one-time add-on',
                  type: 'one-time'
                })) || []}
                recurringAddOns={subscriber?.activeRecurringAddOns?.map((item: any) => ({
                  addon: {
                    id: item.addon,
                    title: 'Recurring Add-On',
                    description: 'This is an active recurring add-on subscription',
                    type: 'recurring'
                  },
                  status: item.status || 'active',
                  startedAt: item.startedAt || new Date().toISOString(),
                  currentPeriodEnd: item.currentPeriodEnd
                })) || []}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
