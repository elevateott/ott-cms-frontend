// src/app/api/public/events/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { logger } from '@/utils/logger'

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params
    
    if (!slug) {
      return NextResponse.json(
        { error: 'Event slug is required' },
        { status: 400 }
      )
    }

    logger.info({ context: 'public-events' }, `Fetching public event with slug: ${slug}`)

    // Initialize Payload
    const payload = await getPayload({ config: configPromise })
    
    // Get the user from the request (if authenticated)
    const { user } = await payload.auth({ headers: req.headers })
    
    // Find the event by slug
    const events = await payload.find({
      collection: 'live-events',
      where: {
        slug: { equals: slug },
      },
      limit: 1,
      depth: 0, // Don't populate relationships for performance
    })
    
    if (events.totalDocs === 0) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }
    
    const event = events.docs[0]
    
    // Check if the event is in a valid status
    const validStatuses = ['scheduled', 'active', 'completed']
    if (!validStatuses.includes(event.status)) {
      return NextResponse.json(
        { error: 'Event not available' },
        { status: 404 }
      )
    }
    
    // Determine if the user can access the event
    let canAccess = true
    let accessDeniedReason = null
    
    if (event.accessType === 'subscription') {
      // Check if the user has an active subscription
      if (!user || !user.subscriptionActive) {
        canAccess = false
        accessDeniedReason = 'subscription_required'
      }
    } else if (event.accessType === 'paid_ticket') {
      // Check if the user has purchased a ticket
      if (!user) {
        canAccess = false
        accessDeniedReason = 'login_required'
      } else {
        // This is a placeholder - you would need to implement ticket checking logic
        const hasTicket = user.tickets?.includes(event.id)
        
        if (!hasTicket) {
          canAccess = false
          accessDeniedReason = 'ticket_required'
        }
      }
    }
    
    // Return the event with access control information
    return NextResponse.json({
      ...event,
      canAccess,
      accessDeniedReason,
    })
  } catch (error) {
    logger.error(
      { context: 'public-events' },
      `Error fetching event: ${error instanceof Error ? error.message : String(error)}`
    )
    
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    )
  }
}
