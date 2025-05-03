// src/collections/Carousels/index.ts
import type { CollectionConfig } from 'payload'
import { authenticated } from '@/access/authenticated'
import { slugField } from '@/fields/slug'
import { createCollectionLoggingHooks } from '@/hooks/logging/payloadLoggingHooks'
import { reorderCarouselItems } from '@/hooks/carousels/reorderCarouselItems'

export const Carousels: CollectionConfig = {
  slug: 'carousels',
  labels: {
    singular: 'Carousel',
    plural: 'Carousels',
  },
  defaultSort: 'order',
  access: {
    read: () => true,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'itemCount', 'isActive', 'order', 'createdAt'],
    group: 'Content',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description:
          'The title displayed above the carousel (e.g., "Latest Releases", "Top Picks")',
      },
    },
    ...slugField(),
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Optional description to display below the carousel title',
      },
    },
    {
      name: 'items',
      type: 'array',
      label: 'Carousel Items',
      admin: {
        description: 'Add content or series to this carousel',
        components: {
          RowLabel: '@/collections/Carousels/components/ItemRowLabel',
        },
      },
      fields: [
        {
          name: 'itemType',
          type: 'select',
          required: true,
          options: [
            { label: 'Content', value: 'content' },
            { label: 'Series', value: 'series' },
          ],
          admin: {
            description: 'Select the type of item to add',
          },
        },
        {
          name: 'item',
          type: 'relationship',
          required: true,
          relationTo: ['content', 'series'],
          hasMany: false,
          admin: {
            description: 'Select the content or series to add to this carousel',
            condition: (data) => Boolean(data?.itemType),
          },
        },
        {
          name: 'order',
          type: 'number',
          required: true,
          defaultValue: 1,
          admin: {
            description: 'Position in the carousel (1 = first, 2 = second, etc.)',
          },
        },
        {
          name: 'customTitle',
          type: 'text',
          admin: {
            description: 'Optional custom title to override the original title',
          },
        },
        {
          name: 'customDescription',
          type: 'textarea',
          admin: {
            description: 'Optional custom description to override the original description',
          },
        },
      ],
    },
    {
      name: 'itemCount',
      type: 'ui',
      admin: {
        components: {
          Cell: '@/collections/Carousels/components/ItemCountCell',
        },
      },
    },
    {
      name: 'displayOptions',
      type: 'group',
      label: 'Display Options',
      admin: {
        description: 'Configure how this carousel is displayed',
      },
      fields: [
        {
          name: 'layout',
          type: 'select',
          required: true,
          defaultValue: 'standard',
          options: [
            { label: 'Standard', value: 'standard' },
            { label: 'Featured (Large)', value: 'featured' },
            { label: 'Compact', value: 'compact' },
          ],
          admin: {
            description: 'The visual style of the carousel',
          },
        },
        {
          name: 'itemsPerView',
          type: 'select',
          required: true,
          defaultValue: 'auto',
          options: [
            { label: 'Auto (Responsive)', value: 'auto' },
            { label: '2 Items', value: '2' },
            { label: '3 Items', value: '3' },
            { label: '4 Items', value: '4' },
            { label: '5 Items', value: '5' },
          ],
          admin: {
            description: 'Number of items visible at once',
          },
        },
        {
          name: 'showArrows',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description: 'Show navigation arrows on the sides',
          },
        },
        {
          name: 'showDots',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Show navigation dots below the carousel',
          },
        },
        {
          name: 'autoplay',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Automatically scroll through items',
          },
        },
        {
          name: 'autoplaySpeed',
          type: 'number',
          defaultValue: 5000,
          admin: {
            description: 'Time between slides in milliseconds (if autoplay is enabled)',
            condition: (data, siblingData) => siblingData?.autoplay === true,
          },
        },
      ],
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Toggle to show/hide this carousel',
      },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 999,
      admin: {
        position: 'sidebar',
        description: 'Order of this carousel on the page (lower numbers appear first)',
      },
    },
    {
      name: 'showOnPages',
      type: 'select',
      hasMany: true,
      defaultValue: ['home'],
      options: [
        { label: 'Home Page', value: 'home' },
        { label: 'Content Library', value: 'content' },
        { label: 'Series Library', value: 'series' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Select which pages this carousel should appear on',
      },
    },
    {
      name: 'visibleFrom',
      type: 'date',
      admin: {
        position: 'sidebar',
        description: 'Optional date when this carousel should start being visible',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'visibleUntil',
      type: 'date',
      admin: {
        position: 'sidebar',
        description: 'Optional date when this carousel should stop being visible',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
  ],
  hooks: {
    // Add logging hooks
    ...createCollectionLoggingHooks('carousels'),
    // Add reordering hooks
    beforeChange: [reorderCarouselItems],
  },
}

export default Carousels
