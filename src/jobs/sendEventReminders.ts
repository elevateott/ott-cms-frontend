// src/jobs/sendEventReminders.ts
import { logger } from '@/utils/logger'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getServerSideURL } from '@/utilities/getURL'

/**
 * Job to send reminder emails to registrants before live events start
 */
export const sendEventReminders = async () => {
  try {
    logger.info({ context: 'sendEventReminders' }, 'Starting event reminder job')
    
    // Initialize Payload
    const payload = await getPayload({ config: configPromise })
    
    // Get current time
    const now = new Date()
    
    // Find upcoming events that are scheduled to start soon
    const upcomingEvents = await payload.find({
      collection: 'live-events',
      where: {
        and: [
          {
            scheduledStartTime: {
              greater_than: now.toISOString(),
            },
          },
          {
            preregistrationEnabled: {
              equals: true,
            },
          },
          {
            status: {
              not_equals: 'cancelled',
            },
          },
        ],
      },
    })
    
    logger.info(
      { context: 'sendEventReminders' },
      `Found ${upcomingEvents.docs.length} upcoming events with preregistration enabled`
    )
    
    // Process each upcoming event
    for (const event of upcomingEvents.docs) {
      try {
        // Calculate when reminders should be sent
        const startTime = new Date(event.scheduledStartTime)
        const reminderTime = new Date(startTime.getTime() - (event.reminderMinutesBefore || 30) * 60 * 1000)
        
        // Check if it's time to send reminders (within the last 5 minutes)
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
        
        if (reminderTime > now || reminderTime < fiveMinutesAgo) {
          // Not time to send reminders for this event yet
          continue
        }
        
        logger.info(
          { context: 'sendEventReminders' },
          `Sending reminders for event: ${event.title} (${event.id})`
        )
        
        // Find confirmed registrations that haven't received a reminder yet
        const registrations = await payload.find({
          collection: 'live-event-registrations',
          where: {
            and: [
              {
                liveEvent: {
                  equals: event.id,
                },
              },
              {
                confirmed: {
                  equals: true,
                },
              },
              {
                reminderSent: {
                  equals: false,
                },
              },
            ],
          },
          limit: 100, // Process in batches
        })
        
        logger.info(
          { context: 'sendEventReminders' },
          `Found ${registrations.docs.length} registrations to send reminders for event ${event.id}`
        )
        
        // Generate the event URL
        const baseUrl = getServerSideURL()
        const eventUrl = `${baseUrl}/events/${event.slug}`
        
        // Send reminder emails to each registrant
        for (const registration of registrations.docs) {
          try {
            await payload.sendEmail({
              to: registration.email,
              subject: `🔴 "${event.title}" is going live soon!`,
              html: `
                <h1>Going Live Soon!</h1>
                <p>Hello ${registration.firstName},</p>
                <p>Your event "${event.title}" is starting in ${event.reminderMinutesBefore || 30} minutes!</p>
                <p>
                  <a href="${eventUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 4px;">
                    Watch Now
                  </a>
                </p>
                <p>If the button doesn't work, you can copy and paste this URL into your browser:</p>
                <p>${eventUrl}</p>
                <p>Thank you,<br>The ${event.title} Team</p>
              `,
            })
            
            // Mark the reminder as sent
            await payload.update({
              collection: 'live-event-registrations',
              id: registration.id,
              data: {
                reminderSent: true,
              },
            })
            
            logger.info(
              { context: 'sendEventReminders' },
              `Sent reminder email to ${registration.email} for event ${event.id}`
            )
          } catch (error) {
            logger.error(
              { context: 'sendEventReminders' },
              `Error sending reminder to ${registration.email}: ${
                error instanceof Error ? error.message : String(error)
              }`
            )
          }
        }
      } catch (eventError) {
        logger.error(
          { context: 'sendEventReminders' },
          `Error processing event ${event.id}: ${
            eventError instanceof Error ? eventError.message : String(eventError)
          }`
        )
      }
    }
    
    logger.info({ context: 'sendEventReminders' }, 'Completed event reminder job')
  } catch (error) {
    logger.error(
      { context: 'sendEventReminders' },
      `Error in event reminder job: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}
