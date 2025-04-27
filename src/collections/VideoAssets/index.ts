// VideoAssets collection - stores video assets (Mux or embedded)
import type { CollectionConfig } from 'payload'
import { authenticated } from '@/access/authenticated'
import { slugField } from '@/fields/slug'
import { fetchMuxMetadataForVideoAsset } from '@/hooks/mux/updateVideoAssetOnWebhook'
import { deleteAssetOnVideoAssetDelete } from '@/hooks/mux/deleteAssetOnVideoAssetDelete'
import { createCollectionLoggingHooks } from '@/hooks/logging/payloadLoggingHooks'
import { checkDependenciesBeforeDelete } from '@/hooks/videoAssets/checkDependenciesBeforeDelete'
import { updateSubtitleTracks } from '@/hooks/videoAssets/updateSubtitleTracks'

export const VideoAssets: CollectionConfig = {
  slug: 'videoassets',
  labels: {
    singular: 'Video Asset',
    plural: 'Video Assets',
  },
  defaultSort: ['-createdAt'],
  access: {
    read: () => true,
    // Disable direct creation through the admin panel
    create: () => false,
    update: authenticated,
    delete: authenticated,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: [
      'thumbnailPreview',
      'title',
      'sourceType',
      'drmBadge',
      'duration',
      'status',
      'createdAt',
      'actions',
      'quickActions',
    ],
    group: 'Content',
    components: {
      // Add our custom components before the default list view
      beforeList: [
        '@/collections/VideoAssets/components/VideoManagement',
        '@/components/EventMonitor',
        '@/collections/VideoAssets/components/ListViewRefresher',
      ],
      // Custom row component not supported in this version of Payload
    },
  },
  fields: [
    {
      name: 'thumbnailPreview',
      type: 'ui',
      label: '',
      admin: {
        components: {
          Cell: '@/collections/VideoAssets/components/ThumbnailCell',
        },
      },
    },
    {
      name: 'drmBadge',
      type: 'ui',
      label: 'DRM',
      admin: {
        components: {
          Cell: '@/collections/VideoAssets/components/DRMBadgeCell',
        },
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'status',
      type: 'ui',
      label: 'Status',
      admin: {
        components: {
          Cell: '@/collections/VideoAssets/components/StatusCell',
        },
        position: 'sidebar',
      },
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
      name: 'overrideDRM',
      type: 'checkbox',
      label: 'Override Global DRM Settings?',
      defaultValue: false,
      admin: {
        condition: (data) => data.sourceType === 'mux',
        description:
          'When checked, this video will use its own DRM settings instead of the global defaults.',
      },
    },
    {
      name: 'useDRM',
      type: 'checkbox',
      label: 'Use DRM for this video?',
      defaultValue: false,
      admin: {
        condition: (data) => data.sourceType === 'mux' && data.overrideDRM === true,
        description:
          'Protect this video with DRM (Widevine / FairPlay). Playback will require a compatible player. Can only be set before upload.',
      },
    },
    {
      name: 'drmConfigurationId',
      type: 'text',
      label: 'DRM Configuration ID',
      admin: {
        condition: (data) =>
          data.sourceType === 'mux' && data.overrideDRM === true && data.useDRM === true,
        description: 'The Mux DRM Configuration ID to use for this video.',
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
        {
          name: 'status',
          type: 'select',
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
              Cell: '@/collections/VideoAssets/components/StatusCell',
            },
          },
        },
      ],
    },
    {
      name: 'muxAdvancedSettings',
      type: 'group',
      label: 'Mux Advanced Settings',
      admin: {
        className: 'mux-advanced-settings-group',
        description: 'Configure advanced settings for this Mux video',
        condition: (data) => data.sourceType === 'mux' && data.muxData?.status === 'ready',
      },
      fields: [
        {
          name: 'videoQuality',
          type: 'select',
          label: 'Video Quality',
          options: [
            { label: 'Basic', value: 'basic' },
            { label: 'Plus', value: 'plus' },
            { label: 'Premium', value: 'premium' },
          ],
          defaultValue: 'basic',
          admin: {
            description: 'Select the encoding quality tier for this video',
          },
        },
        {
          name: 'maxResolution',
          type: 'select',
          label: 'Max Resolution',
          options: [{ label: '1080p', value: '1080p' }],
          defaultValue: '1080p',
          admin: {
            description: 'Maximum resolution for this video',
          },
        },
        {
          name: 'playbackPolicy',
          type: 'select',
          label: 'Playback Policy',
          options: [
            { label: 'Public', value: 'public' },
            { label: 'Signed', value: 'signed' },
          ],
          defaultValue: 'public',
          admin: {
            description: 'Control how this video can be accessed',
          },
        },
        {
          name: 'normalizeAudio',
          type: 'checkbox',
          label: 'Normalize Audio',
          defaultValue: false,
          admin: {
            description: 'Automatically adjust audio levels for consistent volume',
          },
        },
        {
          name: 'autoGenerateCaptions',
          type: 'checkbox',
          label: 'Auto-generate Captions',
          defaultValue: false,
          admin: {
            description: 'Automatically generate English captions for this video',
          },
        },
      ],
    },
    {
      name: 'subtitles',
      type: 'group',
      label: 'Subtitles & Captions',
      admin: {
        className: 'subtitles-group',
        description: 'Manage subtitle and caption tracks for this video',
        condition: (data) => data.sourceType === 'mux' && data.muxData?.status === 'ready',
      },
      fields: [
        {
          name: 'tracks',
          type: 'array',
          label: 'Subtitle Tracks',
          admin: {
            components: {
              RowLabel: ({ data }: { data: { name?: string; language?: string } }) =>
                data?.name
                  ? `${data.name} (${data.language})`
                  : data?.language
                    ? `${data.language} Subtitles`
                    : 'Subtitle Track',
            },
            description: 'List of subtitle and caption tracks for this video',
          },
          fields: [
            {
              name: 'language',
              type: 'text',
              required: true,
              admin: {
                description: 'Language code (e.g., en, es, fr)',
              },
            },
            {
              name: 'name',
              type: 'text',
              admin: {
                description: 'Display name for this track (e.g., English, Spanish)',
              },
            },
            {
              name: 'kind',
              type: 'select',
              options: [
                { label: 'Subtitles', value: 'subtitles' },
                { label: 'Captions', value: 'captions' },
                { label: 'Descriptions', value: 'descriptions' },
              ],
              defaultValue: 'subtitles',
              required: true,
            },
            {
              name: 'closedCaptions',
              type: 'checkbox',
              label: 'Closed Captions',
              defaultValue: false,
            },
            {
              name: 'muxTrackId',
              type: 'text',
              admin: {
                readOnly: true,
                description: 'Mux Track ID (automatically populated)',
              },
            },
            {
              name: 'url',
              type: 'text',
              admin: {
                readOnly: true,
                description: 'URL to the subtitle file (automatically populated)',
              },
            },
          ],
        },
        {
          name: 'uploadSubtitles',
          type: 'ui',
          admin: {
            components: {
              Field: '@/collections/VideoAssets/components/SubtitleUploader',
            },
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
        components: {
          Cell: '@/components/FormattedDurationCell',
        },
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
    {
      name: 'actions',
      type: 'ui',
      label: 'Actions',
      admin: {
        components: {
          Cell: '@/collections/VideoAssets/components/ActionsCell',
        },
      },
    },
    {
      name: 'quickActions',
      type: 'ui',
      label: '',
      admin: {
        components: {
          Cell: '@/collections/VideoAssets/components/QuickActionsCell',
        },
      },
    },
  ],
  hooks: {
    // Add logging hooks
    ...createCollectionLoggingHooks('videoassets'),
    // Add existing hooks
    afterChange: [fetchMuxMetadataForVideoAsset, updateSubtitleTracks],
    beforeDelete: [checkDependenciesBeforeDelete, deleteAssetOnVideoAssetDelete],
  },
}

export default VideoAssets
