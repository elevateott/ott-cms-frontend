// src/utilities/mux.ts
import Mux from '@mux/mux-node'

// Initialize Mux with your API credentials
const muxClient = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
})

// Access the Video API
const { video } = muxClient

export const createMuxUpload = async (options?: { metadata?: Record<string, string> }) => {
  try {
    const upload = await video.uploads.create({
      cors_origin: '*',
      new_asset_settings: {
        playback_policy: ['public'],
        // Remove the deprecated mp4_support parameter
      },
      ...(options?.metadata ? { metadata: options.metadata } : {}),
    })

    return {
      url: upload.url,
      uploadId: upload.id,
    }
  } catch (error) {
    console.error('Error creating Mux upload:', error)
    throw new Error('Failed to create Mux upload')
  }
}

export const getMuxAsset = async (assetId: string) => {
  try {
    const asset = await video.assets.retrieve(assetId)
    return asset
  } catch (error) {
    console.error(`Error fetching Mux asset ${assetId}:`, error)
    throw new Error('Failed to fetch Mux asset')
  }
}

export const createMuxThumbnail = async (assetId: string, time: number = 0) => {
  try {
    // For now, we'll just return the URL to the thumbnail
    // In a real implementation, you would use the Mux API to create a thumbnail
    // and then upload it to your media collection
    const playbackId = (await getMuxAsset(assetId)).playback_ids?.[0]?.id

    if (!playbackId) {
      throw new Error('No playback ID found for asset')
    }

    // Return the thumbnail URL
    const thumbnailUrl = `https://image.mux.com/${playbackId}/thumbnail.jpg?time=${time}`

    return { url: thumbnailUrl }
  } catch (error) {
    console.error(`Error creating Mux thumbnail for asset ${assetId}:`, error)
    throw new Error('Failed to create Mux thumbnail')
  }
}

export const deleteMuxAsset = async (assetId: string) => {
  try {
    await video.assets.delete(assetId)
    return true
  } catch (error) {
    console.error(`Error deleting Mux asset ${assetId}:`, error)
    throw new Error('Failed to delete Mux asset')
  }
}
