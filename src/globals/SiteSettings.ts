import { GlobalConfig } from 'payload'
import SimpleNotice from '@/components/admin/ExampleUIField'

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
          Field: SimpleNotice, // custom UI component
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
