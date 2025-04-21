import payload from 'payload'

export class VideoRepository {
  private readonly collectionSlug: string = 'video-assets'

  constructor() {
    // No initialization needed
  }

  /**
   * Find a document by Mux upload ID
   */
  public async findByMuxUploadId(uploadId: string): Promise<any> {
    try {
      return await this.findByField('muxData.uploadId', uploadId)
    } catch (error) {
      console.error('❌ Error in findByMuxUploadId:', error)
      throw error
    }
  }

  /**
   * Find a document by Mux asset ID
   */
  public async findByMuxAssetId(assetId: string): Promise<any> {
    try {
      return await this.findByField('muxData.assetId', assetId)
    } catch (error) {
      console.error(`Failed to find video by asset ID ${assetId}:`, error)
      throw error
    }
  }

  /**
   * Update a document
   */
  public async update(id: string, data: any): Promise<any> {
    try {
      return await payload.update({
        collection: this.collectionSlug,
        id,
        data,
      })
    } catch (error) {
      console.error(`Failed to update video ${id}:`, error)
      throw error
    }
  }

  /**
   * Create a new document
   */
  public async create(data: any): Promise<any> {
    try {
      return await payload.create({
        collection: this.collectionSlug,
        data,
      })
    } catch (error) {
      console.error('Failed to create video:', error)
      throw error
    }
  }

  /**
   * Delete a document
   */
  public async delete(id: string): Promise<boolean> {
    try {
      await payload.delete({
        collection: this.collectionSlug,
        id,
      })
      return true
    } catch (error) {
      console.error(`Failed to delete video ${id}:`, error)
      return false
    }
  }

  /**
   * Find a document by a specific field value
   */
  private async findByField(field: string, value: any): Promise<any> {
    try {
      const result = await payload.find({
        collection: this.collectionSlug,
        where: {
          [field]: {
            equals: value,
          },
        },
      })

      return result.docs[0] || null
    } catch (error) {
      console.error(`Failed to find video by ${field}:`, error)
      return null
    }
  }
}

// Create a singleton instance
export const videoRepository = new VideoRepository()
