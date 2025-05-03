import { logger } from '@/utils/logger'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { logError } from '@/utils/errorHandler'

/**
 * DELETE /api/videoassets/[id]/force-delete
 *
 * Force delete a video asset and clean up references in other collections
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

    // Check if this video asset is referenced in any Content records
    const contentWithMainVideo = await payload.find({
      collection: 'content',
      where: {
        mainVideo: { equals: id },
      },
      depth: 0,
    })

    const contentWithTrailerVideo = await payload.find({
      collection: 'content',
      where: {
        trailerVideo: { equals: id },
      },
      depth: 0,
    })

    // Check for references in bonus videos array
    const contentWithBonusVideos = await payload.find({
      collection: 'content',
      where: {
        'bonusVideos.video': { equals: id },
      },
      depth: 1, // Need depth 1 to get the actual bonus videos
    })

    // Combine all dependencies
    const allDependencies = [
      ...contentWithMainVideo.docs,
      ...contentWithTrailerVideo.docs,
      ...contentWithBonusVideos.docs,
    ]

    // Remove duplicates (in case a video is used in multiple fields of the same content)
    const uniqueDependencies = allDependencies.filter(
      (dep, index, self) => index === self.findIndex((d) => d.id === dep.id),
    )

    logger.info(
      { context: 'force-delete/route' },
      `Force deleting video asset ${id} and cleaning up ${uniqueDependencies.length} dependencies`,
    )

    // Update each content record to remove references to this video asset
    for (const content of uniqueDependencies) {
      const updateData: any = {}

      // Check if this video is used as the main video
      if (content.mainVideo === id) {
        updateData.mainVideo = null
      }

      // Check if this video is used as the trailer video
      if (content.trailerVideo === id) {
        updateData.trailerVideo = null
      }

      // Check if this video is used in bonus videos
      if (content.bonusVideos?.some((bonus: any) => bonus.video === id)) {
        // Get the current bonus videos
        const currentBonusVideos = await payload
          .findByID({
            collection: 'content',
            id: content.id,
            depth: 1,
          })
          .then((result) => result.bonusVideos || [])

        // Filter out the ones that reference this video
        updateData.bonusVideos = currentBonusVideos.filter((bonus: any) => bonus.video !== id)
      }

      // Update the content record
      await payload.update({
        collection: 'content',
        id: content.id,
        data: updateData,
      })

      logger.info(
        { context: 'force-delete/route' },
        `Updated content ${content.id} to remove references to video asset ${id}`,
      )
    }

    // Now delete the video asset with the force flag
    await payload.delete({
      collection: 'videoassets',
      id,
      query: { force: 'true' }, // Add force flag to bypass dependency check
    })

    logger.info({ context: 'force-delete/route' }, `Successfully deleted video asset ${id}`)

    return NextResponse.json({
      message: `Successfully deleted video asset and cleaned up ${uniqueDependencies.length} references`,
      deletedCount: 1,
      cleanedReferences: uniqueDependencies.length,
    })
  } catch (error) {
    logError(error, 'ForceDeleteVideoAssetAPI')
    return NextResponse.json({ error: 'Failed to force delete video asset' }, { status: 500 })
  }
}
