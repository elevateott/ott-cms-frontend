// src/collections/LiveEvents/index.ts
import type { CollectionConfig } from 'payload'
import { authenticated } from '@/access/authenticated'
import { slugField } from '@/fields/slug'
import { createLiveStream } from '@/hooks/mux/createLiveStream'
import { updateLiveStream } from '@/hooks/mux/updateLiveStream'
import { fetchLiveStreamStatus } from '@/hooks/mux/fetchLiveStreamStatus'
import { createCollectionLoggingHooks } from '@/hooks/logging/payloadLoggingHooks'
import { handleExternalHlsUrl } from '@/hooks/handleExternalHlsUrl'
import { enforceAccessControl } from '@/hooks/liveEvents/enforceAccessControl'

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
    defaultColumns: [
      'title',
      'scheduledStartTime',
      'accessType',
      'preregistrationEnabled',
      'muxStatus',
      'status',
      'createdAt',
    ],
    group: 'Media',
    components: {
      // Use a string path to the component in the admin directory
      BeforeList: '@/admin/components/LiveStreamStatusLegend',
      BeforeDuplicate: '@/components/panels/StreamActionsPanel',
      BeforeEditForm: [
        '@/components/panels/StreamActionsPanel',
        '@/components/panels/HealthStatsPanel',
        '@/components/stream-key/StreamKeyManager',
        '@/components/panels/StreamSetupPanel',
        '@/components/panels/PlaybackIntegrationPanel',
        '@/components/panels/PlaybackURLPanel',
        '@/components/panels/RecordingsPanel',
        '@/components/panels/ExternalHlsPreviewPlayer',
        '@/components/panels/RegistrationsPanel',
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
      name: 'useExternalHlsUrl',
      type: 'checkbox',
      label: 'Use External HLS URL',
      defaultValue: false,
      admin: {
        description: 'Enable this to use an external HLS stream URL instead of Mux',
        position: 'sidebar',
      },
    },
    {
      name: 'externalHlsUrl',
      type: 'text',
      label: 'External HLS Stream URL',
      admin: {
        description:
          'Enter a valid HLS URL (must end with .m3u8) if using an external live streaming provider',
        condition: (data) => data?.useExternalHlsUrl === true,
      },
      validate: (value, { siblingData }) => {
        if (siblingData?.useExternalHlsUrl) {
          if (!value) {
            return 'External HLS URL is required when enabled'
          }

          if (!/^https?:\/\/.*\.m3u8$/i.test(value)) {
            return 'URL must start with http:// or https:// and end with .m3u8'
          }
        }
        return true
      },
    },
    {
      name: 'isRecordingEnabled',
      type: 'checkbox',
      label: 'Enable Recording',
      defaultValue: true,
      admin: {
        description: 'Record this live stream for on-demand playback after the event',
        condition: (data) => data?.useExternalHlsUrl !== true,
      },
    },
    {
      name: 'recordings',
      type: 'relationship',
      relationTo: 'recordings',
      hasMany: true,
      admin: {
        description: 'Recordings of this live event',
        position: 'sidebar',
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
        condition: (data) => data?.useExternalHlsUrl !== true,
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
        condition: (data) => data?.useExternalHlsUrl !== true,
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
    // Preregistration and Access Control Fields
    {
      name: 'preregistrationEnabled',
      type: 'checkbox',
      label: 'Enable Preregistration',
      defaultValue: false,
      admin: {
        description: 'Allow users to register for this event before it starts',
      },
    },
    {
      name: 'registrations',
      type: 'relationship',
      relationTo: 'live-event-registrations',
      hasMany: true,
      admin: {
        description: 'Users who have registered for this event',
        position: 'sidebar',
        condition: (data) => data?.preregistrationEnabled === true,
      },
    },
    {
      name: 'accessType',
      type: 'select',
      label: 'Access Control',
      options: [
        { label: 'Free (Public)', value: 'free' },
        { label: 'Subscriber Only', value: 'subscription' },
        { label: 'Paid Ticket', value: 'paid_ticket' },
      ],
      defaultValue: 'free',
      required: true,
      admin: {
        description: 'Control who can access this live event',
      },
    },
    {
      name: 'ticketPrice',
      type: 'number',
      label: 'Ticket Price (in cents)',
      min: 0,
      admin: {
        description: 'Price for a one-time ticket to this event (in cents, e.g. 1000 = $10.00)',
        condition: (data) => data?.accessType === 'paid_ticket',
      },
    },
    {
      name: 'reminderMinutesBefore',
      type: 'number',
      label: 'Send Reminder (minutes before)',
      defaultValue: 30,
      min: 5,
      max: 1440, // 24 hours
      admin: {
        description: 'How many minutes before the event to send reminder emails',
        condition: (data) => data?.preregistrationEnabled === true,
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
        condition: (data) => data?.useExternalHlsUrl !== true,
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
        condition: (data) => data?.useExternalHlsUrl !== true,
      },
    },
    {
      name: 'muxPlaybackIds',
      type: 'array',
      admin: {
        readOnly: true,
        description: 'Mux Playback IDs (automatically populated)',
        position: 'sidebar',
        condition: (data) => data?.useExternalHlsUrl !== true,
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
        condition: (data) => data?.useExternalHlsUrl !== true,
      },
    },
    {
      name: 'muxCreatedAt',
      type: 'date',
      admin: {
        readOnly: true,
        description: 'When the Mux live stream was created',
        position: 'sidebar',
        condition: (data) => data?.useExternalHlsUrl !== true,
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
          Field: '@/components/panels/SimulcastTargetsPanel',
        },
        condition: (data) => data?.useExternalHlsUrl !== true,
      },
      fields: [
        {
          name: 'id',
          type: 'text',
          admin: {
            readOnly: true,
            description: 'Mux Target ID (automatically populated)',
          },
        },
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
        {
          name: 'status',
          type: 'select',
          options: [
            { label: 'Connected', value: 'connected' },
            { label: 'Disconnected', value: 'disconnected' },
            { label: 'Error', value: 'error' },
          ],
          defaultValue: 'disconnected',
          admin: {
            readOnly: true,
            description: 'Current status of the simulcast target',
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
        condition: (data) => data?.useExternalHlsUrl !== true,
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
    beforeChange: [handleExternalHlsUrl, createLiveStream, updateLiveStream],
    // Add hook to fetch the latest status from Mux and compute effectiveHlsUrl
    afterRead: [
      fetchLiveStreamStatus,
      enforceAccessControl,
      async ({ doc }) => {
        // Import the getPlaybackUrl function
        const { getPlaybackUrl } = await import('@/utils/getPlaybackUrl')

        // Add the effectiveHlsUrl field to the document
        return {
          ...doc,
          effectiveHlsUrl: getPlaybackUrl(doc),
        }
      },
    ],
  },
}

export default LiveEvents
