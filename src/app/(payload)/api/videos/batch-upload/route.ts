// src/app/api/videos/batch-upload/route.ts
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { createMuxUpload } from '@/utilities/mux'
// No need for the utility function anymore

export async function POST(req: NextRequest) {
  try {
    // Authenticate the request
    const payload = await getPayload({ config: configPromise })

    const { user } = await payload.auth({ headers: req.headers })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get batch upload data from request
    const { videos } = await req.json()

    if (!Array.isArray(videos) || videos.length === 0) {
      return NextResponse.json({ error: 'No videos provided' }, { status: 400 })
    }

    // Process each video in the batch
    const results = await Promise.all(
      videos.map(async (videoData) => {
        try {
          // Create a Mux upload URL for each video
          const { url, uploadId } = await createMuxUpload()

          // Create a video document in Payload
          const video = await payload.create({
            collection: 'videos',
            data: {
              title: videoData.title,
              description: videoData.description || '',
              sourceType: 'mux',
              muxData: {
                uploadId,
                status: 'uploading',
              },
              category: videoData.categoryId,
              tags: videoData.tagIds,
              visibility: videoData.visibility || 'public',
              publishedAt: new Date().toISOString(),
            },
          })

          return {
            videoId: video.id,
            title: video.title,
            uploadUrl: url,
            success: true,
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          console.error(`Error processing video "${videoData.title}":`, error)

          return {
            title: videoData.title,
            error: errorMessage,
            success: false,
          }
        }
      }),
    )

    return NextResponse.json({
      results,
      summary: {
        total: videos.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
      },
    })
  } catch (error: unknown) {
    console.error('Error in batch upload:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to process batch upload: ${errorMessage}` },
      { status: 500 },
    )
  }
}
