// src/globals/streamingSettings.tsx
import type { GlobalConfig } from 'payload'
import { authenticated } from '@/access/authenticated'
import React from 'react'

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
        {
          name: 'defaultDRMConfigurationId',
          type: 'text',
          label: 'Default DRM Configuration ID',
          admin: {
            description: 'The Mux DRM Configuration ID to use when DRM is enabled by default',
            condition: (data) => data.enableDRMByDefault === true,
          },
          validate: (value, { data }) => {
            if (data.enableDRMByDefault && !value) {
              return 'A DRM Configuration ID is required when DRM is enabled by default'
            }
            return true
          },
        },
        {
          name: 'apiCredentials',
          type: 'group',
          admin: {
            description: 'Mux API credentials (leave empty to use environment variables)',
          },
          fields: [
            {
              name: 'tokenId',
              type: 'text',
              label: 'Mux API Token ID',
              admin: {
                description: 'Mux API Token ID for authentication',
              },
            },
            {
              name: 'tokenSecret',
              type: 'text',
              label: 'Mux API Token Secret',
              admin: {
                description: 'Secret key for Mux API authentication',
              },
            },
            {
              name: 'webhookSecret',
              type: 'text',
              label: 'Mux Webhook Secret',
              admin: {
                description: 'Secret used to verify webhook signatures from Mux',
              },
            },
            {
              name: 'signingKeyId',
              type: 'text',
              label: 'Mux Signing Key ID',
              admin: {
                description: 'Mux Signing Key ID (for signed playback)',
              },
            },
            {
              name: 'signingKeyPrivateKey',
              type: 'textarea',
              label: 'Mux Signing Key Private Key',
              admin: {
                description: 'Private key used for signing playback URLs (in PEM format)',
              },
            },
            {
              name: 'enableDRMByDefault',
              type: 'checkbox',
              label: 'Enable DRM By Default?',
              defaultValue: false,
              admin: {
                description:
                  'When enabled, all new Mux videos will use DRM protection unless overridden at the video level',
              },
            },
            {
              name: 'drmConfigurationId',
              type: 'text',
              label: 'Mux DRM Configuration ID',
              admin: {
                description: 'Mux DRM Configuration ID (for DRM-protected videos)',
              },
            },
          ],
        },
      ],
    },
  ],
}

export default StreamingSettings
