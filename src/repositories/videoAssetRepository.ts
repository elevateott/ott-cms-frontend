import { getPayload } from '@/utils/getPayload'

export class VideoAssetRepository {
  private readonly collectionSlug: string = 'videoassets'
  private payload: any

  constructor(req?: any) {
    // Get the Payload instance
    this.payload = getPayload(req)
  }

  public async findByMuxUploadId(uploadId: string): Promise<any> {
    try {
      return await this.findByField('muxData.uploadId', uploadId)
    } catch (error) {
      console.error('❌ Error in findByMuxUploadId:', error)
      throw error
    }
  }

  public async findByMuxAssetId(assetId: string): Promise<any> {
    try {
      return await this.findByField('muxData.assetId', assetId)
    } catch (error) {
      console.error('❌ Error in findByMuxAssetId:', error)
      throw error
    }
  }

  /**
   * Update a video asset
   */
  async update(id: string, data: any): Promise<any> {
    try {
      const result = await this.payload.update({
        collection: this.collectionSlug,
        id,
        data,
      })

      return result
    } catch (error) {
      console.error(`Failed to update video asset ${id}:`, error)
      throw error
    }
  }

  /**
   * Create a new video asset
   */
  async create(data: any): Promise<any> {
    try {
      const result = await this.payload.create({
        collection: this.collectionSlug,
        data,
      })

      return result
    } catch (error) {
      console.error('Failed to create video asset:', error)
      throw error
    }
  }

  /**
   * Delete a video asset
   */
  async delete(id: string): Promise<boolean> {
    try {
      await this.payload.delete({
        collection: this.collectionSlug,
        id,
      })

      return true
    } catch (error) {
      console.error(`Failed to delete video asset ${id}:`, error)
      return false
    }
  }

  /**
   * Find a document by a specific field value
   */
  private async findByField(field: string, value: any): Promise<any> {
    try {
      const result = await this.payload.find({
        collection: this.collectionSlug,
        where: {
          [field]: {
            equals: value,
          },
        },
      })

      return result.docs[0] || null
    } catch (error) {
      console.error(`Failed to find video asset by ${field}:`, error)
      return null
    }
  }
}

// Export the class directly instead of a singleton instance
// This allows us to create a new instance with the request context when needed
export default VideoAssetRepository
