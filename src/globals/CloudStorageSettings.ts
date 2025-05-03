// src/globals/CloudStorageSettings.ts
import type { GlobalConfig } from 'payload'
import { authenticated } from '@/access/authenticated'

export const CloudStorageSettings: GlobalConfig = {
  slug: 'cloud-storage-settings',
  label: 'Cloud Storage Settings',
  access: {
    read: () => true,
    update: authenticated,
  },
  admin: {
    group: 'System Settings',
    description: 'Configure cloud storage provider for media uploads (excluding videos)',
  },
  fields: [
    {
      type: 'ui',
      name: 'instructions',
      admin: {
        position: 'sidebar',
        components: {
          Field: '@/components/admin/CloudStorageInstructions/CloudStorageInstructionsField',
        },
      },
    },
    {
      name: 'enabled',
      type: 'checkbox',
      label: 'Enable Cloud Storage',
      defaultValue: false,
      admin: {
        description: 'When enabled, media uploads will use the selected cloud storage provider instead of local storage',
      },
    },
    {
      name: 'provider',
      type: 'select',
      label: 'Storage Provider',
      admin: {
        description: 'Select which cloud storage provider to use for media uploads',
        condition: (data) => data?.enabled === true,
      },
      options: [
        { label: 'Vercel Blob', value: 'vercel-blob' },
        { label: 'Amazon S3', value: 's3' },
        { label: 'Azure Blob Storage', value: 'azure' },
        { label: 'Google Cloud Storage', value: 'gcs' },
        { label: 'UploadThing', value: 'uploadthing' },
      ],
    },
    // Vercel Blob specific fields
    {
      name: 'vercelBlob',
      type: 'group',
      label: 'Vercel Blob Settings',
      admin: {
        condition: (data) => data?.enabled === true && data?.provider === 'vercel-blob',
      },
      fields: [
        {
          name: 'token',
          type: 'text',
          label: 'Vercel Blob Token',
          required: true,
          admin: {
            description: 'Vercel Blob storage read/write token',
            components: {
              Field: '@/components/fields/SecureTextField',
            },
          },
        },
        {
          name: 'addRandomSuffix',
          type: 'checkbox',
          label: 'Add Random Suffix',
          defaultValue: false,
          admin: {
            description: 'Add a random suffix to the uploaded file name in Vercel Blob storage',
          },
        },
        {
          name: 'cacheControlMaxAge',
          type: 'number',
          label: 'Cache-Control Max Age (seconds)',
          defaultValue: 31536000, // 1 year in seconds
          admin: {
            description: 'Cache-Control max-age in seconds (default: 1 year)',
          },
        },
      ],
    },
    // S3 specific fields
    {
      name: 's3',
      type: 'group',
      label: 'Amazon S3 Settings',
      admin: {
        condition: (data) => data?.enabled === true && data?.provider === 's3',
      },
      fields: [
        {
          name: 'accessKeyId',
          type: 'text',
          label: 'Access Key ID',
          required: true,
          admin: {
            components: {
              Field: '@/components/fields/SecureTextField',
            },
          },
        },
        {
          name: 'secretAccessKey',
          type: 'text',
          label: 'Secret Access Key',
          required: true,
          admin: {
            components: {
              Field: '@/components/fields/SecureTextField',
            },
          },
        },
        {
          name: 'region',
          type: 'text',
          label: 'Region',
          required: true,
          admin: {
            description: 'AWS region (e.g., us-east-1)',
          },
        },
        {
          name: 'bucket',
          type: 'text',
          label: 'Bucket Name',
          required: true,
        },
        {
          name: 'endpoint',
          type: 'text',
          label: 'Custom Endpoint',
          admin: {
            description: 'Optional custom endpoint for S3-compatible services like DigitalOcean Spaces',
          },
        },
        {
          name: 'forcePathStyle',
          type: 'checkbox',
          label: 'Force Path Style',
          defaultValue: false,
          admin: {
            description: 'Use path-style URLs for S3 objects (required for some S3-compatible services)',
          },
        },
      ],
    },
    // Azure specific fields
    {
      name: 'azure',
      type: 'group',
      label: 'Azure Blob Storage Settings',
      admin: {
        condition: (data) => data?.enabled === true && data?.provider === 'azure',
      },
      fields: [
        {
          name: 'connectionString',
          type: 'text',
          label: 'Connection String',
          required: true,
          admin: {
            components: {
              Field: '@/components/fields/SecureTextField',
            },
          },
        },
        {
          name: 'containerName',
          type: 'text',
          label: 'Container Name',
          required: true,
        },
        {
          name: 'allowContainerCreate',
          type: 'checkbox',
          label: 'Allow Container Creation',
          defaultValue: false,
          admin: {
            description: 'Allow the container to be created if it does not exist',
          },
        },
        {
          name: 'baseURL',
          type: 'text',
          label: 'Base URL',
          admin: {
            description: 'Optional base URL for the Azure Blob storage account',
          },
        },
      ],
    },
    // GCS specific fields
    {
      name: 'gcs',
      type: 'group',
      label: 'Google Cloud Storage Settings',
      admin: {
        condition: (data) => data?.enabled === true && data?.provider === 'gcs',
      },
      fields: [
        {
          name: 'projectId',
          type: 'text',
          label: 'Project ID',
          required: true,
        },
        {
          name: 'keyFilename',
          type: 'text',
          label: 'Key Filename',
          admin: {
            description: 'Path to the JSON key file for service account authentication',
          },
        },
        {
          name: 'bucket',
          type: 'text',
          label: 'Bucket Name',
          required: true,
        },
        {
          name: 'credentials',
          type: 'textarea',
          label: 'Credentials JSON',
          admin: {
            description: 'JSON credentials for service account (alternative to key file)',
            components: {
              Field: '@/components/fields/SecureTextField',
            },
          },
        },
      ],
    },
    // UploadThing specific fields
    {
      name: 'uploadthing',
      type: 'group',
      label: 'UploadThing Settings',
      admin: {
        condition: (data) => data?.enabled === true && data?.provider === 'uploadthing',
      },
      fields: [
        {
          name: 'apiKey',
          type: 'text',
          label: 'API Key',
          required: true,
          admin: {
            components: {
              Field: '@/components/fields/SecureTextField',
            },
          },
        },
        {
          name: 'secretKey',
          type: 'text',
          label: 'Secret Key',
          required: true,
          admin: {
            components: {
              Field: '@/components/fields/SecureTextField',
            },
          },
        },
        {
          name: 'appId',
          type: 'text',
          label: 'App ID',
          required: true,
        },
      ],
    },
  ],
}

export default CloudStorageSettings
