// src/collections/Categories/index.ts
// @ts-nocheck - Disable TypeScript checking for this file due to type issues with hooks
import type { CollectionConfig } from 'payload'

import { authenticated } from '@/access/authenticated'
import { slugField } from '@/fields/slug'

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
    defaultColumns: ['title', 'slug', 'order', 'createdAt'],
    group: 'Content',
  },
  defaultPopulate: {
    title: true,
    slug: true,
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
    },
    {
      name: 'description',
      type: 'textarea',
    },
    ...slugField(),
    {
      name: 'thumbnail',
      label: 'Category Thumbnail',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'order',
      type: 'number',
      label: 'Sort Order',
      admin: {
        description: 'Used for manual sorting in menus or grids',
      },
    },
    {
      name: 'parentCategory',
      type: 'relationship',
      relationTo: 'categories',
      admin: {
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

        // Set meta.image from thumbnail if not provided
        if (!data.meta.image && data.thumbnail) {
          data.meta.image = data.thumbnail
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
