import { logger } from '@/utils/logger'
import { NextResponse } from 'next/server'
import { createMuxService } from '@/services/mux/index'
import { logError } from '@/utils/errorHandler'
import { getMuxSettings } from '@/utilities/getMuxSettings'

export async function POST(request: Request) {
  try {
    logger.info({ context: 'direct-upload/route' }, 'direct-upload API endpoint called')

    // Add request timeout handling
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      logger.warn({ context: 'direct-upload/route' }, 'Request timeout triggered after 60 seconds')
      controller.abort()
    }, 60000) // 60 second timeout

    try {
      const muxService = await createMuxService()
      const muxSettings = await getMuxSettings()

      // Get the request parameters from the body
      const body = await request.json()
      const { filename, enableDRM, drmConfigurationId, overrideDRM } = body
      logger.info({ context: 'direct-upload/route' }, 'Received request with:', {
        filename,
        enableDRM,
        drmConfigurationId,
        overrideDRM,
      })

      // Clear the timeout since we've successfully parsed the request
      clearTimeout(timeoutId)

      logger.info({ context: 'direct-upload/route' }, 'Creating direct upload with Mux service')

      // Determine which DRM configuration ID to use
      let drmConfigId = ''

      if (enableDRM) {
        // If DRM is enabled, determine which configuration ID to use
        if (overrideDRM && drmConfigurationId) {
          // Use the provided DRM configuration ID if overriding
          drmConfigId = drmConfigurationId
          logger.info(
            { context: 'direct-upload/route' },
            'Using override DRM configuration ID:',
            drmConfigId,
          )
        } else if (muxSettings.enableDRMByDefault) {
          // Use the global default DRM configuration ID
          drmConfigId = muxSettings.defaultDRMConfigurationId
          logger.info(
            { context: 'direct-upload/route' },
            'Using global default DRM configuration ID:',
            drmConfigId,
          )
        } else {
          // Fallback to the API credentials DRM configuration ID
          drmConfigId = muxSettings.drmConfigurationId
          logger.info(
            { context: 'direct-upload/route' },
            'Using fallback DRM configuration ID:',
            drmConfigId,
          )
        }
      }

      // Use the createMuxUpload utility to handle DRM configuration
      const uploadOptions = {
        ...(filename ? { metadata: { filename } } : {}),
        ...(enableDRM && drmConfigId
          ? {
              newAssetSettings: {
                playbackPolicy: ['signed'], // DRM requires signed playback policy
                drm: {
                  drmConfigurationIds: [drmConfigId],
                },
              },
            }
          : {}),
      }

      logger.info(
        { context: 'direct-upload/route' },
        'Creating direct upload with options:',
        uploadOptions,
      )

      // Create the upload with a timeout
      logger.info(
        { context: 'direct-upload/route' },
        'Starting Mux API request with 45 second timeout',
      )
      const upload = (await Promise.race([
        muxService.createDirectUpload(uploadOptions),
        new Promise((_, reject) => {
          setTimeout(() => {
            logger.warn(
              { context: 'direct-upload/route' },
              'Mux API request timed out after 45 seconds',
            )
            reject(
              new Error(
                'Mux API request timed out after 45 seconds. This could be due to rate limiting or high server load.',
              ),
            )
          }, 45000)
        }),
      ])) as { uploadId: string; url: string }

      logger.info({ context: 'direct-upload/route' }, 'Mux direct upload created:', {
        uploadId: upload.uploadId,
      })

      // The Mux upload response should contain both the URL and upload ID
      const response = {
        success: true,
        data: {
          url: upload.url,
          uploadId: upload.uploadId,
        },
      }

      logger.info({ context: 'direct-upload/route' }, 'Returning response:', {
        ...response,
        data: { ...response.data, url: '(url hidden)' },
      })

      return NextResponse.json(response)
    } catch (innerError) {
      // Handle errors from the inner try block
      logger.error({ context: 'direct-upload/route' }, 'Error creating Mux upload:', innerError)

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
    logger.error({ context: 'direct-upload/route' }, 'Error in direct upload endpoint:', error)
    logError(error, 'MuxDirectUpload.POST')

    // Determine the appropriate status code
    let statusCode = 500
    let errorMessage = 'Failed to create upload URL'

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
