import { logger } from '@/utils/logger'
import { NextResponse } from 'next/server'
import { createMuxService } from '@/services/mux/index'
import { logError } from '@/utils/errorHandler'
import { getMuxSettings } from '@/utilities/getMuxSettings'

export async function POST(request: Request) {
  try {
    logger.info({ context: 'direct-upload/route' }, 'direct-upload API endpoint called')
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
    const upload = await muxService.createDirectUpload({
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
    })
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
  } catch (error) {
    logger.error({ context: 'direct-upload/route' }, 'Error in direct upload endpoint:', error)
    logError(error, 'MuxDirectUpload.POST')

    return NextResponse.json(
      {
        success: false,
        error:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : 'An unknown error occurred'
            : 'Failed to create upload URL',
      },
      { status: 500 },
    )
  }
}
