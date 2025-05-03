import type { CollectionConfig } from 'payload'

export const Tests: CollectionConfig = {
  slug: 'tests',
  labels: {
    singular: 'Test',
    plural: 'Tests',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'status', 'createdAt'],
    group: 'Utilities',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
  ],
}

export default Tests
