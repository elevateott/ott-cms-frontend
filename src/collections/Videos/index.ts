import type { CollectionConfig } from 'payload'

import { authenticated } from '@/access/authenticated'
import { slugField } from '@/fields/slug'
import VideoForm from './components/VideoForm'

export const Videos: CollectionConfig = {
  slug: 'videos',
  access: {
    read: () => true,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'sourceType', 'createdAt'],
    group: 'Media',
    components: {},
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    ...slugField(),
    {
      name: 'sourceType',
      label: 'Video Source Type',
      type: 'select',
      options: ['Mux', 'Embedded'],
      defaultValue: 'Mux',
      required: true,
    },
    {
      name: 'muxAsset',
      type: 'group',
      admin: {
        condition: (data) => data?.sourceType === 'Mux',
      },
      fields: [
        { name: 'uploadID', type: 'text' },
        { name: 'assetID', type: 'text' },
        { name: 'playbackID', type: 'text' },
      ],
    },
    {
      name: 'embeddedUrl',
      type: 'text',
      admin: {
        condition: (data) => data?.sourceType === 'Embedded',
      },
    },
    {
      name: 'duration',
      type: 'number',
    },
    {
      name: 'aspectRatio',
      type: 'text',
    },
    {
      name: 'thumbnail',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
    },
  ],
}

export default Videos
