// src/utilities/loadStorageAdapter.ts
import { getPayload } from '@/payload'
import configPromise from '@payload-config'
import { logger } from '@/utils/logger'

// This is a server-only module
export const loadStorageAdapter = async () => {
  // Only run on the server
  if (typeof window !== 'undefined') {
    logger.warn(
      { context: 'loadStorageAdapter' },
      'loadStorageAdapter called in browser environment, returning undefined',
    )
    return undefined
  }

  try {
    // Get payload instance
    const payload = await getPayload({ config: configPromise })

    // Get cloud storage settings
    const settings = await payload
      .findGlobal({
        slug: 'cloud-storage-settings',
      })
      .catch(() => null)

    // If settings don't exist or cloud storage is not enabled, use local storage
    if (!settings || !settings.enabled) {
      logger.info(
        { context: 'loadStorageAdapter' },
        'Cloud storage is not enabled, using local storage',
      )
      return undefined
    }

    const provider = settings.provider
    logger.info({ context: 'loadStorageAdapter', provider }, 'Loading cloud storage adapter')

    // Initialize the appropriate adapter based on the selected provider
    switch (provider) {
      case 'vercel-blob': {
        const config = settings.vercelBlob || {}
        const { vercelBlobStorage } = await import('@payloadcms/storage-vercel-blob')
        return vercelBlobStorage({
          token: config.token,
          addRandomSuffix: config.addRandomSuffix,
          cacheControlMaxAge: config.cacheControlMaxAge,
        })
      }

      case 's3': {
        const config = settings.s3 || {}
        const { s3Storage } = await import('@payloadcms/storage-s3')
        return s3Storage({
          config: {
            credentials: {
              accessKeyId: config.accessKeyId,
              secretAccessKey: config.secretAccessKey,
            },
            region: config.region,
            endpoint: config.endpoint || undefined,
            forcePathStyle: config.forcePathStyle || false,
          },
          bucket: config.bucket,
        })
      }

      case 'azure': {
        const config = settings.azure || {}
        const { azureStorage } = await import('@payloadcms/storage-azure')
        return azureStorage({
          connectionString: config.connectionString,
          containerName: config.containerName,
          allowContainerCreate: config.allowContainerCreate || false,
          baseURL: config.baseURL || undefined,
        })
      }

      case 'gcs': {
        const config = settings.gcs || {}
        const adapterConfig: any = {
          bucket: config.bucket,
        }

        if (config.projectId) {
          adapterConfig.projectId = config.projectId
        }

        if (config.keyFilename) {
          adapterConfig.keyFilename = config.keyFilename
        }

        if (config.credentials) {
          try {
            adapterConfig.credentials = JSON.parse(config.credentials)
          } catch (error) {
            logger.error(
              { context: 'loadStorageAdapter', error },
              'Failed to parse GCS credentials JSON',
            )
          }
        }

        const { gcsStorage } = await import('@payloadcms/storage-gcs')
        return gcsStorage(adapterConfig)
      }

      case 'uploadthing': {
        const config = settings.uploadthing || {}
        const { uploadthingStorage } = await import('@payloadcms/storage-uploadthing')
        return uploadthingStorage({
          apiKey: config.apiKey,
          secretKey: config.secretKey,
          appId: config.appId,
        })
      }

      default:
        logger.warn(
          { context: 'loadStorageAdapter', provider },
          'Unknown provider, falling back to local storage',
        )
        return undefined
    }
  } catch (error) {
    logger.error({ context: 'loadStorageAdapter', error }, 'Error loading storage adapter')
    return undefined // Fall back to local storage on error
  }
}
