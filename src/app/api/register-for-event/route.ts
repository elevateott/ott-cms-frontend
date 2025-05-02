// src/app/api/register-for-event/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { logger } from '@/utils/logger'

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json()
    const { firstName, lastName, email, liveEvent } = body
    
    // Validate required fields
    if (!firstName || !lastName || !email || !liveEvent) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Initialize Payload
    const payload = await getPayload({ config: configPromise })
    
    // Get the live event
    const liveEventDoc = await payload.findByID({
      collection: 'live-events',
      id: liveEvent,
    })
    
    if (!liveEventDoc) {
      return NextResponse.json(
        { message: 'Live event not found' },
        { status: 404 }
      )
    }
    
    // Check if preregistration is enabled
    if (!liveEventDoc.preregistrationEnabled) {
      return NextResponse.json(
        { message: 'Preregistration is not enabled for this event' },
        { status: 400 }
      )
    }
    
    // Check if the event has already ended
    const now = new Date()
    const endTime = liveEventDoc.scheduledEndTime ? new Date(liveEventDoc.scheduledEndTime) : null
    
    if (endTime && endTime < now) {
      return NextResponse.json(
        { message: 'This event has already ended' },
        { status: 400 }
      )
    }
    
    // Check if this email is already registered for this event
    const existingRegistrations = await payload.find({
      collection: 'live-event-registrations',
      where: {
        email: { equals: email },
        liveEvent: { equals: liveEvent },
      },
      limit: 1,
    })
    
    if (existingRegistrations.totalDocs > 0) {
      return NextResponse.json(
        { message: 'You have already registered for this event' },
        { status: 400 }
      )
    }
    
    // Create the registration
    const registration = await payload.create({
      collection: 'live-event-registrations',
      data: {
        firstName,
        lastName,
        email,
        liveEvent,
      },
    })
    
    // Update the live event with the registration
    const existingRegistrations2 = liveEventDoc.registrations || []
    await payload.update({
      collection: 'live-events',
      id: liveEvent,
      data: {
        registrations: [...existingRegistrations2, registration.id],
      },
    })
    
    logger.info(
      { context: 'register-for-event' },
      `Registration created for ${email} for live event ${liveEventDoc.title}`
    )
    
    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      registrationId: registration.id,
    })
  } catch (error) {
    logger.error(
      { context: 'register-for-event' },
      `Error creating registration: ${error instanceof Error ? error.message : String(error)}`
    )
    
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
