// src/globals/CloudIntegrations.ts
import type { GlobalConfig } from 'payload'
import { authenticated } from '@/access/authenticated'
import CloudIntegrationInstructions from '@/components/admin/CloudIntegrationInstructions'

const CloudIntegrations: GlobalConfig = {
  slug: 'cloud-integrations',
  access: {
    read: () => true,
    update: authenticated,
  },
  admin: {
    group: 'System Settings',
    description: 'Configure cloud storage integration settings for video uploads',
  },
  fields: [
    {
      type: 'ui',
      name: 'instructions',
      admin: {
        position: 'sidebar',
        components: {
          Field: CloudIntegrationInstructions,
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
    {
      name: 'onedriveClientId',
      label: 'OneDrive Client ID',
      type: 'text',
      admin: {
        description:
          'Application (client) ID for OneDrive integration. Create in the Microsoft Azure Portal.',
      },
    },
  ],
}

export default CloudIntegrations
