import { NextResponse } from 'next/server'
import { logger } from '@/utils/logger'
import { getPayload } from '@/utilities/payload'
import { configPromise } from '@/payload.config'
import { getMuxSettings } from '@/utilities/getMuxSettings'
import { createMuxService } from '@/services/mux'

/**
 * POST /api/mux/create
 *
 * Creates a Mux asset from a file upload
 * This endpoint handles file uploads from the Google Drive integration
 */
export async function POST(request: Request) {
  try {
    logger.info({ context: 'create/route' }, 'create API endpoint called')

    // Add request timeout handling
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      logger.warn(
        { context: 'create/route' },
        'Request timeout triggered after 60 seconds',
      )
      controller.abort()
    }, 60000) // 60 second timeout

    try {
      // Get Mux settings directly
      const muxSettings = await getMuxSettings()

      // Get the form data
      const formData = await request.formData()
      const file = formData.get('file') as File
      const filename = formData.get('filename') as string
      const enableDRM = formData.get('enableDRM') === 'true'
      const drmConfigurationId = formData.get('drmConfigurationId') as string | null

      logger.info({ context: 'create/route' }, 'Received request with:', {
        filename,
        fileSize: file?.size,
        enableDRM,
        drmConfigurationId,
      })

      // Validate required parameters
      if (!file) {
        return NextResponse.json({ success: false, error: 'File is required' }, { status: 400 })
      }

      if (!filename) {
        return NextResponse.json({ success: false, error: 'Filename is required' }, { status: 400 })
      }

      // Initialize Mux service
      const muxService = await createMuxService()

      // Determine playback policy based on DRM settings
      let playbackPolicy = ['public']
      let drmConfigId = null

      if (enableDRM) {
        // If a specific DRM configuration ID is provided, use it
        if (drmConfigurationId) {
          drmConfigId = drmConfigurationId
          logger.info(
            { context: 'create/route' },
            'Using provided DRM configuration ID:',
            drmConfigId,
          )
        } else {
          // Fallback to the API credentials DRM configuration ID
          drmConfigId = muxSettings.drmConfigurationId
          logger.info(
            { context: 'create/route' },
            'Using fallback DRM configuration ID:',
            drmConfigId,
          )
        }

        // DRM requires signed playback policy
        playbackPolicy = ['signed']
      }

      // Create a direct upload URL
      const uploadOptions = {
        newAssetSettings: {
          playback_policy: playbackPolicy,
          ...(enableDRM && drmConfigId
            ? {
                drm: {
                  drmConfigurationIds: [drmConfigId],
                },
              }
            : {}),
        },
      }

      logger.info({ context: 'create/route' }, 'Creating direct upload with options:', uploadOptions)

      // Create the upload with a timeout
      const upload = (await Promise.race([
        muxService.createDirectUpload(uploadOptions),
        new Promise((_, reject) => {
          setTimeout(() => {
            logger.warn(
              { context: 'create/route' },
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

      logger.info({ context: 'create/route' }, 'Mux direct upload created:', {
        uploadId: upload.uploadId,
      })

      // Upload the file to Mux
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const uploadResponse = await fetch(upload.url, {
        method: 'PUT',
        body: buffer,
        headers: {
          'Content-Type': file.type,
        },
      })

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload file to Mux: ${uploadResponse.status} ${uploadResponse.statusText}`)
      }

      logger.info({ context: 'create/route' }, 'File uploaded to Mux successfully')

      // Wait for the asset to be created
      // This may take a few seconds
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Get the asset details
      const asset = await muxService.getAssetByUploadId(upload.uploadId)

      if (!asset) {
        logger.warn(
          { context: 'create/route' },
          'Asset not found after upload, it may still be processing',
        )

        // Return the upload ID even if the asset is not ready yet
        return NextResponse.json({
          success: true,
          data: {
            uploadId: upload.uploadId,
            message: 'File uploaded successfully, asset is still processing',
          },
        })
      }

      logger.info({ context: 'create/route' }, 'Mux asset created:', {
        assetId: asset.id,
        playbackIds: asset.playback_ids,
        status: asset.status,
      })

      // Create a VideoAsset record in Payload
      try {
        const payload = await getPayload({ config: configPromise })

        // Create the VideoAsset
        const videoAsset = await (payload.create as any)({
          collection: 'videoAssets',
          data: {
            title: filename || 'Uploaded Video',
            sourceType: 'mux',
            muxData: {
              assetId: asset.id,
              playbackId: asset.playback_ids?.[0]?.id,
              status: asset.status,
            },
            // Generate a slug from the title
            slug: (filename || 'uploaded-video').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          },
        })

        // Cast videoAsset to any to access properties that might not be in the TypeScript types
        const typedVideoAsset = videoAsset as any
        logger.info({ context: 'create/route' }, 'VideoAsset created:', {
          id: typedVideoAsset.id,
          title: typedVideoAsset.title,
        })

        // Log the successful creation
        logger.info(
          { context: 'create/route' },
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
          { context: 'create/route' },
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
      logger.error({ context: 'create/route' }, 'Error creating Mux asset:', innerError)

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
    } finally {
      clearTimeout(timeoutId)
    }
  } catch (error) {
    // Handle errors from the outer try block
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error({ context: 'create/route' }, 'Unhandled error:', error)

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 },
    )
  }
}
