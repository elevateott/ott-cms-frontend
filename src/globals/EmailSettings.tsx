// src/globals/EmailSettings.tsx
import type { GlobalConfig } from 'payload'
import { authenticated } from '@/access/authenticated'

const EmailSettings: GlobalConfig = {
  slug: 'email-settings',
  access: {
    read: () => true,
    update: authenticated,
  },
  admin: {
    group: 'Settings',
    description:
      'Configure email service provider settings for notifications and transactional emails',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Resend',
          description: 'Configure Resend email service settings',
          fields: [
            {
              name: 'resendEnabled',
              label: 'Enable Resend',
              type: 'checkbox',
              defaultValue: false,
              admin: {
                description: 'Enable Resend as the email service provider',
              },
            },
            {
              name: 'resendApiKey',
              label: 'Resend API Key',
              type: 'text',
              admin: {
                description: 'API key for Resend integration. Create in the Resend dashboard.',
                components: {
                  Field: '@/components/fields/SecureTextField',
                },
              },
              access: {
                read: authenticated,
              },
            },
            {
              name: 'resendFromAddress',
              label: 'From Email Address',
              type: 'email',
              admin: {
                description:
                  'The email address that will appear as the sender (must be verified in Resend)',
              },
            },
            {
              name: 'resendFromName',
              label: 'From Name',
              type: 'text',
              admin: {
                description: 'The name that will appear as the sender',
              },
            },
            {
              type: 'ui',
              name: 'resendInstructions',
              admin: {
                position: 'sidebar',
                components: {
                  Field: '@/components/admin/EmailSettings/ResendInstructions',
                },
              },
            },
          ],
        },
        {
          label: 'SMTP',
          description: 'Configure SMTP email service settings (for future use)',
          fields: [
            {
              name: 'smtpPlaceholder',
              type: 'ui',
              admin: {
                components: {
                  Field: '@/components/admin/EmailSettings/SmtpPlaceholder',
                },
              },
            },
          ],
        },
        {
          label: 'Notifications',
          description: 'Configure system notification settings',
          fields: [
            {
              name: 'adminNotificationEmails',
              label: 'Admin Notification Emails',
              type: 'text',
              admin: {
                description:
                  'Comma-separated list of email addresses to receive system notifications',
              },
            },
            {
              name: 'notifyOnStreamActive',
              label: 'Notify When Stream Goes Live',
              type: 'checkbox',
              defaultValue: true,
              admin: {
                description: 'Send email notifications when a stream becomes active',
              },
            },
            {
              name: 'notifyOnStreamDisconnected',
              label: 'Notify When Stream Disconnects',
              type: 'checkbox',
              defaultValue: true,
              admin: {
                description: 'Send email notifications when a stream disconnects',
              },
            },
            {
              name: 'notifyOnRecordingReady',
              label: 'Notify When Recording is Ready',
              type: 'checkbox',
              defaultValue: true,
              admin: {
                description: 'Send email notifications when a recording is ready',
              },
            },
          ],
        },
        {
          label: 'Test',
          description: 'Test email configuration',
          fields: [
            {
              name: 'testEmailInfo',
              type: 'ui',
              admin: {
                components: {
                  Field: '@/components/admin/EmailSettings/TestEmailInfo',
                },
              },
            },
          ],
        },
      ],
    },
  ],
}

export default EmailSettings
