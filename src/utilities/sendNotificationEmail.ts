// src/utilities/sendNotificationEmail.ts
import { logger } from '@/utils/logger'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

/**
 * Send a notification email to administrators
 * 
 * @param options Email options
 * @returns Promise that resolves when the email is sent
 */
export async function sendNotificationEmail({
  subject,
  message,
  recipientEmails,
}: {
  subject: string
  message: string
  recipientEmails?: string[]
}): Promise<void> {
  try {
    // Get payload instance
    const payload = await getPayload({ config: configPromise })

    // Get admin email from settings or use default
    let adminEmails: string[] = []

    try {
      // Try to get email settings
      const emailSettings = await payload.findGlobal({
        slug: 'email-settings',
      })

      if (emailSettings?.adminNotificationEmails) {
        // Use configured admin emails
        adminEmails = emailSettings.adminNotificationEmails
          .split(',')
          .map((email: string) => email.trim())
          .filter((email: string) => email)
      }
    } catch (error) {
      logger.warn(
        { context: 'sendNotificationEmail' },
        'Failed to get admin notification emails from settings',
        error
      )
    }

    // Use provided recipient emails if available, otherwise use admin emails
    const to = recipientEmails?.length ? recipientEmails : adminEmails

    // If no recipients, log warning and return
    if (!to.length) {
      logger.warn(
        { context: 'sendNotificationEmail' },
        'No recipients found for notification email. Configure adminNotificationEmails in email settings.'
      )
      return
    }

    // Send email to each recipient
    for (const email of to) {
      await payload.sendEmail({
        to: email,
        subject,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px;">${subject}</h1>
            <div style="line-height: 1.5; color: #444;">
              ${message}
            </div>
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
              <p>This is an automated notification from your OTT CMS.</p>
            </div>
          </div>
        `,
      })

      logger.info(
        { context: 'sendNotificationEmail' },
        `Notification email sent to ${email}: ${subject}`
      )
    }
  } catch (error) {
    logger.error(
      { context: 'sendNotificationEmail', error },
      'Failed to send notification email'
    )
    throw error
  }
}
