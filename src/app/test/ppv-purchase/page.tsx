'use client'

import React, { useState, useEffect } from 'react'
import { StripePPVCheckoutButton } from '@/components/payments'
import { useToast } from '@/hooks/use-toast'
import { clientLogger } from '@/utils/clientLogger'

export default function PPVPurchaseTestPage() {
  const { toast } = useToast()
  const [eventId, setEventId] = useState('')
  const [loading, setLoading] = useState(false)
  const [events, setEvents] = useState<any[]>([])

  // Generate success and cancel URLs
  const successUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/test/ppv-purchase?success=true`
  const cancelUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/test/ppv-purchase?canceled=true`

  // Fetch PPV events on mount
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/live-events?where[ppvEnabled][equals]=true')
        
        if (!response.ok) {
          throw new Error('Failed to fetch PPV events')
        }
        
        const data = await response.json()
        setEvents(data.docs || [])
      } catch (error) {
        clientLogger.error(error, 'Error fetching PPV events')
        toast({
          title: 'Error',
          description: 'Failed to fetch PPV events',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchEvents()
  }, [toast])

  // Check for success or canceled query params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const success = urlParams.get('success')
      const canceled = urlParams.get('canceled')
      
      if (success) {
        toast({
          title: 'Payment Successful',
          description: 'Your PPV purchase was successful!',
          variant: 'default',
        })
      } else if (canceled) {
        toast({
          title: 'Payment Canceled',
          description: 'Your PPV purchase was canceled.',
          variant: 'destructive',
        })
      }
    }
  }, [toast])

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">PPV Purchase Test</h1>
      
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : events.length > 0 ? (
        <div className="grid gap-6">
          {events.map((event) => (
            <div key={event.id} className="border rounded-lg p-6 bg-white shadow-sm">
              <h2 className="text-xl font-semibold mb-2">{event.title}</h2>
              <p className="text-gray-600 mb-4">{event.description}</p>
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-medium">
                  Price: ${(event.ppvPrice / 100).toFixed(2)}
                </span>
                <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-sm">
                  Pay-Per-View
                </span>
              </div>
              <StripePPVCheckoutButton
                eventId={event.id}
                successUrl={successUrl}
                cancelUrl={cancelUrl}
                className="w-full"
              >
                Purchase Access
              </StripePPVCheckoutButton>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border rounded-lg bg-gray-50">
          <p className="text-gray-600">No PPV events found. Create a live event with PPV enabled first.</p>
        </div>
      )}
    </div>
  )
}
