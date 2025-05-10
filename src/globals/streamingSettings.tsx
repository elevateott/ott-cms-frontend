// src/globals/streamingSettings.tsx
import React from 'react'
import type { GlobalConfig } from 'payload'
import type { FieldValidate } from '@/utils/fieldValidate'
import { authenticated } from '@/access/authenticated'

const StreamingSettings: GlobalConfig = {
  slug: 'streaming-settings',
  access: {
    read: () => true,
    update: authenticated,
  },
  admin: {
    group: 'Settings',
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
          validate: (value, { siblingData }) => {
            if (value === 'signed') {
              const credentials = siblingData?.apiCredentials as {
                signingKeyId?: string
                signingKeyPrivateKey?: string
              }

              const { signingKeyId, signingKeyPrivateKey } = credentials || {}

              if (!signingKeyId && !signingKeyPrivateKey) {
                return 'When using Signed Playback Policy, both Signing Key ID and Private Key are required.'
              }

              if (!signingKeyId) {
                return 'Signing Key ID is required when using Signed Playback Policy.'
              }

              if (!signingKeyPrivateKey) {
                return 'Signing Key Private Key is required when using Signed Playback Policy.'
              }
            }

            return true
          },
          admin: {
            description:
              'Default playback policy for new Mux videos. Note: Selecting "Signed" requires both Signing Key ID and Signing Key Private Key to be configured.',
            components: {
              afterInput: [
                {
                  path: '@/components/notices/SignedPolicyNotice',
                  exportName: 'SignedPolicyNotice',
                },
              ],
            },
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
              required: false,
              admin: {
                description: 'Token ID for Mux API authentication',
                components: {
                  Field: '@/components/fields/SecureTextField',
                },
              },
            },
            {
              name: 'tokenSecret',
              type: 'text',
              label: 'Mux API Token Secret',
              required: false,
              admin: {
                description: 'Secret key for Mux API authentication',
                components: {
                  Field: '@/components/fields/SecureTextField',
                },
              },
            },
            {
              name: 'webhookSecret',
              type: 'text',
              label: 'Mux Webhook Secret',
              required: false,
              admin: {
                description: 'Secret used to verify webhook signatures from Mux',
                components: {
                  Field: '@/components/fields/SecureTextField',
                },
              },
            },
            {
              name: 'signingKeyId',
              type: 'text',
              label: 'Mux Signing Key ID',
              required: false,
              admin: {
                description: 'Mux Signing Key ID (required for signed playback)',
                components: {
                  Field: '@/components/fields/SecureTextField',
                },
              },
            },
            {
              name: 'signingKeyPrivateKey',
              type: 'textarea',
              label: 'Mux Signing Key Private Key',
              required: false,
              admin: {
                description:
                  'Private key used for signing playback URLs (in PEM format, required for signed playback)',
                components: {
                  Field: '@/components/fields/SecureTextareaField',
                },
              },
            },
            {
              name: 'enableDRMByDefault',
              type: 'checkbox',
              label: 'Enable DRM By Default?',
              required: false,
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
              required: false,
              admin: {
                description: 'Mux DRM Configuration ID (for DRM-protected videos)',
                components: {
                  Field: '@/components/fields/SecureTextField',
                },
              },
            },
          ],
        },
      ],
    },
  ],
}

export default StreamingSettings
