// src/collections/DiscountCodes/index.ts
import type { CollectionConfig } from 'payload'
import { authenticated } from '@/access/authenticated'
import { createCollectionLoggingHooks } from '@/hooks/logging/payloadLoggingHooks'
import { createStripeCoupon } from '@/services/stripe/createCoupon'
import { logger } from '@/utils/logger'

export const DiscountCodes: CollectionConfig = {
  slug: 'discount-codes',
  labels: {
    singular: 'Discount Code',
    plural: 'Discount Codes',
  },
  defaultSort: '-createdAt',
  access: {
    read: authenticated,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  admin: {
    useAsTitle: 'code',
    defaultColumns: ['code', 'type', 'value', 'validFrom', 'validUntil', 'usageCount', 'maxUses', 'isActive'],
    group: 'Monetization',
    description: 'Promotional discount codes for subscriptions, rentals, and PPV purchases',
  },
  fields: [
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'The code customers will enter at checkout (e.g., SUMMER20, WELCOME10)',
      },
    },
    {
      name: 'description',
      type: 'text',
      admin: {
        description: 'Internal description of this discount code',
      },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Percentage Off', value: 'percent_off' },
        { label: 'Amount Off (USD)', value: 'amount_off' },
      ],
      defaultValue: 'percent_off',
      admin: {
        description: 'Type of discount to apply',
      },
    },
    {
      name: 'value',
      type: 'number',
      required: true,
      min: 1,
      admin: {
        description: 'For percentage: 1-100 (e.g., 20 = 20% off). For amount: value in cents (e.g., 1000 = $10.00 off)',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Whether this discount code is currently active',
        position: 'sidebar',
      },
    },
    {
      name: 'validFrom',
      type: 'date',
      admin: {
        description: 'When this discount code becomes valid (leave blank for immediately)',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'validUntil',
      type: 'date',
      admin: {
        description: 'When this discount code expires (leave blank for no expiration)',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'maxUses',
      type: 'number',
      min: 0,
      admin: {
        description: 'Maximum number of times this code can be used (0 = unlimited)',
      },
    },
    {
      name: 'usageCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Number of times this code has been used',
        readOnly: true,
      },
    },
    {
      name: 'limitTo',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Subscriptions', value: 'subscriptions' },
        { label: 'PPV Events', value: 'ppv' },
        { label: 'Rentals', value: 'rentals' },
      ],
      admin: {
        description: 'Limit this discount code to specific purchase types (leave empty to apply to all)',
      },
    },
    {
      name: 'stripeCouponId',
      type: 'text',
      admin: {
        description: 'Stripe Coupon ID (automatically generated)',
        readOnly: true,
        position: 'sidebar',
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
    ...createCollectionLoggingHooks('discount-codes'),
    beforeChange: [
      async ({ data, operation, req }) => {
        // Only create Stripe coupon on create
        if (operation === 'create') {
          try {
            // Create Stripe coupon
            const stripeCouponResult = await createStripeCoupon({
              code: data.code,
              type: data.type,
              value: data.value,
              validFrom: data.validFrom,
              validUntil: data.validUntil,
              maxUses: data.maxUses,
            })

            // Store Stripe coupon ID
            data.stripeCouponId = stripeCouponResult.couponId
          } catch (error) {
            logger.error(
              { error, context: 'discount-codes-beforeChange' },
              'Error creating Stripe coupon',
            )
            throw error
          }
        }
        return data
      },
    ],
  },
}

export default DiscountCodes
