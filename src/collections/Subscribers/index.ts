// src/collections/Subscribers/index.ts
import type { CollectionConfig } from 'payload'
import { authenticated } from '@/access/authenticated'
import { createCollectionLoggingHooks } from '@/hooks/logging/payloadLoggingHooks'

export const Subscribers: CollectionConfig = {
  slug: 'subscribers',
  labels: {
    singular: 'Subscriber',
    plural: 'Subscribers',
  },
  defaultSort: ['-createdAt'],
  access: {
    read: authenticated,
    create: () => true, // Allow public creation during checkout
    update: authenticated,
    delete: authenticated,
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['fullName', 'email', 'paymentProvider', 'subscriptionStatus', 'createdAt'],
    group: 'Users',
    description: 'Subscribers who have registered or made purchases on the platform',
  },
  fields: [
    {
      name: 'fullName',
      type: 'text',
      required: true,
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
    },
    {
      name: 'paymentProvider',
      type: 'select',
      options: [
        { label: 'Stripe', value: 'stripe' },
        { label: 'PayPal', value: 'paypal' },
        { label: 'Unknown', value: 'unknown' },
      ],
      defaultValue: 'unknown',
      admin: {
        description: 'The payment provider used by this subscriber',
      },
    },
    {
      name: 'paymentProviderCustomerId',
      type: 'text',
      label: 'Payment Provider Customer ID',
      admin: {
        description: 'Stripe Customer ID or PayPal Payer ID',
      },
    },
    {
      name: 'subscriptionStatus',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Trialing', value: 'trialing' },
        { label: 'Past Due', value: 'past_due' },
        { label: 'Canceled', value: 'canceled' },
        { label: 'None', value: 'none' },
      ],
      defaultValue: 'none',
      admin: {
        description: 'Current subscription status',
      },
    },
    {
      name: 'subscriptionExpiresAt',
      type: 'date',
      admin: {
        description: 'Date when the current subscription expires',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'activePlans',
      type: 'relationship',
      relationTo: 'subscription-plans',
      hasMany: true,
      admin: {
        description: 'Active subscription plans',
      },
    },
    {
      name: 'purchasedRentals',
      type: 'relationship',
      relationTo: 'content',
      hasMany: true,
      admin: {
        description: 'Content items rented by this subscriber',
      },
    },
    {
      name: 'rentalExpirations',
      type: 'array',
      admin: {
        description: 'Expiration dates for rented content',
      },
      fields: [
        {
          name: 'contentId',
          type: 'relationship',
          relationTo: 'content',
          required: true,
        },
        {
          name: 'expiresAt',
          type: 'date',
          required: true,
          admin: {
            date: {
              pickerAppearance: 'dayAndTime',
            },
          },
        },
      ],
    },
    {
      name: 'purchasedPPV',
      type: 'relationship',
      relationTo: 'live-events',
      hasMany: true,
      admin: {
        description: 'Pay-per-view live events purchased by this subscriber',
      },
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        description: 'Associated user account (if authenticated)',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Administrative notes about this subscriber',
      },
    },
    {
      name: 'subscriberToken',
      type: 'text',
      admin: {
        description: 'Authentication token for this subscriber',
        position: 'sidebar',
      },
      access: {
        read: ({ req }) => req.user !== undefined,
      },
      hooks: {
        beforeValidate: [
          ({ value, operation }) => {
            // Generate a token if one doesn't exist on creation
            if (operation === 'create' && !value) {
              return require('crypto').randomBytes(32).toString('hex')
            }
            return value
          },
        ],
      },
    },
  ],
  hooks: {
    ...createCollectionLoggingHooks('subscribers'),
  },
}

export default Subscribers
