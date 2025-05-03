// src/app/api/live-events/[id]/send-test-reminder/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { logger } from '@/utils/logger'
import { withAuth } from '@/middleware/apiMiddleware'
import { getServerSideURL } from '@/utilities/getURL'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (req, user, payload) => {
    try {
      const { id } = params
      
      if (!id) {
        return NextResponse.json({ message: 'Live event ID is required' }, { status: 400 })
      }

      logger.info({ context: 'send-test-reminder' }, `Sending test reminder for live event ${id}`)

      // Get the live event
      const liveEvent = await payload.findByID({
        collection: 'live-events',
        id,
      })

      if (!liveEvent) {
        return NextResponse.json({ message: 'Live event not found' }, { status: 404 })
      }

      // Check if preregistration is enabled
      if (!liveEvent.preregistrationEnabled) {
        return NextResponse.json(
          { message: 'Preregistration is not enabled for this event' },
          { status: 400 }
        )
      }

      // Check if the event has a scheduled start time
      if (!liveEvent.scheduledStartTime) {
        return NextResponse.json(
          { message: 'Event does not have a scheduled start time' },
          { status: 400 }
        )
      }

      // Send a test reminder email to the authenticated user
      const baseUrl = getServerSideURL()
      const eventUrl = `${baseUrl}/events/${liveEvent.slug}`
      
      await payload.sendEmail({
        to: user.email,
        subject: `🔴 "${liveEvent.title}" is going live soon!`,
        html: `
          <h1>Going Live Soon!</h1>
          <p>Hello ${user.name || user.email},</p>
          <p>Your event "${liveEvent.title}" is starting soon!</p>
          <p>
            <a href="${eventUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 4px;">
              Watch Now
            </a>
          </p>
          <p>If the button doesn't work, you can copy and paste this URL into your browser:</p>
          <p>${eventUrl}</p>
          <p>This is a test reminder email. Real reminder emails will be sent to all confirmed registrants approximately ${liveEvent.reminderMinutesBefore || 30} minutes before the event starts.</p>
          <p>Thank you,<br>The ${liveEvent.title} Team</p>
        `,
      })

      logger.info(
        { context: 'send-test-reminder' },
        `Sent test reminder email to ${user.email} for live event ${liveEvent.title}`
      )

      return NextResponse.json({
        success: true,
        message: `Test reminder email sent to ${user.email}`,
      })
    } catch (error) {
      logger.error(
        { context: 'send-test-reminder' },
        `Error sending test reminder: ${error instanceof Error ? error.message : String(error)}`
      )
      
      return NextResponse.json(
        { message: 'Failed to send test reminder email' },
        { status: 500 }
      )
    }
  })
}
