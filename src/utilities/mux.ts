import { createMuxService } from '@/services/mux';

const muxService = createMuxService();

export const createMuxUpload = async (options?: {
  metadata?: Record<string, string>
  passthrough?: Record<string, string>
}) => {
  try {
    console.log('Creating Mux upload with options:', options)
    return await muxService.createDirectUpload(options);
  } catch (error) {
    console.error('Error creating Mux upload:', error)
    throw error
  }
}

export const getMuxAsset = async (assetId: string) => {
  try {
    return await muxService.getAsset(assetId);
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

