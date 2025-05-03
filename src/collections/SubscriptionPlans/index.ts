// src/collections/SubscriptionPlans/index.ts
import type { CollectionConfig } from 'payload'
import { authenticated } from '@/access/authenticated'
import { slugField } from '@/fields/slug'
import { createCollectionLoggingHooks } from '@/hooks/logging/payloadLoggingHooks'

export const SubscriptionPlans: CollectionConfig = {
  slug: 'subscription-plans',
  labels: {
    singular: 'Subscription Plan',
    plural: 'Subscription Plans',
  },
  defaultSort: 'order',
  access: {
    read: () => true, // Public read access for displaying plans
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'price', 'interval', 'isActive', 'createdAt'],
    group: 'Monetization',
    description: 'Subscription plans available for purchase',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    ...slugField(),
    {
      name: 'price',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Price in cents (e.g., 1000 = $10.00)',
      },
    },
    {
      name: 'interval',
      type: 'select',
      options: [
        { label: 'Monthly', value: 'month' },
        { label: 'Yearly', value: 'year' },
      ],
      defaultValue: 'month',
      required: true,
    },
    {
      name: 'trialPeriodDays',
      type: 'number',
      min: 0,
      defaultValue: 0,
      admin: {
        description: 'Number of days for the trial period (0 for no trial)',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Whether this plan is currently available for purchase',
        position: 'sidebar',
      },
    },
    {
      name: 'isDefault',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether this is the default plan (highlighted in UI)',
        position: 'sidebar',
      },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Display order (lower numbers appear first)',
        position: 'sidebar',
      },
    },
    {
      name: 'features',
      type: 'array',
      admin: {
        description: 'List of features included in this plan',
      },
      fields: [
        {
          name: 'feature',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'stripePriceId',
      type: 'text',
      admin: {
        description: 'Stripe Price ID for this plan',
        condition: (data) => data?.paymentProvider === 'stripe' || !data?.paymentProvider,
      },
    },
    {
      name: 'paypalPlanId',
      type: 'text',
      admin: {
        description: 'PayPal Plan ID for this plan',
        condition: (data) => data?.paymentProvider === 'paypal' || !data?.paymentProvider,
      },
    },
    {
      name: 'paymentProvider',
      type: 'select',
      options: [
        { label: 'All Providers', value: 'all' },
        { label: 'Stripe Only', value: 'stripe' },
        { label: 'PayPal Only', value: 'paypal' },
      ],
      defaultValue: 'all',
      admin: {
        description: 'Which payment provider(s) this plan is available through',
        position: 'sidebar',
      },
    },
  ],
  hooks: {
    ...createCollectionLoggingHooks('subscription-plans'),
  },
}

export default SubscriptionPlans
