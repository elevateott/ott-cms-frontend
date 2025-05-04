// src/collections/Series/index.ts
import type { CollectionConfig } from 'payload'
import { authenticated } from '@/access/authenticated'
import { slugField } from '@/fields/slug'
import { createCollectionLoggingHooks } from '@/hooks/logging/payloadLoggingHooks'

export const Series: CollectionConfig = {
  slug: 'series',
  labels: {
    singular: 'Series',
    plural: 'Series',
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
    defaultColumns: ['title', 'slug', 'tags', 'isFeatured', 'isFree', 'price', 'createdAt'],
    group: 'Content Library',
  },
  defaultPopulate: {
    title: true,
    slug: true,
    description: true,
    thumbnail: true,
    tags: true,
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
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: {
        description: 'Main thumbnail image for this series',
      },
    },
    {
      name: 'trailer',
      type: 'relationship',
      relationTo: 'videoassets',
      required: false,
      admin: {
        description: 'Optional video trailer shown before watching the full series',
      },
    },
    {
      name: 'content',
      type: 'relationship',
      relationTo: 'content',
      hasMany: true,
      admin: {
        description:
          'Episodes or videos that are part of this series (custom order will be preserved)',
      },
    },
    {
      name: 'creators',
      type: 'relationship',
      relationTo: 'creators',
      hasMany: true,
      admin: {
        description: 'Creators associated with this series',
      },
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      admin: {
        description: 'Categories this series belongs to',
      },
    },
    {
      name: 'tags',
      type: 'array',
      label: 'Tags',
      admin: {
        description: 'Add relevant keywords for filtering and discovery',
        components: {
          Cell: '@/collections/Series/components/TagsCell',
        },
      },
      fields: [
        {
          type: 'text',
          name: 'value',
          required: true,
        },
      ],
    },
    {
      name: 'layout',
      type: 'select',
      options: [
        { label: 'Grid', value: 'grid' },
        { label: 'List', value: 'list' },
        { label: 'Carousel', value: 'carousel' },
      ],
      defaultValue: 'grid',
      admin: {
        description: 'How the series content is displayed on the frontend',
      },
    },
    {
      name: 'isFeatured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Mark this series as featured on the homepage or catalog',
      },
    },
    {
      name: 'isFree',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Allows free access to this series',
      },
    },
    {
      name: 'price',
      type: 'number',
      admin: {
        position: 'sidebar',
        description: 'Optional price for the series if monetized individually',
        condition: (data) => !data.isFree,
      },
    },
    {
      name: 'isPublished',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Controls whether this series is publicly visible',
      },
    },
    {
      name: 'publishAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayAndTime',
        },
        description: 'When to automatically publish this series',
      },
    },
    {
      name: 'unpublishAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayAndTime',
        },
        description: 'When to automatically unpublish this series',
      },
    },
    {
      name: 'createdAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
        components: {
          Cell: '@/components/FormattedDateCell',
        },
      },
      access: {
        create: () => false,
        update: () => false,
      },
    },

    {
      name: '_seoPreview',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: '@/components/admin/SimpleSEOPreview',
        },
      },
    },
    {
      name: '_socialSharing',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: '@/components/admin/SocialSharingPanel',
        },
      },
    },
  ],
  hooks: {
    // Add logging hooks
    ...createCollectionLoggingHooks('series'),
    // Add validation hooks
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

        // Set meta.image from thumbnail if not provided
        if (!data.meta.image && data.thumbnail) {
          data.meta.image = data.thumbnail
        }

        // Set meta.canonicalURL from slug if not provided
        if (!data.meta.canonicalURL && data.slug) {
          const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
          data.meta.canonicalURL = `${baseUrl}/series/${data.slug}`
        }

        // Add social media settings if not provided
        if (!data.meta.socialMedia) {
          data.meta.socialMedia = {
            twitterCard: 'summary_large_image',
          }
        }

        return data
      },
    ],
  },
  timestamps: true,
}

export default Series
