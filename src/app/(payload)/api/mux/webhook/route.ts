// src/app/api/mux/webhook/route.ts
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    // Get request body as text
    const body = await req.text()

    // Log the headers for debugging
    console.log('Webhook headers:', {
      signature: req.headers.get('mux-signature'),
      contentType: req.headers.get('content-type'),
    })

    // Verify the webhook signature
    const signature = req.headers.get('mux-signature')
    if (!signature) {
      console.error('No signature provided in webhook request')
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
    }

    // Use the webhook secret from the .env file
    const secret = process.env.MUX_WEBHOOK_SECRET
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(body)
    const calculatedSignature = hmac.digest('hex')

    // Log signature verification details for debugging
    console.log('Signature verification:', {
      receivedSignature: signature.substring(0, 10) + '...',
      calculatedSignature: calculatedSignature.substring(0, 10) + '...',
      match: signature === calculatedSignature,
    })

    // Enforce signature verification
    if (signature !== calculatedSignature) {
      console.error('Invalid signature in webhook request')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Parse the event
    let event
    try {
      event = JSON.parse(body)
      const { type, data } = event

      console.log('Received Mux webhook event:', {
        type,
        data: JSON.stringify(data).substring(0, 200) + '...',
        bodyLength: body.length,
      })
    } catch (error) {
      console.error('Error parsing webhook body:', error)
      console.log('Webhook body:', body.substring(0, 500) + '...')
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

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

      case 'video.asset.created': {
        // Extract data from the webhook payload
        const { id: assetId, playback_ids, duration } = data

        // Extract the filename from the asset data
        // The filename is usually in the asset's metadata or can be derived from the asset ID
        let title = 'Untitled Video'

        // If there's metadata with a filename, use it as the title
        if (data.metadata && data.metadata.filename) {
          // Remove file extension from the filename
          title = data.metadata.filename.replace(/\.[^/.]+$/, '')
        }

        // Create a new video document
        try {
          const newVideo = await payload.create({
            collection: 'videos',
            data: {
              title,
              sourceType: 'mux',
              muxData: {
                assetId,
                playbackId: playback_ids?.[0]?.id,
                status: 'processing',
              },
              duration: duration || 0,
              publishedAt: new Date().toISOString(),
            },
          })

          console.log('Created new video from Mux asset:', newVideo.id)
        } catch (error) {
          console.error('Error creating video from Mux asset:', error)
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
