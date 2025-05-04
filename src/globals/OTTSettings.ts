// src/globals/OTTSettings.ts
import type { GlobalConfig } from 'payload'
import { authenticated } from '@/access/authenticated'

const OTTSettings: GlobalConfig = {
  slug: 'ott-settings',
  access: {
    read: () => true,
    update: authenticated,
  },
  admin: {
    group: 'Settings',
  },
  fields: [
    {
      name: 'general',
      type: 'group',
      fields: [
        {
          name: 'siteName',
          type: 'text',
          required: true,
          defaultValue: 'My OTT Platform',
        },
        {
          name: 'siteDescription',
          type: 'textarea',
        },
        {
          name: 'logo',
          type: 'upload',
          relationTo: 'media',
        },
        {
          name: 'favicon',
          type: 'upload',
          relationTo: 'media',
        },
      ],
    },
    {
      name: 'features',
      type: 'group',
      fields: [
        {
          name: 'enableMembershipFeatures',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Enable paid membership and subscription features',
          },
        },
        {
          name: 'enableDownloads',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Allow users to download videos for offline viewing',
          },
        },
        {
          name: 'enableComments',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description: 'Allow users to comment on videos',
          },
        },
        {
          name: 'enableRatings',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description: 'Allow users to rate videos',
          },
        },
        {
          name: 'enableDeviceLimiting',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description:
              'Limit the number of devices that can be logged in simultaneously per subscriber',
          },
        },
        {
          name: 'defaultMaxDevices',
          type: 'number',
          defaultValue: 2,
          min: 1,
          max: 10,
          admin: {
            description:
              'Default maximum number of devices allowed per subscriber (can be overridden by subscription plan)',
            condition: (_, siblingData) => siblingData?.enableDeviceLimiting,
          },
        },
      ],
    },
    {
      name: 'player',
      type: 'group',
      fields: [
        {
          name: 'autoplay',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Automatically play videos when the page loads',
          },
        },
        {
          name: 'enableAutoNext',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description: 'Automatically play the next video in a series',
          },
        },
        {
          name: 'defaultPlayerQuality',
          type: 'select',
          options: [
            { label: 'Auto', value: 'auto' },
            { label: 'Low (480p)', value: '480p' },
            { label: 'Medium (720p)', value: '720p' },
            { label: 'High (1080p)', value: '1080p' },
            { label: '4K (2160p)', value: '2160p' },
          ],
          defaultValue: 'auto',
          admin: {
            description: 'Default video quality for the player',
          },
        },
      ],
    },
    {
      name: 'monetization',
      type: 'group',
      admin: {
        condition: (_, siblingData) => siblingData?.features?.enableMembershipFeatures,
      },
      fields: [
        {
          name: 'plans',
          type: 'array',
          admin: {
            description: 'Set up subscription plans for your platform',
          },
          fields: [
            {
              name: 'name',
              type: 'text',
              required: true,
            },
            {
              name: 'price',
              type: 'number',
              required: true,
            },
            {
              name: 'interval',
              type: 'select',
              options: [
                { label: 'Monthly', value: 'month' },
                { label: 'Yearly', value: 'year' },
              ],
              defaultValue: 'month',
            },
            {
              name: 'features',
              type: 'array',
              fields: [
                {
                  name: 'feature',
                  type: 'text',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'analytics',
      type: 'group',
      fields: [
        {
          name: 'googleAnalyticsId',
          type: 'text',
          admin: {
            description: 'Google Analytics Measurement ID (e.g., G-XXXXXXXXXX)',
          },
        },
        {
          name: 'enableMuxAnalytics',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description: 'Enable advanced video analytics with Mux Data',
          },
        },
      ],
    },
  ],
}

export default OTTSettings
