import { logger } from '@/utils/logger'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { logError } from '@/utils/errorHandler'

/**
 * GET /api/videoassets/[id]/check-dependencies
 *
 * Check if a video asset has dependencies in other collections
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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
      (dep, index, self) => index === self.findIndex((d) => d.id === dep.id),
    )

    // Return the dependencies
    return NextResponse.json({
      dependencies: uniqueDependencies.map((dep) => ({
        id: dep.id,
        title: dep.title,
      })),
    })
  } catch (error) {
    logError(error, 'CheckDependenciesAPI')
    return NextResponse.json({ error: 'Failed to check dependencies' }, { status: 500 })
  }
}
