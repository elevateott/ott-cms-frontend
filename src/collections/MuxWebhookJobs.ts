// src/collections/MuxWebhookJobs.ts
import { CollectionConfig } from 'payload'
import { authenticated } from '@/access/authenticated'

export const MuxWebhookJobs: CollectionConfig = {
  slug: 'mux-webhook-jobs',
  access: {
    read: authenticated,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  admin: {
    defaultColumns: ['videoId', 'assetId', 'status', 'attemptCount', 'lastAttempt'],
    group: 'System',
    hidden: true, // Hide from the admin UI sidebar
  },
  fields: [
    {
      name: 'videoId',
      type: 'text',
      required: true,
    },
    {
      name: 'assetId',
      type: 'text',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Complete', value: 'complete' },
        { label: 'Failed', value: 'failed' },
      ],
      defaultValue: 'pending',
      required: true,
    },
    {
      name: 'attemptCount',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'lastAttempt',
      type: 'date',
    },
    {
      name: 'error',
      type: 'text',
    },
  ],
  hooks: {
    afterChange: [
      // Optional: Add logic to retry checking Mux status after some time
    ],
  },
}
