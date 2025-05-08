// Content collection - organizes full content entities with references to videos
// @ts-nocheck - Disable TypeScript checking for this file due to type issues with collection references
import type { CollectionConfig } from 'payload'
import { authenticated } from '@/access/authenticated'
import { slugField } from '@/fields/slug'
import { createCollectionLoggingHooks } from '@/hooks/logging/payloadLoggingHooks'
import { enforcePublishingWindow } from '@/hooks/content/enforcePublishingWindow'
import { updateContentStatus } from '@/hooks/content/updateContentStatus'

export const Content: CollectionConfig = {
  slug: 'content',
  versions: {
    drafts: {
      autosave: {
        interval: 100,
      },
      schedulePublish: true,
      validate: false,
    },
    maxPerDoc: 100,
  },
  labels: {
    singular: 'Content',
    plural: 'Content',
  },
  defaultSort: ['-createdAt'],
  access: {
    read: enforcePublishingWindow,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: [
      'publishingStatus',
      'title',
      'status',
      'isPublished',
      'tags',
      'publishAt',
      'unpublishAt',
      'createdAt',
    ],
    group: 'Content Library',
    components: {
      beforeListTable: ['@/collections/Content/components/ExportButtonBar'],
    },
  },
  defaultPopulate: {
    title: true,
    slug: true,
    tags: true,
    meta: {
      image: true,
      description: true,
    },
  },
  fields: [
    {
      name: 'publishingStatus',
      type: 'ui',
      admin: {
        components: {
          Cell: '@/collections/Content/components/PublishingStatusCell',
        },
      },
    },
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
    {
      name: 'creators',
      type: 'relationship',
      relationTo: 'creators',
      hasMany: true,
      admin: {
        description: 'Creators associated with this content',
      },
    },
    {
      name: 'tags',
      type: 'array',
      label: 'Tags',
      admin: {
        description: 'Add relevant keywords for filtering and discovery',
        components: {
          Cell: '@/collections/Content/components/TagsCell',
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
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        {
          label: 'Draft',
          value: 'draft',
        },
        {
          label: 'Published',
          value: 'published',
        },
      ],
      admin: {
        position: 'sidebar',
        description: 'Content status (draft or published)',
      },
    },
    {
      name: 'isPublished',
      type: 'checkbox',
      label: 'Published',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Uncheck to hide this content from users.',
      },
    },
    {
      name: 'isFree',
      type: 'checkbox',
      label: 'Free Content',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Make this content available to all users without subscription.',
      },
    },
    {
      name: 'requiredPlans',
      label: 'Plans That Unlock This Content',
      type: 'relationship',
      relationTo: 'subscription-plans',
      hasMany: true,
      admin: {
        position: 'sidebar',
        description:
          'Only users subscribed to these plan(s) can access. Leave blank = open to all subscribers.',
        condition: (data) => data?.isFree !== true,
        components: {
          Field: '@/collections/Content/components/RequiredPlansField',
        },
      },
    },
    {
      name: 'publishAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        description: 'Schedule when this content should go live.',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'unpublishAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        description: 'Schedule when this content should expire.',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: '_scheduledPublishing',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: '@/collections/Content/components/ScheduledPublishingField',
        },
      },
    },
    {
      name: '_scheduledUnpublishing',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: '@/collections/Content/components/ScheduledUnpublishingField',
        },
      },
    },
    {
      name: '_manualPublishingNote',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: '@/collections/Content/components/ManualPublishingNoteField',
        },
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
    ...createCollectionLoggingHooks('content'),
    // Add existing hooks
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
          data.meta.canonicalURL = `${baseUrl}/content/${data.slug}`
        }

        // Set meta.image from posterImage if not provided
        if (!data.meta.image && data.posterImage) {
          data.meta.image = data.posterImage
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
    beforeChange: [
      updateContentStatus,
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
