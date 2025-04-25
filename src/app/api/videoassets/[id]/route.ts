import { logger } from '@/utils/logger'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { logError } from '@/utils/errorHandler'

/**
 * DELETE /api/videoassets/[id]
 *
 * Delete a video asset by ID
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Ensure params is awaited if it's a promise
    const resolvedParams = params instanceof Promise ? await params : params
    const id = resolvedParams.id

    if (!id) {
      return NextResponse.json({ error: 'Video asset ID is required' }, { status: 400 })
    }

    // Initialize Payload
    const payload = await getPayload({ config: configPromise })

    // Try to delete the video asset
    await payload.delete({
      collection: 'videoassets',
      id,
    })

    logger.info({ context: 'delete/route' }, `Successfully deleted video asset ${id}`)

    return NextResponse.json({
      message: 'Successfully deleted video asset',
      deletedCount: 1,
    })
  } catch (error) {
    // Check if this is our custom error with dependency information
    if (error instanceof Error && error.message.includes('DEPENDENCIES_FOUND')) {
      try {
        const errorData = JSON.parse(error.message)
        return NextResponse.json(
          {
            error: errorData.message,
            code: errorData.code,
            dependencies: errorData.dependencies,
          },
          { status: 400 },
        )
      } catch (parseError) {
        // If we can't parse the error, just return a generic error
        logError(parseError, 'DeleteVideoAssetAPI')
      }
    }

    logError(error, 'DeleteVideoAssetAPI')
    return NextResponse.json({ error: 'Failed to delete video asset' }, { status: 500 })
  }
}
