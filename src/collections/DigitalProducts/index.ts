// src/collections/DigitalProducts/index.ts
import type { CollectionConfig } from 'payload'
import { authenticated } from '@/access/authenticated'
import { createCollectionLoggingHooks } from '@/hooks/logging/payloadLoggingHooks'
import { createStripeProduct } from './hooks/createStripeProduct'

export const DigitalProducts: CollectionConfig = {
  slug: 'digital-products',
  labels: {
    singular: 'Digital Product',
    plural: 'Digital Products',
  },
  defaultSort: ['-createdAt'],
  access: {
    read: () => true, // Public read access
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'purchaseCount', 'createdAt'],
    group: 'Monetization',
    description: 'One-time digital products like eBooks, downloads, and courses',
  },
  fields: [
    // Basic information
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
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
            description: 'Price in cents (e.g., 999 = $9.99)',
            step: 1,
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
      name: 'downloadLink',
      type: 'text',
      label: 'Download URL',
      required: true,
      admin: {
        description: 'URL where the product can be downloaded or accessed',
      },
    },
    // Media
    {
      name: 'thumbnail',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Product thumbnail image',
      },
    },
    // Stripe integration
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
        description: 'Stripe Price ID (automatically generated)',
        readOnly: true,
        position: 'sidebar',
      },
    },
    // Stats
    {
      name: 'purchaseCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Number of times this product has been purchased',
        readOnly: true,
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
      },
    },
  ],
  hooks: {
    ...createCollectionLoggingHooks('digital-products'),
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
    afterChange: [createStripeProduct],
  },
}

export default DigitalProducts
