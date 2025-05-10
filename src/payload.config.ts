import { postgresAdapter } from '@payloadcms/db-postgres'
import { resendAdapter } from '@payloadcms/email-resend'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'

import sharp from 'sharp'
import path from 'path'
import { buildConfig, PayloadRequest } from 'payload'
import { fileURLToPath } from 'url'

import { Categories } from './collections/Categories'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Users } from './collections/Users'
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
import { Filters } from './collections/Filters'
import { Carousels } from './collections/Carousels'
import { LiveEvents } from './collections/LiveEvents'
import { Recordings } from './collections/Recordings'
import { LiveEventRegistrations } from './collections/LiveEventRegistrations'
import { Notifications } from './collections/Notifications'
import { Subscribers } from './collections/Subscribers'
import { SubscriptionPlans } from './collections/SubscriptionPlans'
import { DiscountCodes } from './collections/DiscountCodes'
import { Transactions } from './collections/Transactions'
import { DigitalProducts } from './collections/DigitalProducts'
import { AddOns } from './collections/AddOns'
import { csvExportEndpoints } from './endpoints/csvExport'

import StreamingSettings from './globals/streamingSettings'
import OTTSettings from './globals/OTTSettings'
import CloudIntegrations from './globals/CloudIntegrations'
import CloudStorageSettings from './globals/CloudStorageSettings'
import SiteSettings from './globals/SiteSettings'
import EmailSettings from './globals/EmailSettings'
import PaymentSettings from './globals/PaymentSettings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const createEmailAdapter = async () => {
  try {
    const payload = await import('payload')

    const emailSettings = await payload.default.findGlobal({
      slug: 'email-settings',
    })

    if (
      emailSettings?.resendEnabled &&
      emailSettings?.resendApiKey &&
      emailSettings?.resendFromAddress
    ) {
      return resendAdapter({
        apiKey: emailSettings.resendApiKey,
        defaultFromAddress: emailSettings.resendFromAddress,
        defaultFromName: emailSettings.resendFromName || 'OTT CMS',
      })
    }
  } catch (error) {
    console.warn('Could not load email settings from database:', error)
  }

  if (process.env.RESEND_API_KEY && process.env.RESEND_FROM_ADDRESS) {
    return resendAdapter({
      apiKey: process.env.RESEND_API_KEY,
      defaultFromAddress: process.env.RESEND_FROM_ADDRESS,
      defaultFromName: 'OTT CMS',
    })
  }

  return () => ({
    name: 'no-email',
    defaultFromName: 'OTT CMS',
    defaultFromAddress: 'no-reply@example.com',
    sendEmail: async () => {
      console.warn(
        'Email sending is not configured. Please configure email settings in the admin panel.',
      )
      return { message: 'Email sending is not configured' }
    },
  })
}

const emailAdapter = () => ({
  name: 'initializing',
  defaultFromName: 'OTT CMS',
  defaultFromAddress: 'no-reply@example.com',
  sendEmail: async () => {
    console.warn('Email system is still initializing. Please try again in a moment.')
    return { message: 'Email system is initializing' }
  },
})

console.log('Using DATABASE_URI:', process.env.DATABASE_URI)

export default buildConfig({
  admin: {
    meta: {
      titleSuffix: '- OTT CMS',
      icons: [{ rel: 'icon', url: '/favicon.ico' }],
      openGraph: { images: [{ url: '/og-image.png' }] },
    },
    components: {
      //   beforeLogin: [
      //     {
      //       path: '@/components/BeforeLogin',
      //       exportName: 'default',
      //     },
      //   ],
      //   beforeDashboard: [
      //     {
      //       path: '@/components/BeforeDashboard',
      //       exportName: 'default',
      //     },
      //   ],
      //   providers: [
      //     {
      //       path: '@/components/AdminEventProvider',
      //       exportName: 'default',
      //     },
      //   ],
      //   afterNavLinks: [
      //     {
      //       path: '@/components/admin/NotificationsPanel',
      //       exportName: 'default',
      //     },
      //   ],
    },
    importMap: {
      baseDir: path.resolve(dirname),
      importMapFile: path.resolve(dirname, 'payload-import-map.ts'),
    },
    user: Users.slug,
    livePreview: {
      breakpoints: [
        { label: 'Mobile', name: 'mobile', width: 375, height: 667 },
        { label: 'Tablet', name: 'tablet', width: 768, height: 1024 },
        { label: 'Desktop', name: 'desktop', width: 1440, height: 900 },
      ],
    },
  },
  editor: defaultLexical,
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI,
    },
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
    Filters,
    Carousels,
    LiveEvents,
    Recordings,
    LiveEventRegistrations,
    Notifications,
    Subscribers,
    SubscriptionPlans,
    DiscountCodes,
    Transactions,
    DigitalProducts,
    AddOns,
  ],
  globals: [
    Header,
    Footer,
    StreamingSettings,
    OTTSettings,
    CloudIntegrations,
    CloudStorageSettings,
    SiteSettings,
    EmailSettings,
    PaymentSettings,
  ],
  plugins: [...plugins, payloadCloudPlugin()],
  email: emailAdapter,
  endpoints: [...csvExportEndpoints],
  cors: [getServerSideURL()].filter(Boolean),
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
      run: ({ req }) => {
        if (req.user) return true
        const authHeader = req.headers.get('authorization')
        return authHeader === `Bearer ${process.env.CRON_SECRET}`
      },
    },
    tasks: [
      {
        slug: 'sendEventReminders',
        handler: './src/jobs/sendEventReminders',
        // Optional: Define input and output schemas if needed
      },
      {
        slug: 'monitorDisconnectedStreams',
        handler: './src/jobs/monitorDisconnectedStreams',
        // Optional: Define input and output schemas if needed
      },
    ],
    autoRun: [
      {
        cron: '*/5 * * * *', // every 5 minutes
        limit: 100,
        queue: 'default', // process up to 100 jobs from this queue
      },
      {
        cron: '*/1 * * * *',
        limit: 100,
        queue: 'default',
      },
    ],
  },
  onInit: async (payload) => {
    try {
      const adapter = await createEmailAdapter()
      // @ts-ignore
      payload.email.adapter = adapter
      console.log('Email adapter initialized successfully')
    } catch (error) {
      console.error('Failed to initialize email adapter:', error)
    }
  },
})
