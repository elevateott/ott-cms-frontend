// Content collection - organizes full content entities with references to videos
// @ts-nocheck - Disable TypeScript checking for this file due to type issues with collection references
import type { CollectionConfig } from 'payload'
import { authenticated } from '@/access/authenticated'
import { slugField } from '@/fields/slug'
import { createCollectionLoggingHooks } from '@/hooks/logging/payloadLoggingHooks'

export const Content: CollectionConfig = {
  slug: 'content',
  labels: {
    singular: 'Content',
    plural: 'Content Library',
  },
  defaultSort: ['-createdAt'],
  access: {
    read: () => true,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title'],
    group: 'Content',
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
      name: 'posterImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: {
        description: 'Main poster image for this content',
      },
    },
    {
      name: 'releaseDate',
      type: 'date',
      admin: {
        description: 'When this content was or will be released',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'mainVideo',
      type: 'relationship',
      relationTo: 'videoassets',
      required: true,
      admin: {
        description: 'The main video for this content',
      },
    },
    {
      name: 'trailerVideo',
      type: 'relationship',
      relationTo: 'videoassets',
      admin: {
        description: 'Optional trailer video for this content',
      },
    },
    {
      name: 'bonusVideos',
      type: 'array',
      admin: {
        description: 'Additional bonus videos for this content',
      },
      fields: [
        {
          name: 'title',
          type: 'text' as const,
          required: true,
        },
        {
          name: 'description',
          type: 'textarea' as const,
        },
        {
          name: 'video',
          type: 'relationship' as const,
          relationTo: 'videoassets' as const,
          required: true,
        },
      ],
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      admin: {
        description: 'Categories this content belongs to',
      },
    },
  ],
  hooks: {
    // Add logging hooks
    ...createCollectionLoggingHooks('content'),
    // Add existing hooks
    beforeChange: [
      ({ data, operation }) => {
        // Set default release date to now if not provided
        if (operation === 'create' && !data.releaseDate) {
          return {
            ...data,
            releaseDate: new Date().toISOString(),
          }
        }
        return data
      },
    ],
  },
}

export default Content
