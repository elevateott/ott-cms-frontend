// src/collections/AddOns/index.ts
import type { CollectionConfig } from 'payload'
import { authenticated } from '@/access/authenticated'
import { createStripeProduct } from './hooks/createStripeProduct'
import { slugField } from '@/fields/slug'

export const AddOns: CollectionConfig = {
  slug: 'addons',
  labels: {
    singular: 'Add-On',
    plural: 'Add-Ons',
  },
  defaultSort: 'order',
  access: {
    read: () => true, // Public read access for displaying add-ons
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'purchaseCount', 'isActive', 'createdAt'],
    group: 'Monetization',
    description: 'Optional add-ons that subscribers can purchase in addition to their subscription',
  },
  hooks: {
    afterChange: [createStripeProduct],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'type',
      type: 'select',
      options: [
        { label: 'One-Time Purchase', value: 'one-time' },
        { label: 'Recurring Monthly', value: 'recurring' },
      ],
      required: true,
      admin: {
        description: 'Whether this is a one-time purchase or a recurring monthly charge',
      },
    },
    {
      name: 'pricesByCurrency',
      type: 'array',
      label: 'Prices by Currency',
      required: true,
      admin: {
        description: 'Define prices for each supported currency',
      },
      fields: [
        {
          name: 'currency',
          type: 'select',
          options: [
            { label: 'USD ($)', value: 'usd' },
            { label: 'EUR (€)', value: 'eur' },
            { label: 'GBP (£)', value: 'gbp' },
            { label: 'CAD (C$)', value: 'cad' },
            { label: 'AUD (A$)', value: 'aud' },
            { label: 'JPY (¥)', value: 'jpy' },
          ],
          required: true,
        },
        {
          name: 'amount',
          type: 'number',
          required: true,
          min: 0,
          admin: {
            description: 'Price in cents (e.g., 499 = $4.99)',
          },
        },
        {
          name: 'stripePriceId',
          type: 'text',
          admin: {
            readOnly: true,
            description: 'Stripe Price ID (automatically generated)',
          },
        },
      ],
      validate: (value) => {
        if (!value || value.length === 0) {
          return 'At least one price is required'
        }

        // Check for duplicate currencies
        const currencies = value.map((price) => price.currency)
        const uniqueCurrencies = [...new Set(currencies)]
        if (currencies.length !== uniqueCurrencies.length) {
          return 'Duplicate currencies are not allowed'
        }

        return true
      },
    },
    {
      name: 'price',
      type: 'number',
      admin: {
        description: 'Legacy price field in USD cents - maintained for backward compatibility',
        hidden: true,
      },
      hooks: {
        beforeChange: [
          ({ value, data }) => {
            // Set the price field based on the USD price in pricesByCurrency
            if (data.pricesByCurrency && data.pricesByCurrency.length > 0) {
              const usdPrice = data.pricesByCurrency.find((p) => p.currency === 'usd')
              if (usdPrice) {
                return usdPrice.amount
              }
            }
            return value || 0
          },
        ],
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Whether this add-on is currently available for purchase',
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
      name: 'purchaseCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Number of times this add-on has been purchased',
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'stripeProductId',
      type: 'text',
      admin: {
        description: 'Stripe Product ID (automatically generated)',
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'stripePriceId',
      type: 'text',
      admin: {
        description: 'Default Stripe Price ID (USD) - maintained for backward compatibility',
        readOnly: true,
        position: 'sidebar',
      },
      hooks: {
        beforeChange: [
          ({ value, data }) => {
            // If we have pricesByCurrency, use the USD price ID
            if (data.pricesByCurrency && data.pricesByCurrency.length > 0) {
              const usdPrice = data.pricesByCurrency.find((p) => p.currency === 'usd')
              if (usdPrice && usdPrice.stripePriceId) {
                return usdPrice.stripePriceId
              }
            }
            return value
          },
        ],
      },
    },
    ...slugField(),
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
}

export default AddOns
