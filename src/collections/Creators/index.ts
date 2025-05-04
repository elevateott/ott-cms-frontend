// src/collections/Creators/index.ts
import type { CollectionConfig } from 'payload'
import { authenticated } from '@/access/authenticated'
import { slugField } from '@/fields/slug'
import { createCollectionLoggingHooks } from '@/hooks/logging/payloadLoggingHooks'

export const Creators: CollectionConfig = {
  slug: 'creators',
  labels: {
    singular: 'Creator',
    plural: 'Creators',
  },
  defaultSort: ['-createdAt'],
  access: {
    read: () => true,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'publicProfile', 'createdAt'],
    group: 'People',
  },
  defaultPopulate: {
    name: true,
    slug: true,
    avatar: true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'bio',
      type: 'textarea',
      admin: {
        description: "Displayed on the creator's public profile.",
      },
    },
    ...slugField(),
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Profile image for this creator',
      },
    },
    {
      name: 'publicProfile',
      type: 'checkbox',
      label: 'Show on site',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Controls whether this creator is visible on the public site',
      },
    },
    {
      name: 'socialLinks',
      type: 'array',
      admin: {
        description: 'Social media links for this creator',
      },
      fields: [
        {
          name: 'platform',
          type: 'select',
          options: [
            { label: 'Website', value: 'website' },
            { label: 'Twitter', value: 'twitter' },
            { label: 'Instagram', value: 'instagram' },
            { label: 'YouTube', value: 'youtube' },
            { label: 'Facebook', value: 'facebook' },
            { label: 'LinkedIn', value: 'linkedin' },
            { label: 'TikTok', value: 'tiktok' },
            { label: 'Other', value: 'other' },
          ],
          required: true,
        },
        {
          name: 'url',
          type: 'text',
          required: true,
        },
        {
          name: 'label',
          type: 'text',
        },
      ],
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
    ...createCollectionLoggingHooks('creators'),
  },
  timestamps: true,
}

export default Creators
