// src/app/api/mux/webhook/route.ts
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
// No need for the utility function anymore

export async function POST(req: NextRequest) {
  try {
    // Verify Mux webhook signature
    const signature = req.headers.get('mux-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
    }

    // Get request body as text
    const body = await req.text()

    // Verify signature
    const secret = process.env.MUX_WEBHOOK_SECRET
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(body)
    const calculatedSignature = hmac.digest('hex')

    if (signature !== calculatedSignature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Parse the event
    const event = JSON.parse(body)
    const { type, data } = event

    const payload = await getPayload({ config: configPromise })

    // Handle different event types
    switch (type) {
      case 'video.asset.ready': {
        // Update the video status to ready
        const { id: assetId, aspect_ratio, duration, playback_ids } = data

        // Find the video with this assetId
        const videos = await payload.find({
          collection: 'videos',
          where: {
            'muxData.assetId': {
              equals: assetId,
            },
          },
        })

        if (videos.docs.length > 0) {
          const video = videos.docs[0]

          if (!video) {
            console.error(`Video not found for assetId ${assetId}`)
            break
          }

          // Update the video with the Mux asset data
          await payload.update({
            collection: 'videos',
            id: video.id,
            data: {
              muxData: {
                ...video.muxData,
                status: 'ready',
                playbackId: playback_ids?.[0]?.id,
              },
              aspectRatio: aspect_ratio,
              duration: duration,
              // Update other metadata as needed
            },
          })
        }

        break
      }

      case 'video.upload.asset_created': {
        // When an upload creates an asset, update our record
        const { id: assetId, upload_id } = data

        // Find video with this uploadId
        const videos = await payload.find({
          collection: 'videos',
          where: {
            'muxData.uploadId': {
              equals: upload_id,
            },
          },
        })

        if (videos.docs.length > 0) {
          const video = videos.docs[0]

          if (!video) {
            console.error(`Video not found for uploadId ${upload_id}`)
            break
          }

          // Update the video with the asset data
          await payload.update({
            collection: 'videos',
            id: video.id,
            data: {
              muxData: {
                ...video.muxData,
                assetId: assetId,
                // We'll need to get the playback ID from the asset
                // This will be updated when the asset is ready
                status: 'processing',
              },
            },
          })
        }

        break
      }

      // Handle other event types as needed
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Error handling Mux webhook:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Error processing webhook: ${errorMessage}` },
      { status: 500 },
    )
  }
}
