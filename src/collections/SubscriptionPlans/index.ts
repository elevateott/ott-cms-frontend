// src/collections/SubscriptionPlans/index.ts
import type { CollectionConfig } from 'payload'
import { authenticated } from '@/access/authenticated'
import { slugField } from '@/fields/slug'
import { createCollectionLoggingHooks } from '@/hooks/logging/payloadLoggingHooks'
import { createStripePlan } from '@/services/stripe/createPlan'
import { createPayPalPlan } from '@/services/paypal/createPlan'
import { hasPlanSubscribers } from '@/services/subscription/hasPlanSubscribers'
import { logger } from '@/utils/logger'

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
    components: {
      // Add custom components to the edit view
      beforeFields: [
        '@/collections/SubscriptionPlans/components/PlanDetails',
        '@/collections/SubscriptionPlans/components/PlanTrialInfo',
        '@/collections/SubscriptionPlans/components/PlanEditingInfo',
      ],
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'The name of the subscription plan',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'A detailed description of what this plan includes',
      },
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
      hooks: {
        beforeValidate: [
          async ({ value, data, operation, originalDoc, req }) => {
            // Only validate on update
            if (operation === 'update') {
              // Check if price is being changed
              if (originalDoc && originalDoc.price !== value) {
                // Check if plan has subscribers
                const hasSubscribers = await hasPlanSubscribers(req.payload, originalDoc.id)
                if (hasSubscribers) {
                  throw new Error('Cannot change price for a plan that has active subscribers')
                }
              }
            }
            return value
          },
        ],
      },
    },
    {
      name: 'interval',
      type: 'select',
      options: [
        { label: 'Monthly', value: 'month' },
        { label: 'Quarterly', value: 'quarter' },
        { label: 'Semi-Annual', value: 'semi-annual' },
        { label: 'Yearly', value: 'year' },
      ],
      defaultValue: 'month',
      required: true,
      admin: {
        description: 'Billing interval for this subscription',
      },
      hooks: {
        beforeValidate: [
          async ({ value, data, operation, originalDoc, req }) => {
            // Only validate on update
            if (operation === 'update') {
              // Check if interval is being changed
              if (originalDoc && originalDoc.interval !== value) {
                // Check if plan has subscribers
                const hasSubscribers = await hasPlanSubscribers(req.payload, originalDoc.id)
                if (hasSubscribers) {
                  throw new Error(
                    'Cannot change billing interval for a plan that has active subscribers',
                  )
                }
              }
            }
            return value
          },
        ],
      },
    },
    {
      name: 'trialPeriodDays',
      type: 'number',
      min: 0,
      max: 30,
      defaultValue: 0,
      admin: {
        description: 'Free Trial (Days) - 0 = no trial. Up to 30 days allowed.',
      },
      hooks: {
        beforeValidate: [
          async ({ value, data, operation, originalDoc, req }) => {
            // Only validate on update
            if (operation === 'update') {
              // Check if trial period is being changed
              if (originalDoc && originalDoc.trialPeriodDays !== value) {
                // Check if plan has subscribers
                const hasSubscribers = await hasPlanSubscribers(req.payload, originalDoc.id)
                if (hasSubscribers) {
                  throw new Error(
                    'Cannot change trial period for a plan that has active subscribers',
                  )
                }
              }
            }
            return value
          },
        ],
      },
    },
    {
      name: 'setupFeeAmount',
      type: 'number',
      min: 0,
      defaultValue: 0,
      admin: {
        description:
          'Setup Fee (Paid Trial) - Optional one-time fee charged before trial starts, in cents (e.g., 500 = $5.00)',
      },
      hooks: {
        beforeValidate: [
          async ({ value, data, operation, originalDoc, req }) => {
            // Only validate on update
            if (operation === 'update') {
              // Check if setup fee is being changed
              if (originalDoc && originalDoc.setupFeeAmount !== value) {
                // Check if plan has subscribers
                const hasSubscribers = await hasPlanSubscribers(req.payload, originalDoc.id)
                if (hasSubscribers) {
                  throw new Error('Cannot change setup fee for a plan that has active subscribers')
                }
              }
            }
            return value
          },
        ],
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Whether this plan is currently available for purchase',
        position: 'sidebar',
        components: {
          Cell: '@/collections/SubscriptionPlans/components/PlanStatusCell',
        },
      },
    },
    {
      name: 'version',
      type: 'number',
      defaultValue: 1,
      admin: {
        description: 'Plan version number',
        readOnly: true,
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
      name: 'stripeProductId',
      type: 'text',
      admin: {
        description: 'Stripe Product ID (automatically generated)',
        readOnly: true,
        position: 'sidebar',
        condition: (data) => data?.paymentProvider !== 'paypal',
      },
    },
    {
      name: 'stripePriceId',
      type: 'text',
      admin: {
        description: 'Stripe Price ID (automatically generated)',
        readOnly: true,
        position: 'sidebar',
        condition: (data) => data?.paymentProvider !== 'paypal',
      },
    },
    {
      name: 'stripeSetupFeeId',
      type: 'text',
      admin: {
        description: 'Stripe Setup Fee Price ID (automatically generated)',
        readOnly: true,
        position: 'sidebar',
        condition: (data) => data?.setupFeeAmount > 0 && data?.paymentProvider !== 'paypal',
      },
    },
    {
      name: 'paypalProductId',
      type: 'text',
      admin: {
        description: 'PayPal Product ID (automatically generated)',
        readOnly: true,
        position: 'sidebar',
        condition: (data) => data?.paymentProvider !== 'stripe',
      },
    },
    {
      name: 'paypalPlanId',
      type: 'text',
      admin: {
        description: 'PayPal Plan ID (automatically generated)',
        readOnly: true,
        position: 'sidebar',
        condition: (data) => data?.paymentProvider !== 'stripe',
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
      hooks: {
        beforeValidate: [
          async ({ value, data, operation, originalDoc, req }) => {
            // Only validate on update
            if (operation === 'update') {
              // Check if payment provider is being changed
              if (originalDoc && originalDoc.paymentProvider !== value) {
                // Check if plan has subscribers
                const hasSubscribers = await hasPlanSubscribers(req.payload, originalDoc.id)
                if (hasSubscribers) {
                  throw new Error(
                    'Cannot change payment provider for a plan that has active subscribers',
                  )
                }
              }
            }
            return value
          },
        ],
      },
    },
    {
      name: 'createdAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
      hooks: {
        beforeChange: [
          ({ value, operation }) => {
            if (operation === 'create') {
              return new Date().toISOString()
            }
            return value
          },
        ],
      },
    },
  ],
  hooks: {
    ...createCollectionLoggingHooks('subscription-plans'),
    beforeChange: [
      async ({ data, operation, req }) => {
        // Only create payment provider plans on create
        if (operation === 'create') {
          try {
            // Create Stripe plan if not PayPal only
            if (data.paymentProvider !== 'paypal') {
              const stripeResult = await createStripePlan({
                name: data.name,
                description: data.description,
                price: data.price,
                interval: data.interval,
                trialDays: data.trialPeriodDays,
                setupFeeAmount: data.setupFeeAmount,
              })

              // Store Stripe IDs
              data.stripeProductId = stripeResult.productId
              data.stripePriceId = stripeResult.priceId
              if (stripeResult.setupFeeId) {
                data.stripeSetupFeeId = stripeResult.setupFeeId
              }
            }

            // Create PayPal plan if not Stripe only
            if (data.paymentProvider !== 'stripe') {
              const paypalResult = await createPayPalPlan({
                name: data.name,
                description: data.description,
                price: data.price,
                interval: data.interval,
                trialDays: data.trialPeriodDays,
                setupFeeAmount: data.setupFeeAmount,
              })

              // Store PayPal IDs if successful
              if (paypalResult) {
                data.paypalProductId = paypalResult.productId
                data.paypalPlanId = paypalResult.planId
              }
            }
          } catch (error) {
            logger.error(
              { error, context: 'subscription-plans.beforeChange' },
              'Error creating payment provider plans',
            )
            throw new Error(`Failed to create payment provider plans: ${error.message}`)
          }
        }

        return data
      },
    ],
  },
}

export default SubscriptionPlans
