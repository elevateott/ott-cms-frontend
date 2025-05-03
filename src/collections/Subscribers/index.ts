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
    defaultColumns: [
      'fullName',
      'email',
      'paymentProvider',
      'subscriptionStatus',
      'activePlansCount',
      'purchasedRentalsCount',
      'purchasedPPVCount',
      'createdAt',
    ],
    group: 'Monetization',
    description: 'Manage customer subscriptions, rentals, and purchases',
    components: {
      // Add custom components to the edit view
      beforeFields: ['@/collections/Subscribers/components/SubscriberDetails'],
      views: {
        List: '@/collections/Subscribers/components/SubscribersList',
      },
    },
    // Add custom filters
    filters: [
      {
        field: 'subscriptionStatus',
        label: 'Subscription Status',
        type: 'select',
        options: ['active', 'trialing', 'past_due', 'canceled', 'none'],
      },
      {
        field: 'paymentProvider',
        label: 'Payment Provider',
        type: 'select',
        options: ['stripe', 'paypal', 'unknown'],
      },
    ],
    // Enable search by name and email
    listSearchableFields: ['fullName', 'email', 'paymentProviderCustomerId'],
  },
  fields: [
    // Virtual fields for list view counts
    {
      name: 'activePlansCount',
      type: 'text',
      admin: {
        hidden: true, // Hide in the edit form
        components: {
          Cell: '@/collections/Subscribers/components/ActivePlansCountCell',
        },
      },
    },
    {
      name: 'purchasedRentalsCount',
      type: 'text',
      admin: {
        hidden: true, // Hide in the edit form
        components: {
          Cell: '@/collections/Subscribers/components/PurchasedRentalsCountCell',
        },
      },
    },
    {
      name: 'purchasedPPVCount',
      type: 'text',
      admin: {
        hidden: true, // Hide in the edit form
        components: {
          Cell: '@/collections/Subscribers/components/PurchasedPPVCountCell',
        },
      },
    },
    // Basic information
    {
      name: 'fullName',
      type: 'text',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
    },
    // Payment information
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
        components: {
          Cell: '@/collections/Subscribers/components/PaymentProviderCell',
        },
      },
    },
    {
      name: 'paymentProviderCustomerId',
      type: 'text',
      label: 'Payment Provider Customer ID',
      admin: {
        description: 'Stripe Customer ID or PayPal Payer ID',
        position: 'sidebar',
      },
    },
    // Subscription information
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
        components: {
          Cell: '@/collections/Subscribers/components/StatusCell',
        },
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
        components: {
          Cell: '@/collections/Subscribers/components/DateCell',
        },
      },
    },
    // Relationships
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
        condition: (data) => (data?.purchasedRentals?.length || 0) > 0,
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
    // Additional information
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        description: 'Associated user account (if authenticated)',
        position: 'sidebar',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Administrative notes about this subscriber',
        position: 'sidebar',
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
    // Timestamps
    {
      name: 'createdAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
        components: {
          Cell: '@/collections/Subscribers/components/DateCell',
        },
      },
    },
  ],
  hooks: {
    ...createCollectionLoggingHooks('subscribers'),
  },
}

export default Subscribers
