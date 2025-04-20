import payload from 'payload'
import { OttVideo } from '../payload-types'

export class VideoRepository {
  private readonly collectionName = 'ott-videos'

  /**
   * Find a video by Mux upload ID
   */
  async findByMuxUploadId(uploadId: string): Promise<OttVideo | undefined> {
    try {
      const result = await payload.find({
        collection: this.collectionName,
        where: {
          'muxData.uploadId': {
            equals: uploadId,
          },
        },
      })
      return result.docs[0] as OttVideo | undefined
    } catch (error) {
      console.error(`Failed to find video by upload ID ${uploadId}:`, error)
      throw error
    }
  }

  /**
   * Find a video by Mux asset ID
   */
  async findByMuxAssetId(assetId: string): Promise<OttVideo | undefined> {
    try {
      const result = await payload.find({
        collection: this.collectionName,
        where: {
          'muxData.assetId': {
            equals: assetId,
          },
        },
      })
      return result.docs[0] as OttVideo | undefined
    } catch (error) {
      console.error(`Failed to find video by asset ID ${assetId}:`, error)
      throw error
    }
  }

  /**
   * Update a video
   */
  async update(id: string, data: Partial<OttVideo>): Promise<OttVideo> {
    try {
      const result = await payload.update({
        collection: this.collectionName,
        id,
        data,
      })
      return result as OttVideo
    } catch (error) {
      console.error(`Failed to update video ${id}:`, error)
      throw error
    }
  }

  /**
   * Create a new video
   */
  async create(data: Omit<OttVideo, 'id' | 'createdAt' | 'updatedAt'>): Promise<OttVideo> {
    try {
      const result = await payload.create({
        collection: this.collectionName,
        data,
      })
      return result as OttVideo
    } catch (error) {
      console.error('Failed to create video:', error)
      throw error
    }
  }

  /**
   * Delete a video
   */
  async delete(id: string): Promise<boolean> {
    try {
      await payload.delete({
        collection: this.collectionName,
        id,
      })
      return true
    } catch (error) {
      console.error(`Failed to delete video ${id}:`, error)
      return false
    }
  }
}
