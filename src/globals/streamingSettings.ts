// src/globals/streamingSources.ts
import type { GlobalConfig } from 'payload'
import { authenticated } from '@/access/authenticated'

const StreamingSettings: GlobalConfig = {
  slug: 'streaming-settings',
  access: {
    read: () => true,
    update: authenticated,
  },
  admin: {
    group: 'System Settings',
  },
  fields: [
    {
      name: 'streamingSourceTypes',
      label: 'Allowed Streaming Source Types',
      type: 'select',
      defaultValue: 'Both',
      options: [
        { label: 'Mux Only', value: 'Mux' },
        { label: 'Embedded Only', value: 'Embedded' },
        { label: 'Both Sources', value: 'Both' },
      ],
      required: true,
      admin: {
        description: 'Control which video source types are allowed in the system',
      },
    },
    {
      name: 'muxSettings',
      type: 'group',
      admin: {
        description: 'Mux configuration settings',
        condition: (data) =>
          data?.streamingSourceTypes === 'Mux' || data?.streamingSourceTypes === 'Both',
      },
      fields: [
        {
          name: 'autoGenerateThumbnails',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description: 'Automatically generate thumbnails from Mux videos',
          },
        },
        {
          name: 'defaultPlaybackPolicy',
          type: 'select',
          options: [
            { label: 'Public', value: 'public' },
            { label: 'Signed', value: 'signed' },
          ],
          defaultValue: 'public',
          admin: {
            description: 'Default playback policy for new Mux videos',
          },
        },
      ],
    },
  ],
}

export default StreamingSettings
