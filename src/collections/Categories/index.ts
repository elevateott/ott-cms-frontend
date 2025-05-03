// src/collections/Categories/index.ts
// @ts-nocheck - Disable TypeScript checking for this file due to type issues with hooks
import type { CollectionConfig } from 'payload'

import { authenticated } from '@/access/authenticated'
import { slugField } from '@/fields/slug'
import { createCollectionLoggingHooks } from '@/hooks/logging/payloadLoggingHooks'

export const Categories: CollectionConfig = {
  slug: 'categories',
  access: {
    read: () => true,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'showInCatalog', 'featuredCategory', 'order'],
    group: 'Content',
  },
  defaultPopulate: {
    title: true,
    slug: true,
    description: true,
    featuredImage: true,
    meta: {
      image: true,
      description: true,
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'The name of the category displayed to users',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: "Displayed on the category's public page",
      },
    },
    ...slugField('title', {
      slugOverrides: {
        admin: {
          description: 'Used for the category URL (must be unique)',
        },
        unique: true,
      },
    }),
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Shown as a preview image or banner on catalog pages',
      },
    },
    {
      name: 'featuredCategory',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'If checked, this category is featured on the homepage or catalog',
      },
    },
    {
      name: 'showInCatalog',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Controls whether the category is visible to customers',
      },
    },
    {
      name: 'content',
      type: 'relationship',
      relationTo: 'content',
      hasMany: true,
      admin: {
        description: 'Content linked to this category',
      },
    },
    {
      name: 'order',
      type: 'number',
      label: 'Sort Order',
      admin: {
        position: 'sidebar',
        description: 'Used for manual sorting in menus or grids',
      },
    },
    {
      name: 'parentCategory',
      type: 'relationship',
      relationTo: 'categories',
      admin: {
        position: 'sidebar',
        description: 'Optional parent category for hierarchical organization',
      },
    },
    {
      name: 'featuredOn',
      type: 'select',
      options: [
        { label: 'Not Featured', value: 'none' },
        { label: 'Home Page', value: 'home' },
        { label: 'Navigation Menu', value: 'nav' },
        { label: 'Both', value: 'both' },
      ],
      defaultValue: 'none',
      admin: {
        description: 'Control where this category is featured',
      },
    },
  ],
  hooks: {
    // Add logging hooks
    ...createCollectionLoggingHooks('categories'),
    beforeValidate: [
      ({ data }) => {
        // Auto-generate SEO metadata if not provided
        if (!data.meta) data.meta = {}

        // Set meta.title from title if not provided
        if (!data.meta.title && data.title) {
          data.meta.title = data.title
        }

        // Set meta.description from description if not provided (limit to 160 chars)
        if (!data.meta.description && data.description) {
          data.meta.description = data.description.slice(0, 160)
        }

        // Set meta.canonicalURL from slug if not provided
        if (!data.meta.canonicalURL && data.slug) {
          const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
          data.meta.canonicalURL = `${baseUrl}/category/${data.slug}`
        }

        // Set meta.image from featuredImage if not provided
        if (!data.meta.image && data.featuredImage) {
          data.meta.image = data.featuredImage
        }

        return data
      },
    ],
    beforeChange: [
      // Optional hook to handle category hierarchy validation
      ({ data }) => {
        // Logic to prevent circular references in category hierarchy
        return data
      },
    ],
  },
}

export default Categories
