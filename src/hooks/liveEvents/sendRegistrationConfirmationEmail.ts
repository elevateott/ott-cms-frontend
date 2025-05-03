// src/hooks/liveEvents/sendRegistrationConfirmationEmail.ts
import { logger } from '@/utils/logger'
import type { CollectionAfterChangeHook } from 'payload'
import { getServerSideURL } from '@/utilities/getURL'

/**
 * Hook to send a confirmation email when a user registers for a live event
 */
export const sendRegistrationConfirmationEmail: CollectionAfterChangeHook = async ({
  doc,
  operation,
  req,
}) => {
  // Only send confirmation email on create operation
  if (operation !== 'create') {
    return doc
  }

  try {
    const { payload } = req
    
    // Get the live event details
    const liveEvent = await payload.findByID({
      collection: 'live-events',
      id: doc.liveEvent,
    })

    if (!liveEvent) {
      logger.error(
        { context: 'sendRegistrationConfirmationEmail' },
        `Live event not found for registration ${doc.id}`
      )
      return doc
    }

    // Only send confirmation email if preregistration is enabled
    if (!liveEvent.preregistrationEnabled) {
      return doc
    }

    // Generate confirmation URL
    const baseUrl = getServerSideURL()
    const confirmationUrl = `${baseUrl}/api/confirm-registration?token=${doc.confirmationToken}`

    // Send confirmation email
    await payload.sendEmail({
      to: doc.email,
      subject: `Confirm your registration for "${liveEvent.title}"`,
      html: `
        <h1>Confirm Your Registration</h1>
        <p>Hello ${doc.firstName},</p>
        <p>Thank you for registering for "${liveEvent.title}".</p>
        <p>Please confirm your registration by clicking the button below:</p>
        <p>
          <a href="${confirmationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 4px;">
            Confirm Registration
          </a>
        </p>
        <p>If the button doesn't work, you can copy and paste this URL into your browser:</p>
        <p>${confirmationUrl}</p>
        <p>This event is scheduled to start on ${new Date(liveEvent.scheduledStartTime).toLocaleString()}.</p>
        <p>We'll send you a reminder email shortly before the event starts.</p>
        <p>Thank you,<br>The ${liveEvent.title} Team</p>
      `,
    })

    logger.info(
      { context: 'sendRegistrationConfirmationEmail' },
      `Sent confirmation email to ${doc.email} for live event ${liveEvent.title}`
    )
  } catch (error) {
    logger.error(
      { context: 'sendRegistrationConfirmationEmail' },
      `Error sending confirmation email: ${error instanceof Error ? error.message : String(error)}`
    )
  }

  return doc
}
