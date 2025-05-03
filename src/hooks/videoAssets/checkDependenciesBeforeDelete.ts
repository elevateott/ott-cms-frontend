import { logger } from '@/utils/logger'
import type { CollectionBeforeDeleteHook } from 'payload'

/**
 * Hook to check for dependencies before deleting a video asset
 * 
 * This hook checks if the video asset is referenced in any Content records
 * and throws an error with dependency information if found
 */
export const checkDependenciesBeforeDelete: CollectionBeforeDeleteHook = async ({
  id,
  req,
  collection,
}) => {
  // Only run this hook for the videoassets collection
  if (collection.slug !== 'videoassets') return

  try {
    const { payload } = req

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
      depth: 0,
    })

    // Combine all dependencies
    const allDependencies = [
      ...contentWithMainVideo.docs,
      ...contentWithTrailerVideo.docs,
      ...contentWithBonusVideos.docs,
    ]

    // Remove duplicates (in case a video is used in multiple fields of the same content)
    const uniqueDependencies = allDependencies.filter(
      (dep, index, self) => index === self.findIndex((d) => d.id === dep.id)
    )

    // If there are dependencies and this is not a force delete, throw an error
    if (uniqueDependencies.length > 0 && !req.query?.force) {
      logger.info(
        { context: 'checkDependenciesBeforeDelete' },
        `Video asset ${id} has ${uniqueDependencies.length} dependencies`
      )

      // Throw an error with dependency information
      // This will be caught by the API endpoint
      throw new Error(
        JSON.stringify({
          code: 'DEPENDENCIES_FOUND',
          message: `This video asset is used in ${uniqueDependencies.length} content items`,
          dependencies: uniqueDependencies.map((dep) => ({
            id: dep.id,
            title: dep.title,
          })),
        })
      )
    }

    // If we're doing a force delete, clean up the references
    if (uniqueDependencies.length > 0 && req.query?.force) {
      logger.info(
        { context: 'checkDependenciesBeforeDelete' },
        `Force deleting video asset ${id} and cleaning up ${uniqueDependencies.length} dependencies`
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
          const currentBonusVideos = await payload.findByID({
            collection: 'content',
            id: content.id,
            depth: 1,
          }).then((result) => result.bonusVideos || [])

          // Filter out the ones that reference this video
          updateData.bonusVideos = currentBonusVideos.filter(
            (bonus: any) => bonus.video !== id
          )
        }

        // Update the content record
        await payload.update({
          collection: 'content',
          id: content.id,
          data: updateData,
        })

        logger.info(
          { context: 'checkDependenciesBeforeDelete' },
          `Updated content ${content.id} to remove references to video asset ${id}`
        )
      }
    }
  } catch (error) {
    // If this is our custom error with dependency information, rethrow it
    if (error instanceof Error && error.message.includes('DEPENDENCIES_FOUND')) {
      throw error
    }

    // Otherwise log the error and continue
    logger.error(
      { context: 'checkDependenciesBeforeDelete' },
      `Error checking dependencies for video asset ${id}:`,
      error
    )
  }
}
