import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import { slugField } from '../../fields/slug'

export const Categories: CollectionConfig = {
  slug: 'categories',
  access: {
    read: () => true,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'createdAt'],
    group: 'Media',
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
      name: 'thumbnail',
      label: 'Category Thumbnail',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'order',
      type: 'number',
      label: 'Sort Order',
      admin: {
        description: 'Used for manual sorting in menus or grids',
      },
    },
  ],
}

export default Categories
