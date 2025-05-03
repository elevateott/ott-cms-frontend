// src/app/api/confirm-registration/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { logger } from '@/utils/logger'

export async function GET(req: NextRequest) {
  try {
    // Get the token from the query string
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(new URL('/registration-error?reason=missing-token', req.url))
    }

    // Initialize Payload
    const payload = await getPayload({ config: configPromise })

    // Find the registration with this token
    const registrations = await payload.find({
      collection: 'live-event-registrations',
      where: {
        confirmationToken: { equals: token },
      },
      limit: 1,
    })

    if (registrations.totalDocs === 0) {
      return NextResponse.redirect(new URL('/registration-error?reason=invalid-token', req.url))
    }

    const registration = registrations.docs[0]

    // If already confirmed, just redirect to success page
    if (registration.confirmed) {
      return NextResponse.redirect(new URL('/registration-confirmed?already=true', req.url))
    }

    // Update the registration to mark it as confirmed
    await payload.update({
      collection: 'live-event-registrations',
      id: registration.id,
      data: {
        confirmed: true,
        confirmationToken: '', // Clear the token for security
      },
    })

    // Get the live event details
    const liveEvent = await payload.findByID({
      collection: 'live-events',
      id: registration.liveEvent,
    })

    logger.info(
      { context: 'confirm-registration' },
      `Registration confirmed for ${registration.email} for live event ${liveEvent.title}`
    )

    // Redirect to a success page
    return NextResponse.redirect(new URL(`/registration-confirmed?event=${liveEvent.slug}`, req.url))
  } catch (error) {
    logger.error(
      { context: 'confirm-registration' },
      `Error confirming registration: ${error instanceof Error ? error.message : String(error)}`
    )
    return NextResponse.redirect(new URL('/registration-error?reason=server-error', req.url))
  }
}
