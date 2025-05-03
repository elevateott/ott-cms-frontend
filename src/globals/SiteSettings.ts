import { GlobalConfig } from 'payload'

const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  admin: {
    group: 'Settings',
  },
  fields: [
    {
      type: 'ui',
      name: 'simpleNotice',
      admin: {
        position: 'sidebar',
        components: {
          Field: '@/components/admin/ExampleUIField/SimpleNotice', // custom UI component
        },
      },
    },
    {
      name: 'siteName',
      type: 'text',
      label: 'Site Name',
    },
  ],
}

export default SiteSettings
