'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { LiveEventRegistrationForm } from '@/components/LiveEventRegistrationForm'
import { LiveEventCountdown } from '@/components/LiveEventCountdown'
import { AlertCircle, Lock, CreditCard, Users } from 'lucide-react'
import { clientLogger } from '@/utils/clientLogger'
import EventAccessControl from './EventAccessControl'

const logger = clientLogger.createContextLogger('EventPage')

type LiveEvent = {
  id: string
  title: string
  description: string
  slug: string
  status: string
  scheduledStartTime: string
  scheduledEndTime?: string
  preregistrationEnabled: boolean
  accessType: 'free' | 'subscription' | 'paid_ticket'
  ticketPrice?: number
  effectiveHlsUrl?: string
  canAccess: boolean
  accessDeniedReason?: string
  // PPV fields
  ppvEnabled?: boolean
  ppvPrice?: number
  ppvStripeProductId?: string
  ppvStripePriceId?: string
  // Rental fields
  rentalEnabled?: boolean
  rentalPrice?: number
  rentalDurationHours?: number
  rentalStripeProductId?: string
  rentalStripePriceId?: string
}

export default function EventPage() {
  const { slug } = useParams<{ slug: string }>()
  const [event, setEvent] = useState<LiveEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true)

        const response = await fetch(`/api/public/events/${slug}`)

        if (!response.ok) {
          throw new Error('Failed to fetch event')
        }

        const data = await response.json()
        setEvent(data)
      } catch (error) {
        logger.error('Failed to fetch event', error)
        setError('Failed to load event details')
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      fetchEvent()
    }
  }, [slug])

  if (loading) {
    return (
      <div className="container mx-auto py-12 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="container mx-auto py-12">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || 'Event not found'}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const now = new Date()
  const startTime = new Date(event.scheduledStartTime)
  const endTime = event.scheduledEndTime ? new Date(event.scheduledEndTime) : null
  const isLive = now >= startTime && (!endTime || now <= endTime)
  const hasEnded = endTime && now > endTime

  // Access control is now handled by the EventAccessControl component
  const renderAccessControl = () => {
    return null
  }

  const renderEventContent = () => {
    // If the event is live and the user has access, show the video player
    if (isLive && event.canAccess && event.effectiveHlsUrl) {
      return (
        <div className="mb-6">
          <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
            {/* This is a placeholder for the actual video player */}
            <div className="text-white text-center">
              <p className="text-xl font-bold mb-2">Live Stream Player</p>
              <p className="text-sm">HLS URL: {event.effectiveHlsUrl}</p>
            </div>
          </div>
        </div>
      )
    }

    // If the event has ended
    if (hasEnded) {
      return (
        <div className="mb-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Event Ended</AlertTitle>
            <AlertDescription>
              This event has already ended. Check back later for the recording.
            </AlertDescription>
          </Alert>
        </div>
      )
    }

    // If the event is upcoming and preregistration is enabled
    if (!isLive && event.preregistrationEnabled) {
      return (
        <div className="mb-6">
          <LiveEventRegistrationForm
            liveEventId={event.id}
            liveEventTitle={event.title}
            className="mb-6"
          />
        </div>
      )
    }

    // If the event is upcoming but preregistration is not enabled
    return (
      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Event Starting Soon</CardTitle>
            <CardDescription>
              This event is scheduled to start on{' '}
              {new Date(event.scheduledStartTime).toLocaleString()}. Check back then to watch the
              live stream.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
          <p className="text-gray-600 mb-4">{event.description}</p>

          <div className="flex flex-wrap gap-4 mb-6">
            <LiveEventCountdown
              startTime={event.scheduledStartTime}
              endTime={event.scheduledEndTime}
              className="flex-grow"
            />
          </div>

          <Separator className="my-6" />

          <EventAccessControl event={event}>{renderEventContent()}</EventAccessControl>
        </div>
      </div>
    </div>
  )
}
