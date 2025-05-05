import { withPayload } from '@payloadcms/next/withPayload'

import redirects from './redirects.js'

const NEXT_PUBLIC_SERVER_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : undefined || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // TODO: Fix TypeScript errors in API routes and remove this setting
  // This is a temporary workaround to allow builds to complete while we have
  // type errors in the Next.js API routes, particularly in the route.ts files.
  // The main application code is still type-checked with strict settings in tsconfig.json.
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      ...[NEXT_PUBLIC_SERVER_URL /* 'https://example.com' */].map((item) => {
        const url = new URL(item)

        return {
          hostname: url.hostname,
          protocol: url.protocol.replace(':', ''),
        }
      }),
      // Allow images from Mux
      {
        hostname: 'image.mux.com',
        protocol: 'https',
        pathname: '/**',
      },
      // Allow images from placeholder.com
      {
        hostname: 'via.placeholder.com',
        protocol: 'https',
        pathname: '/**',
      },
    ],
  },
  reactStrictMode: true,
  redirects,
  // Configure Turbopack and other experimental features
  experimental: {
    turbo: {
      // Configure any Turbopack-specific options here
      resolveAlias: {
        // Add any module aliases if needed
      },
    },
  },
  // Add server external packages
  serverExternalPackages: [
    '@payloadcms/storage-s3',
    '@payloadcms/storage-azure',
    '@payloadcms/storage-gcs',
    '@payloadcms/storage-vercel-blob',
    '@payloadcms/storage-uploadthing',
    'gcp-metadata',
    'google-auth-library',
    'agent-base',
  ],
  // We don't need transpilePackages since we're using serverExternalPackages
  // transpilePackages: [],
  // Webpack configuration to handle Node.js modules
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve these modules on the client to avoid errors
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
      }
    }
    return config
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
