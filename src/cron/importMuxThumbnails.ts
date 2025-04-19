// src/cron/importMuxThumbnails.ts
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { createMuxThumbnail } from '@/utilities/mux'

export async function importMuxThumbnails() {
  try {
    const payload = await getPayload({ config: configPromise })

    // Find videos that need thumbnails
    const videos = await payload.find({
      collection: 'videos',
      where: {
        and: [
          {
            sourceType: {
              equals: 'mux',
            },
          },
          {
            'muxData.status': {
              equals: 'ready',
            },
          },
          {
            thumbnail: {
              exists: false,
            },
          },
        ],
      },
      limit: 10, // Process in batches
    })

    for (const video of videos.docs) {
      try {
        // Skip if no asset ID
        if (!video.muxData?.assetId) continue

        // Create a thumbnail
        const thumbnail = await createMuxThumbnail(video.muxData.assetId, 1) // 1 second in

        // Download the thumbnail and create a media item
        const response = await fetch(thumbnail.url)
        const blob = await response.blob()

        // Convert blob to buffer
        const buffer = Buffer.from(await blob.arrayBuffer())

        // Upload to media collection
        const media = await payload.create({
          collection: 'media',
          data: {
            alt: `Thumbnail for ${video.title}`,
          },
          file: {
            data: buffer,
            mimetype: 'image/jpeg',
            name: `${video.id}-thumbnail.jpg`,
            size: buffer.length,
          },
        })

        // Update the video with the thumbnail
        await payload.update({
          collection: 'videos',
          id: video.id,
          data: {
            thumbnail: media.id,
          },
        })

        payload.logger.info(`Created thumbnail for video ${video.id}`)
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        payload.logger.error(`Error creating thumbnail for video ${video.id}: ${errorMessage}`)
        // Continue with other videos
      }
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`Error in importMuxThumbnails job: ${errorMessage}`)
  }
}
