// src/collections/LiveEvents/index.ts
import type { CollectionConfig } from 'payload'
import { authenticated } from '@/access/authenticated'
import { slugField } from '@/fields/slug'
import { createLiveStream } from '@/hooks/mux/createLiveStream'
import { updateLiveStream } from '@/hooks/mux/updateLiveStream'
import { fetchLiveStreamStatus } from '@/hooks/mux/fetchLiveStreamStatus'
import { createCollectionLoggingHooks } from '@/hooks/logging/payloadLoggingHooks'

export const LiveEvents: CollectionConfig = {
  slug: 'live-events',
  labels: {
    singular: 'Live Event',
    plural: 'Live Events',
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
    defaultColumns: ['title', 'muxStatus', 'isRecordingEnabled', 'status', 'createdAt'],
    group: 'Media',
    components: {
      // Use a string path to the component in the admin directory
      BeforeList: '@/admin/components/LiveStreamStatusLegend',
      BeforeDuplicate: '@/components/panels/StreamActionsPanel',
      BeforeEditForm: [
        '@/components/panels/StreamActionsPanel',
        '@/components/panels/HealthStatsPanel',
        '@/components/stream-key/StreamKeyManager',
        '@/components/panels/PlaybackURLPanel',
      ],
    },
  },
  defaultPopulate: {
    title: true,
    slug: true,
    description: true,
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
      admin: {
        description: 'Thumbnail image for this live event',
      },
    },
    {
      name: 'isRecordingEnabled',
      type: 'checkbox',
      label: 'Enable Recording',
      defaultValue: true,
      admin: {
        description: 'Record this live stream for on-demand playback after the event',
      },
    },
    {
      name: 'reconnectWindow',
      type: 'number',
      label: 'Reconnect Window (seconds)',
      defaultValue: 60,
      min: 0,
      max: 300,
      admin: {
        description: 'Time allowed to reconnect after a disconnect (in seconds, max 300)',
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
        description:
          'Controls how the live stream can be accessed. Public streams are accessible to anyone with the URL. Signed streams require a signed token.',
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Scheduled', value: 'scheduled' },
        { label: 'Active', value: 'active' },
        { label: 'Completed', value: 'completed' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      defaultValue: 'draft',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'scheduledStartTime',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        description: 'When this live event is scheduled to start',
      },
    },
    {
      name: 'scheduledEndTime',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        description: 'When this live event is scheduled to end',
      },
    },
    // Mux Live Stream Fields (populated by the hook)
    {
      name: 'muxLiveStreamId',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Mux Live Stream ID (automatically populated)',
        position: 'sidebar',
      },
    },
    {
      name: 'muxStreamKey',
      type: 'text',
      admin: {
        // Not readOnly anymore to allow manual override by admins
        description: 'Mux Stream Key (automatically populated)',
        components: {
          Field: '@/components/fields/SecureTextField',
        },
      },
    },
    {
      name: 'muxPlaybackIds',
      type: 'array',
      admin: {
        readOnly: true,
        description: 'Mux Playback IDs (automatically populated)',
        position: 'sidebar',
      },
      fields: [
        {
          name: 'playbackId',
          type: 'text',
        },
        {
          name: 'policy',
          type: 'text',
        },
      ],
    },
    {
      name: 'muxStatus',
      type: 'select',
      options: [
        { label: 'Idle', value: 'idle' },
        { label: 'Active', value: 'active' },
        { label: 'Disconnected', value: 'disconnected' },
        { label: 'Completed', value: 'completed' },
        { label: 'Disabled', value: 'disabled' },
      ],
      admin: {
        readOnly: true,
        description: 'Current status of the Mux live stream (updates automatically)',
        position: 'sidebar',
        components: {
          // Use string paths to the components in the admin directory
          Field: '@/admin/components/LiveStreamStatusBadge',
          Cell: '@/admin/components/LiveStreamStatusCell',
        },
        filterOptions: [
          { label: 'Active', value: 'active' },
          { label: 'Idle', value: 'idle' },
          { label: 'Completed', value: 'completed' },
          { label: 'Disconnected', value: 'disconnected' },
          { label: 'Disabled', value: 'disabled' },
        ],
      },
    },
    {
      name: 'muxCreatedAt',
      type: 'date',
      admin: {
        readOnly: true,
        description: 'When the Mux live stream was created',
        position: 'sidebar',
      },
    },
    {
      name: 'recordingAssetId',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Mux Asset ID for the recording (if recording is enabled)',
        position: 'sidebar',
      },
    },
    {
      name: 'simulcastTargets',
      type: 'array',
      admin: {
        description: 'Optional targets to simulcast this live stream to (RTMP destinations)',
        components: {
          Field: '@/components/fields/SimulcastTargetsField',
        },
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          admin: {
            description: 'Name of the simulcast target (e.g., YouTube, Facebook)',
          },
        },
        {
          name: 'url',
          type: 'text',
          required: true,
          admin: {
            description: 'RTMP URL for the simulcast target',
          },
        },
        {
          name: 'streamKey',
          type: 'text',
          required: true,
          admin: {
            description: 'Stream key for the simulcast target',
            components: {
              Field: '@/components/fields/SecureTextField',
            },
          },
        },
      ],
    },
    {
      name: 'endedAt',
      type: 'date',
      label: 'Ended',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'When the live stream was completed',
      },
    },
    {
      name: 'createdAt',
      type: 'date',
      label: 'Created',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
      access: {
        create: () => false,
        update: () => false,
      },
    },
  ],
  hooks: {
    // Add logging hooks
    ...createCollectionLoggingHooks('live-events'),
    // Add hooks to create and update Mux live stream
    beforeChange: [createLiveStream, updateLiveStream],
    // Add hook to fetch the latest status from Mux
    afterRead: [fetchLiveStreamStatus],
  },
}

export default LiveEvents
