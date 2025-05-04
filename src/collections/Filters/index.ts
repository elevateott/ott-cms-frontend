// src/collections/Filters/index.ts
import type { CollectionConfig } from 'payload'
import { authenticated } from '@/access/authenticated'
import { createCollectionLoggingHooks } from '@/hooks/logging/payloadLoggingHooks'

export const Filters: CollectionConfig = {
  slug: 'filters',
  labels: {
    singular: 'Filter',
    plural: 'Filters',
  },
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['label', 'type', 'value', 'order'],
    group: 'Content Library',
  },
  access: {
    read: () => true,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  fields: [
    {
      name: 'label',
      type: 'text',
      required: true,
      admin: {
        description: 'Display name for this filter',
      },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Category', value: 'category' },
        { label: 'Creator', value: 'creator' },
        { label: 'Tag', value: 'tag' },
        { label: 'Series', value: 'series' },
        { label: 'Custom', value: 'custom' },
      ],
      admin: {
        description: 'Type of filter',
      },
    },
    {
      name: 'value',
      type: 'text',
      required: true,
      admin: {
        description: 'Value to filter by (category ID, tag name, etc.)',
      },
    },
    {
      name: 'fieldPath',
      type: 'text',
      admin: {
        description: 'Path to the field in the collection (e.g., categories, tags.value)',
        condition: (data) => data.type === 'custom',
      },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Order in which this filter appears (lower numbers first)',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Whether this filter is active and should be shown',
      },
    },
    {
      name: 'group',
      type: 'text',
      admin: {
        description: 'Optional group name to organize filters (e.g., "Difficulty", "Format")',
      },
    },
  ],
  hooks: {
    ...createCollectionLoggingHooks('filters'),
  },
}

export default Filters
