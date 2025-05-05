// src/globals/CloudIntegrations.ts
import type { GlobalConfig } from 'payload'
import { authenticated } from '@/access/authenticated'

const CloudIntegrations: GlobalConfig = {
  slug: 'cloud-integrations',
  access: {
    read: () => true,
    update: authenticated,
  },
  admin: {
    group: 'Settings',
    description: 'Configure cloud storage integration settings for video uploads',
  },
  fields: [
    {
      type: 'ui',
      name: 'instructions',
      admin: {
        position: 'sidebar',
        components: {
          Field:
            '@/components/admin/CloudIntegrationInstructions/CloudIntegrationInstructionsField',
        },
      },
    },
    {
      name: 'dropboxAppKey',
      label: 'Dropbox App Key',
      type: 'text',
      admin: {
        description:
          'API key for Dropbox integration. Create an app in the Dropbox Developer Console.',
      },
    },
    {
      name: 'googleApiKey',
      label: 'Google API Key',
      type: 'text',
      admin: {
        description: 'API key for Google Drive integration. Create in the Google Cloud Console.',
      },
    },
    {
      name: 'googleClientId',
      label: 'Google Client ID',
      type: 'text',
      admin: {
        description:
          'OAuth client ID for Google Drive integration. Create in the Google Cloud Console.',
      },
    },
  ],
}

export default CloudIntegrations
