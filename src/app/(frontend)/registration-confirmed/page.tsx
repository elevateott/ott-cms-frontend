'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'

export default function RegistrationConfirmedPage() {
  const searchParams = useSearchParams()
  const eventSlug = searchParams.get('event')
  const alreadyConfirmed = searchParams.get('already') === 'true'
  const [eventTitle, setEventTitle] = useState<string | null>(null)
  
  useEffect(() => {
    // If we have an event slug, fetch the event title
    if (eventSlug) {
      const fetchEvent = async () => {
        try {
          const response = await fetch(`/api/public/events/${eventSlug}`)
          
          if (response.ok) {
            const data = await response.json()
            setEventTitle(data.title)
          }
        } catch (error) {
          console.error('Failed to fetch event details', error)
        }
      }
      
      fetchEvent()
    }
  }, [eventSlug])
  
  return (
    <div className="container mx-auto py-12">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <CardTitle className="text-center">Registration Confirmed</CardTitle>
            <CardDescription className="text-center">
              {alreadyConfirmed
                ? 'Your registration was already confirmed.'
                : 'Thank you for confirming your registration.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center mb-4">
              {eventTitle
                ? `You are now registered for "${eventTitle}".`
                : 'You are now registered for this event.'}
            </p>
            <p className="text-center text-sm text-gray-500">
              We'll send you a reminder email shortly before the event starts.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            {eventSlug ? (
              <Link href={`/events/${eventSlug}`} passHref>
                <Button>Go to Event Page</Button>
              </Link>
            ) : (
              <Link href="/" passHref>
                <Button>Return to Home</Button>
              </Link>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
