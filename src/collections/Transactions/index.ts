// src/collections/Transactions/index.ts
import type { CollectionConfig } from 'payload'
import { authenticated } from '@/access/authenticated'
import { createCollectionLoggingHooks } from '@/hooks/logging/payloadLoggingHooks'

export const Transactions: CollectionConfig = {
  slug: 'transactions',
  labels: {
    singular: 'Transaction',
    plural: 'Transactions',
  },
  defaultSort: ['-createdAt'],
  access: {
    read: authenticated,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'type', 'amount', 'paymentProvider', 'status', 'createdAt'],
    group: 'Monetization',
    description: 'Track all financial transactions in the system',
    components: {
      // Temporarily comment out the custom list view until we fix the component
      // views: {
      //   list: {
      //     Component: () => null,
      //   },
      // },
    },
    // Add custom filters
    // Temporarily comment out filters until we fix the type issues
    // filters: [
    //   {
    //     field: 'type',
    //     label: 'Transaction Type',
    //     type: 'select',
    //     options: ['subscription', 'ppv', 'rental', 'product'],
    //   },
    //   {
    //     field: 'paymentProvider',
    //     label: 'Payment Provider',
    //     type: 'select',
    //     options: ['stripe', 'paypal', 'manual'],
    //   },
    //   {
    //     field: 'status',
    //     label: 'Status',
    //     type: 'select',
    //     options: ['completed', 'pending', 'failed', 'refunded'],
    //   },
    // ],
    // Enable search by email and transaction ID
    listSearchableFields: ['email', 'transactionId', 'subscriber'],
  },
  fields: [
    // Basic information
    {
      name: 'email',
      type: 'email',
      required: true,
      admin: {
        description: 'Email address of the customer',
      },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Subscription', value: 'subscription' },
        { label: 'Pay-Per-View', value: 'ppv' },
        { label: 'Rental', value: 'rental' },
        { label: 'Digital Product', value: 'product' },
      ],
      admin: {
        description: 'Type of transaction',
        components: {
          Cell: '@/collections/Transactions/components/TransactionTypeCell',
        },
      },
    },
    {
      name: 'amount',
      type: 'number',
      required: true,
      admin: {
        description: 'Amount charged in the transaction (in cents)',
        step: 1,
        components: {
          Cell: '@/collections/Transactions/components/TransactionAmountCell',
        },
      },
    },
    {
      name: 'currency',
      type: 'text',
      defaultValue: 'USD',
      admin: {
        description: 'Currency code (e.g., USD)',
      },
    },
    {
      name: 'paymentProvider',
      type: 'select',
      required: true,
      options: [
        { label: 'Stripe', value: 'stripe' },
        { label: 'PayPal', value: 'paypal' },
        { label: 'Manual', value: 'manual' },
      ],
      admin: {
        description: 'Payment provider used for the transaction',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'completed',
      options: [
        { label: 'Completed', value: 'completed' },
        { label: 'Pending', value: 'pending' },
        { label: 'Failed', value: 'failed' },
        { label: 'Refunded', value: 'refunded' },
      ],
      admin: {
        description: 'Current status of the transaction',
        components: {
          Cell: '@/collections/Transactions/components/TransactionStatusCell',
        },
      },
    },
    // Related entities
    {
      name: 'subscriber',
      type: 'relationship',
      relationTo: 'subscribers',
      admin: {
        description: 'Related subscriber record',
      },
    },

    {
      name: 'event',
      type: 'relationship',
      relationTo: 'live-events',
      admin: {
        description: 'Related live event (for PPV or rental)',
        condition: (data) => data?.type === 'ppv' || data?.type === 'rental',
      },
    },
    {
      name: 'content',
      type: 'relationship',
      relationTo: 'content',
      admin: {
        description: 'Related content (for rental)',
        condition: (data) => data?.type === 'rental',
      },
    },
    {
      name: 'plan',
      type: 'relationship',
      relationTo: 'subscription-plans',
      admin: {
        description: 'Related subscription plan',
        condition: (data) => data?.type === 'subscription',
      },
    },
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'digital-products',
      admin: {
        description: 'Related digital product',
        condition: (data) => data?.type === 'product',
      },
    },
    // Payment details
    {
      name: 'transactionId',
      type: 'text',
      admin: {
        description: 'External transaction ID from payment provider',
        position: 'sidebar',
      },
    },
    {
      name: 'paymentMethod',
      type: 'text',
      admin: {
        description: 'Payment method used (e.g., credit card, PayPal)',
        position: 'sidebar',
      },
    },
    {
      name: 'metadata',
      type: 'json',
      admin: {
        description: 'Additional metadata from the payment provider',
        position: 'sidebar',
      },
    },
    // For rentals
    {
      name: 'rentalDuration',
      type: 'number',
      admin: {
        description: 'Duration of rental in hours',
        condition: (data) => data?.type === 'rental',
      },
    },
    {
      name: 'expiresAt',
      type: 'date',
      admin: {
        description: 'When the rental expires',
        condition: (data) => data?.type === 'rental',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    // Notes
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Administrative notes about this transaction',
        position: 'sidebar',
      },
    },
    // Timestamps
    {
      name: 'createdAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
  ],
  hooks: {
    ...createCollectionLoggingHooks('transactions'),
    beforeValidate: [
      ({ data, operation }) => {
        // Set createdAt on creation
        if (operation === 'create') {
          return {
            ...data,
            createdAt: new Date().toISOString(),
          }
        }
        return data
      },
    ],
  },
}

export default Transactions
