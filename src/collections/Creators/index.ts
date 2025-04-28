// src/collections/Creators/index.ts
import type { CollectionConfig } from 'payload'
import { authenticated } from '@/access/authenticated'
import { slugField } from '@/fields/slug'

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
    defaultColumns: ['name', 'slug', 'createdAt'],
    group: 'Content',
  },
  defaultPopulate: {
    name: true,
    slug: true,
    image: true,
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
    },
    ...slugField(),
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Profile image for this creator',
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
  timestamps: true,
}

export default Creators
