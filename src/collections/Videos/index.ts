// Updating src/collections/Videos/index.ts with more features
import type { CollectionConfig } from 'payload'
import { authenticated } from '@/access/authenticated'
import { slugField } from '@/fields/slug'
import { deleteAssetOnVideoDelete } from '@/hooks/mux/deleteAssetOnVideoDelete'
import { fetchMuxMetadata } from '@/hooks/mux/updateVideoOnWebhook'
//import { TestCustomCell } from '@/collections/Videos/components/TestCustomCell'

export const Videos: CollectionConfig = {
  slug: 'videos',
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
        '@/collections/Videos/components/VideoManagementComponent',
        '@/collections/Videos/components/DefaultListViewRefresher',
        '@/collections/Videos/components/ListViewRefreshButton',
        '@/collections/Videos/components/GlobalEventListener',
        '@/collections/Videos/components/ListViewRefresher', // Add our new ListViewRefresher component
      ],
      // We'll use the beforeList to add our VideoStatusProvider
      // The provider will be added in the VideoManagementComponent
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
          Cell: '@/collections/Videos/components/StatusField',
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
    // We don't need the muxUploaderField anymore
    {
      name: 'muxData',
      type: 'group',
      admin: {
        // Use a simple className instead of a condition
        className: 'mux-data-group',
      },
      fields: [
        {
          name: 'uploadId',
          type: 'text' as const,
          admin: {
            readOnly: true,
            description: 'Mux Upload ID (automatically populated)',
          },
        },
        {
          name: 'assetId',
          type: 'text' as const,
          admin: {
            readOnly: true,
            description: 'Mux Asset ID (automatically populated)',
          },
        },
        {
          name: 'playbackId',
          type: 'text' as const,
          admin: {
            readOnly: true,
            description: 'Mux Playback ID (automatically populated)',
          },
        },
        {
          name: 'status',
          type: 'select' as const,
          options: [
            { label: 'Uploading', value: 'uploading' },
            { label: 'Processing', value: 'processing' },
            { label: 'Ready', value: 'ready' },
            { label: 'Error', value: 'error' },
          ],
          defaultValue: 'uploading',
          admin: {
            readOnly: true,
            description: 'Current status of the Mux video',
            components: {
              Cell: '@/collections/Videos/components/StatusCell',
            },
          },
        },
      ],
    },
    {
      name: 'embeddedUrl',
      type: 'text',
      admin: {
        // Use a simple className instead of a condition
        className: 'embedded-url-field',
        description: 'Enter an HLS stream URL (e.g., from Vimeo or DaCast)',
      },
      // Remove the validate function for now as it's causing type issues
      // We'll add it back later with proper typing
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
      name: 'relatedVideos',
      type: 'relationship',
      relationTo: 'videos',
      hasMany: true,
      admin: {
        description: 'Suggest related videos to watch next',
      },
    },
    {
      name: 'series',
      type: 'relationship',
      relationTo: 'categories',
      admin: {
        description: 'Add this video to a series',
        // Remove the condition for now
      },
    },
    {
      name: 'episodeNumber',
      type: 'number',
      admin: {
        description: 'Episode number (if part of a series)',
        // Use a simple className instead of a condition
        className: 'episode-number-field',
      },
    },
    {
      name: 'seasonNumber',
      type: 'number',
      admin: {
        description: 'Season number (if part of a series)',
        // Use a simple className instead of a condition
        className: 'season-number-field',
      },
    },
    {
      name: 'createdAt',
      type: 'date',
      label: 'Added', // 👈 Custom label
      admin: {
        components: {
          Cell: '@/components/FormattedDateCell',
        },
        position: 'sidebar', // optional: keeps it in the sidebar in the edit view
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
    afterChange: [
      // Add hook to handle Mux metadata updates
      fetchMuxMetadata,
    ],
    beforeDelete: [
      // Add hook to clean up Mux assets
      deleteAssetOnVideoDelete,
    ],
  },
}

export default Videos
