/**
 * API route for sending test emails
 *
 * This route allows testing the Resend email integration
 * by sending a test email to a specified address.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { logger } from '@/utils/logger'

export async function POST(request: NextRequest) {
  try {
    const { toEmail, subject, message } = await request.json()

    // Validate required fields
    if (!toEmail || !subject || !message) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: toEmail, subject, or message' },
        { status: 400 },
      )
    }

    // Initialize Payload
    const payload = await getPayload({ config: configPromise })

    // Log the request
    logger.info({ context: 'send-test-email' }, `Sending test email to ${toEmail}`, { subject })

    // Get email settings from the database
    const emailSettings = await payload.findGlobal({
      slug: 'email-settings',
    })

    // Check if email is configured
    if (!emailSettings?.resendEnabled && !process.env.RESEND_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Email sending is not configured. Please configure email settings in the admin panel.',
        },
        { status: 400 },
      )
    }

    // Send the email using Payload's email adapter
    await payload.sendEmail({
      to: toEmail,
      subject,
      html: `<div>${message}</div>`,
    })

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error(
      { context: 'send-test-email' },
      `Error sending test email: ${error instanceof Error ? error.message : String(error)}`,
    )

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST method to send a test email',
    usage: {
      method: 'POST',
      body: {
        toEmail: 'recipient@example.com',
        subject: 'Test Email',
        message: 'This is a test email from the OTT CMS platform.',
      },
    },
  })
}
