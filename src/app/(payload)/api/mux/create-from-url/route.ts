import { logger } from '@/utils/logger'
import { NextResponse } from 'next/server'
import { logError } from '@/utils/errorHandler'
import { getMuxSettings } from '@/utilities/getMuxSettings'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

/**
 * POST /api/mux/create-from-url
 *
 * Creates a Mux asset directly from a URL (e.g., Dropbox URL)
 * This is more efficient than downloading the file and then uploading it to Mux
 */
export async function POST(request: Request) {
  try {
    logger.info({ context: 'create-from-url/route' }, 'create-from-url API endpoint called')

    // Add request timeout handling
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      logger.warn(
        { context: 'create-from-url/route' },
        'Request timeout triggered after 60 seconds',
      )
      controller.abort()
    }, 60000) // 60 second timeout

    try {
      // Get Mux settings directly
      const muxSettings = await getMuxSettings()

      // Get the request parameters from the body
      const body = await request.json()
      const { url, filename, enableDRM, drmConfigurationId, overrideDRM } = body

      logger.info({ context: 'create-from-url/route' }, 'Received request with:', {
        url: url ? `${url.substring(0, 50)}...` : undefined, // Truncate URL for logging
        filename,
        enableDRM,
        drmConfigurationId,
        overrideDRM,
      })

      // Validate required parameters
      if (!url) {
        return NextResponse.json({ success: false, error: 'URL is required' }, { status: 400 })
      }

      // Clear the timeout since we've successfully parsed the request
      clearTimeout(timeoutId)

      // Determine which DRM configuration ID to use
      let drmConfigId = ''
      let playbackPolicy = ['public'] // Default to public playback policy

      if (enableDRM) {
        // If DRM is enabled, determine which configuration ID to use
        if (overrideDRM && drmConfigurationId) {
          // Use the provided DRM configuration ID if overriding
          drmConfigId = drmConfigurationId
          logger.info(
            { context: 'create-from-url/route' },
            'Using override DRM configuration ID:',
            drmConfigId,
          )
        } else if (muxSettings.enableDRMByDefault) {
          // Use the global default DRM configuration ID
          drmConfigId = muxSettings.defaultDRMConfigurationId
          logger.info(
            { context: 'create-from-url/route' },
            'Using global default DRM configuration ID:',
            drmConfigId,
          )
        } else {
          // Fallback to the API credentials DRM configuration ID
          drmConfigId = muxSettings.drmConfigurationId
          logger.info(
            { context: 'create-from-url/route' },
            'Using fallback DRM configuration ID:',
            drmConfigId,
          )
        }

        // DRM requires signed playback policy
        playbackPolicy = ['signed']
      }

      // Create the asset options
      const assetOptions = {
        input: url,
        playback_policy: playbackPolicy,
        ...(enableDRM && drmConfigId
          ? {
              drm: {
                drmConfigurationIds: [drmConfigId],
              },
            }
          : {}),
      }

      logger.info({ context: 'create-from-url/route' }, 'Creating asset with options:', {
        ...assetOptions,
        input: `${url.substring(0, 50)}...`, // Truncate URL for logging
      })

      // Create the asset with a timeout
      logger.info(
        { context: 'create-from-url/route' },
        'Starting Mux API request with 45 second timeout',
      )

      // Use the direct Mux API client
      // We'll use the updateAsset method with a special case to create an asset
      const asset = await Promise.race([
        // Create a new asset using the Mux API
        (async () => {
          try {
            // Use the Mux API directly through the service
            const response = await fetch('https://api.mux.com/video/v1/assets', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Basic ${Buffer.from(
                  `${muxSettings.tokenId}:${muxSettings.tokenSecret}`,
                ).toString('base64')}`,
              },
              body: JSON.stringify(assetOptions),
            })

            if (!response.ok) {
              const errorText = await response.text()
              throw new Error(`Mux API error (${response.status}): ${errorText}`)
            }

            const result = await response.json()
            return result.data
          } catch (error) {
            logger.error({ context: 'create-from-url/route' }, 'Error creating asset:', error)
            throw error
          }
        })(),
        new Promise((_, reject) => {
          setTimeout(() => {
            logger.warn(
              { context: 'create-from-url/route' },
              'Mux API request timed out after 45 seconds',
            )
            reject(
              new Error(
                'Mux API request timed out after 45 seconds. This could be due to rate limiting or high server load.',
              ),
            )
          }, 45000)
        }),
      ])

      logger.info({ context: 'create-from-url/route' }, 'Mux asset created:', {
        assetId: asset.id,
        playbackIds: asset.playback_ids,
        status: asset.status,
      })

      // Create a VideoAsset record in Payload
      try {
        const payload = await getPayload({ config: configPromise })

        // Create the VideoAsset
        // Use 'as any' to bypass TypeScript collection name checking
        // This is necessary because the collection name in the code might not match the TypeScript types
        const videoAsset = await (payload.create as any)({
          collection: 'videoAssets',
          data: {
            title: filename || 'Video from URL',
            sourceType: 'mux',
            muxData: {
              assetId: asset.id,
              playbackId: asset.playback_ids?.[0]?.id,
              status: asset.status,
            },
            // Generate a slug from the title
            slug: (filename || 'video-from-url').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          },
        })

        // Cast videoAsset to any to access properties that might not be in the TypeScript types
        const typedVideoAsset = videoAsset as any
        logger.info({ context: 'create-from-url/route' }, 'VideoAsset created:', {
          id: typedVideoAsset.id,
          title: typedVideoAsset.title,
        })

        // Log the successful creation
        logger.info(
          { context: 'create-from-url/route' },
          'Successfully created VideoAsset and Mux asset',
        )

        // Return the response with the asset and videoAsset data
        return NextResponse.json({
          success: true,
          data: {
            asset: {
              id: asset.id,
              playbackId: asset.playback_ids?.[0]?.id,
              status: asset.status,
            },
            videoAsset: {
              id: typedVideoAsset.id,
              title: typedVideoAsset.title,
            },
          },
        })
      } catch (payloadError) {
        logger.error(
          { context: 'create-from-url/route' },
          'Error creating VideoAsset:',
          payloadError,
        )

        // Return the Mux asset data even if creating the VideoAsset failed
        return NextResponse.json({
          success: true,
          data: {
            asset: {
              id: asset.id,
              playbackId: asset.playback_ids?.[0]?.id,
              status: asset.status,
            },
          },
          warning: 'Asset created in Mux but failed to create VideoAsset record',
        })
      }
    } catch (innerError) {
      // Handle errors from the inner try block
      logger.error({ context: 'create-from-url/route' }, 'Error creating Mux asset:', innerError)

      if (innerError instanceof Error && innerError.name === 'AbortError') {
        return NextResponse.json(
          {
            success: false,
            error: 'Request timed out. Please try again.',
          },
          { status: 408 },
        )
      }

      throw innerError // Re-throw to be caught by the outer catch block
    }
  } catch (error) {
    logger.error({ context: 'create-from-url/route' }, 'Error in create-from-url endpoint:', error)
    logError(error, 'MuxCreateFromUrl.POST')

    // Determine the appropriate status code
    let statusCode = 500
    let errorMessage = 'Failed to create Mux asset from URL'

    if (error instanceof Error) {
      // Check for specific error types
      if (error.message.includes('timeout') || error.message.includes('timed out')) {
        statusCode = 408 // Request Timeout
        errorMessage = 'The request to Mux timed out. Please try again.'
      } else if (error.message.includes('network') || error.message.includes('connection')) {
        statusCode = 503 // Service Unavailable
        errorMessage =
          'Network error while connecting to Mux. Please check your connection and try again.'
      } else if (
        error.message.includes('credentials') ||
        error.message.includes('authentication')
      ) {
        statusCode = 401 // Unauthorized
        errorMessage = 'Authentication with Mux failed. Please check your API credentials.'
      }

      // In development, show the actual error message
      if (process.env.NODE_ENV === 'development') {
        errorMessage = error.message
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: statusCode },
    )
  }
}
