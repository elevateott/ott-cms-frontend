// src/collections/LiveEventRegistrations/index.ts
import type { CollectionConfig } from 'payload'
import { authenticated } from '@/access/authenticated'
import { createCollectionLoggingHooks } from '@/hooks/logging/payloadLoggingHooks'
import crypto from 'crypto'
import { sendRegistrationConfirmationEmail } from '@/hooks/liveEvents/sendRegistrationConfirmationEmail'

export const LiveEventRegistrations: CollectionConfig = {
  slug: 'live-event-registrations',
  labels: {
    singular: 'Registration',
    plural: 'Registrations',
  },
  defaultSort: ['-createdAt'],
  access: {
    read: authenticated,
    create: () => true, // Allow public registration
    update: authenticated,
    delete: authenticated,
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['firstName', 'lastName', 'email', 'liveEvent', 'confirmed', 'reminderSent', 'createdAt'],
    group: 'Live Events',
  },
  fields: [
    {
      name: 'firstName',
      type: 'text',
      required: true,
    },
    {
      name: 'lastName',
      type: 'text',
      required: true,
    },
    {
      name: 'email',
      type: 'email',
      required: true,
    },
    {
      name: 'liveEvent',
      type: 'relationship',
      relationTo: 'live-events',
      required: true,
      admin: {
        description: 'The live event this registration is for',
      },
    },
    {
      name: 'confirmed',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether the registration has been confirmed via email',
        readOnly: true,
      },
    },
    {
      name: 'confirmationToken',
      type: 'text',
      admin: {
        description: 'Token used for email confirmation',
        hidden: true,
      },
    },
    {
      name: 'reminderSent',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether a reminder email has been sent',
        readOnly: true,
      },
    },
    {
      name: 'createdAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
      access: {
        create: () => false,
        update: () => false,
      },
    },
  ],
  hooks: {
    ...createCollectionLoggingHooks('live-event-registrations'),
    beforeValidate: [
      async ({ data, req, operation }) => {
        if (operation === 'create') {
          const { payload } = req
          
          // Check if this email is already registered for this event
          const existing = await payload.find({
            collection: 'live-event-registrations',
            where: {
              email: { equals: data.email },
              liveEvent: { equals: data.liveEvent },
            },
            limit: 1,
          })
          
          if (existing.totalDocs > 0) {
            throw new Error('You have already registered for this event.')
          }
          
          // Generate a confirmation token
          data.confirmationToken = crypto.randomBytes(32).toString('hex')
        }
        
        return data
      },
    ],
    afterChange: [sendRegistrationConfirmationEmail],
  },
}

export default LiveEventRegistrations
