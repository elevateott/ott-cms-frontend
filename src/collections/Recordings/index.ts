// src/collections/Recordings/index.ts
import type { CollectionConfig } from 'payload'
import { authenticated } from '@/access/authenticated'
import { slugField } from '@/fields/slug'
import { createCollectionLoggingHooks } from '@/hooks/logging/payloadLoggingHooks'

export const Recordings: CollectionConfig = {
  slug: 'recordings',
  labels: {
    singular: 'Recording',
    plural: 'Recordings',
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
    defaultColumns: ['title', 'liveEvent', 'duration', 'createdAt'],
    group: 'Media',
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
      name: 'liveEvent',
      type: 'relationship',
      relationTo: 'live-events',
      required: true,
      admin: {
        description: 'The live event this recording is from',
      },
    },
    {
      name: 'playbackUrl',
      type: 'text',
      admin: {
        description: 'HLS playback URL for this recording',
      },
    },
    {
      name: 'thumbnailUrl',
      type: 'text',
      admin: {
        description: 'URL to the thumbnail image for this recording',
      },
    },
    {
      name: 'duration',
      type: 'number',
      admin: {
        description: 'Duration of the recording in seconds',
        components: {
          Cell: '@/components/FormattedDurationCell',
        },
      },
    },
    {
      name: 'muxAssetId',
      type: 'text',
      admin: {
        description: 'Mux Asset ID for this recording',
        position: 'sidebar',
      },
    },
    {
      name: 'muxPlaybackId',
      type: 'text',
      admin: {
        description: 'Mux Playback ID for this recording',
        position: 'sidebar',
      },
    },
    {
      name: 'playbackPolicy',
      type: 'select',
      options: [
        { label: 'Public', value: 'public' },
        { label: 'Signed', value: 'signed' },
      ],
      defaultValue: 'public',
      admin: {
        description: 'Controls how the recording can be accessed',
        position: 'sidebar',
      },
    },
    {
      name: 'price',
      type: 'number',
      admin: {
        description: 'Optional price in cents for this recording',
        position: 'sidebar',
      },
    },
    {
      name: 'downloadUrl',
      type: 'text',
      admin: {
        description: 'URL to download the recording (if available)',
        position: 'sidebar',
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
  ],
  hooks: {
    ...createCollectionLoggingHooks('recordings'),
  },
}

// Export as default as well for backward compatibility
export default Recordings
