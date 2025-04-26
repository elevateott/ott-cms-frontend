// Videos collection with all features
import type { CollectionConfig } from 'payload'
import { authenticated } from '@/access/authenticated'
import { slugField } from '@/fields/slug'
// We don't delete Mux assets when videos are deleted in the app
import { fetchMuxMetadata } from '@/hooks/mux/updateVideoOnWebhook'

export const Videos: CollectionConfig = {
  slug: 'ott-videos',
  labels: {
    singular: 'Video',
    plural: 'Videos',
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
    defaultColumns: [
      'thumbnailPreview',
      'title',
      'sourceType',
      'category',
      'visibility',
      'status',
      'createdAt',
    ],
    group: 'Media',
    components: {
      // Add our custom components before the default list view
      beforeList: [
        '@/collections/Videos/components/VideoManagement',
        '@/components/EventMonitor',
        '@/collections/Videos/components/ListViewRefresher',
      ],
      // We'll use the beforeList to add our VideoStatusProvider
      // The provider will be added in the VideoManagement
    },
  },
  fields: [
    {
      name: 'thumbnailPreview',
      type: 'ui',
      label: '',
      admin: {
        components: {
          Cell: '@/collections/Videos/components/ThumbnailCell',
        },
      },
    },
    {
      name: 'status',
      type: 'ui',
      label: 'Status',
      admin: {
        components: {
          Cell: '@/collections/Videos/components/StatusCell',
        },
        position: 'sidebar',
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
      name: 'sourceType',
      label: 'Source',
      type: 'select',
      options: [
        { label: 'Mux', value: 'mux' },
        { label: 'Embedded', value: 'embedded' },
      ],
      defaultValue: 'mux',
      required: true,
      admin: {
        description: 'Choose how this video is delivered',
      },
    },

    {
      name: 'muxData',
      type: 'group',
      admin: {
        className: 'mux-data-group',
        condition: (data) => data.sourceType === 'mux',
      },
      fields: [
        {
          name: 'uploadId',
          type: 'text',
          admin: {
            readOnly: true,
            description: 'Mux Upload ID (automatically populated)',
          },
        },
        {
          name: 'assetId',
          type: 'text',
          admin: {
            readOnly: true,
            description: 'Mux Asset ID (automatically populated)',
          },
        },
        {
          name: 'playbackId',
          type: 'text',
          admin: {
            readOnly: true,
            description: 'Mux Playback ID (automatically populated)',
          },
        },
      ],
    },
    {
      name: 'embeddedUrl',
      type: 'text',
      admin: {
        className: 'embedded-url-field',
        description: 'Enter an HLS stream URL (e.g., from Vimeo or DaCast)',
        condition: (data) => data.sourceType === 'embedded',
      },
    },
    {
      name: 'duration',
      type: 'number',
      admin: {
        description: 'Video duration in seconds (automatically populated for Mux videos)',
      },
    },
    {
      name: 'aspectRatio',
      type: 'text',
      admin: {
        description: 'Video aspect ratio (automatically populated for Mux videos)',
      },
    },
    {
      name: 'thumbnail',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          'Custom thumbnail image (optional, overrides the auto-generated Mux thumbnail)',
      },
    },
    {
      name: 'muxThumbnailUrl',
      type: 'text',
      admin: {
        readOnly: true,
        hidden: true,
      },
      hooks: {
        beforeChange: [
          ({ siblingData }) => {
            // Clear this field if it's not a Mux video or if there's no playback ID
            if (siblingData.sourceType !== 'mux' || !siblingData.muxData?.playbackId) {
              return null
            }
            return siblingData.muxData?.playbackId
              ? `https://image.mux.com/${siblingData.muxData.playbackId}/thumbnail.jpg?width=640&height=360&fit_mode=preserve`
              : null
          },
        ],
      },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: false,
    },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Feature this video on the homepage or category pages',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
      },
    },
    // Additional fields for OTT platform
    {
      name: 'visibility',
      type: 'select',
      options: [
        { label: 'Public', value: 'public' },
        { label: 'Members Only', value: 'members' },
        { label: 'Premium', value: 'premium' },
        { label: 'Private', value: 'private' },
      ],
      defaultValue: 'public',
      admin: {
        position: 'sidebar',
        description: 'Control who can view this video',
      },
    },
    {
      name: 'releaseDate',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
        description: 'Schedule when this video will be available',
      },
    },
    {
      name: 'series',
      type: 'relationship',
      relationTo: 'categories',
      admin: {
        description: 'Add this video to a series',
      },
    },
    {
      name: 'episodeNumber',
      type: 'number',
      admin: {
        description: 'Episode number (if part of a series)',
        className: 'episode-number-field',
      },
    },
    {
      name: 'seasonNumber',
      type: 'number',
      admin: {
        description: 'Season number (if part of a series)',
        className: 'season-number-field',
      },
    },
    {
      name: 'createdAt',
      type: 'date',
      label: 'Added',
      admin: {
        position: 'sidebar',
        components: {
          Cell: '@/components/FormattedDateCell',
        },
      },
      access: {
        create: () => false,
        update: () => false,
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        if (operation === 'create' && !data.publishedAt) {
          return {
            ...data,
            publishedAt: new Date().toISOString(),
          }
        }
        return data
      },
    ],
    afterChange: [fetchMuxMetadata],
    // We don't need a beforeDelete hook since we don't want to delete Mux assets when videos are deleted
  },
}

export default Videos
