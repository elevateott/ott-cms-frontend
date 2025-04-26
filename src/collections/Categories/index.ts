// src/collections/Categories/index.ts
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
