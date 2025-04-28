// storage-adapter-import-placeholder
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import StreamingSettings from './globals/streamingSettings.tsx'
import OTTSettings from './globals/OTTSettings'
import CloudIntegrations from './globals/CloudIntegrations'
import SiteSettings from './globals/SiteSettings'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'

import sharp from 'sharp' // sharp-import
import path from 'path'
import { buildConfig, PayloadRequest } from 'payload'
import { fileURLToPath } from 'url'

import { Categories } from './collections/Categories'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Users } from './collections/Users'
// Import new collections
import { MuxWebhookJobs } from './collections/MuxWebhookJobs'

import { Footer } from './Footer/config'
import { Header } from './Header/config'
import { plugins } from './plugins'
import { defaultLexical } from '@/fields/defaultLexical'
import { getServerSideURL } from './utilities/getURL'

import { VideoAssets } from './collections/VideoAssets'
import { Content } from './collections/Content'
import { Creators } from './collections/Creators'
import { Series } from './collections/Series'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    meta: {
      titleSuffix: '- OTT CMS',
      icons: [
        {
          rel: 'icon',
          url: '/favicon.ico',
        },
      ],
      openGraph: {
        images: [
          {
            url: '/og-image.png',
          },
        ],
      },
    },
    components: {
      // The `BeforeLogin` component renders a message that you see while logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below and the import `BeforeLogin` statement on line 15.
      beforeLogin: ['@/components/BeforeLogin'],
      // The `BeforeDashboard` component renders the 'welcome' block that you see after logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below and the import `BeforeDashboard` statement on line 15.
      beforeDashboard: ['@/components/BeforeDashboard'],
      // Add our custom event provider to the admin panel
      providers: ['@/components/AdminEventProvider'],
      // No custom views at the global level
      // Custom components are configured at the collection level
    },
    importMap: {
      baseDir: path.resolve(dirname),
      importMapPath: path.resolve(dirname, 'payload-import-map.ts'),
    },
    user: Users.slug,
    livePreview: {
      breakpoints: [
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
        {
          label: 'Tablet',
          name: 'tablet',
          width: 768,
          height: 1024,
        },
        {
          label: 'Desktop',
          name: 'desktop',
          width: 1440,
          height: 900,
        },
      ],
    },
  },
  // This config helps us configure global or default features that the other editors can inherit
  editor: defaultLexical,
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || '',
  }),
  collections: [
    Pages,
    Posts,
    Media,
    Categories,
    Users,
    MuxWebhookJobs,
    VideoAssets,
    Content,
    Creators,
    Series,
  ],
  cors: [getServerSideURL()].filter(Boolean),
  globals: [Header, Footer, StreamingSettings, OTTSettings, CloudIntegrations, SiteSettings],
  plugins: [
    ...plugins,
    payloadCloudPlugin(),
    // storage-adapter-placeholder
  ],
  secret: process.env.PAYLOAD_SECRET,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  graphQL: {
    schemaOutputFile: path.resolve(dirname, 'generated-schema.graphql'),
  },
  jobs: {
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        // Allow logged in users to execute this endpoint (default)
        if (req.user) return true

        // If there is no logged in user, then check
        // for the Vercel Cron secret to be present as an
        // Authorization header:
        const authHeader = req.headers.get('authorization')
        return authHeader === `Bearer ${process.env.CRON_SECRET}`
      },
    },
    tasks: [],
  },
})
