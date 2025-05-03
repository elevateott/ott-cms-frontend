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
    defaultColumns: ['name', 'price', 'purchaseCount', 'createdAt'],
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
      name: 'price',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Price in USD (e.g., 9.99)',
        step: 0.01,
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
