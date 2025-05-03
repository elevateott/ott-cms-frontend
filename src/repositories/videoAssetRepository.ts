import { logger } from '@/utils/logger'
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
      logger.error(
        { context: 'repositories/videoAssetRepository' },
        '❌ Error in findByMuxUploadId:',
        error,
      )
      throw error
    }
  }

  public async findByMuxAssetId(assetId: string): Promise<any> {
    try {
      return await this.findByField('muxData.assetId', assetId)
    } catch (error) {
      logger.error(
        { context: 'repositories/videoAssetRepository' },
        '❌ Error in findByMuxAssetId:',
        error,
      )
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
      logger.error(
        { context: 'repositories/videoAssetRepository' },
        `Failed to update video asset ${id}:`,
        error,
      )
      throw error
    }
  }

  /**
   * Create a new video asset
   */
  async create(data: any): Promise<any> {
    try {
      logger.info(
        { context: 'repositories/videoAssetRepository' },
        '🔄 Creating video asset with data:',
        JSON.stringify(data, null, 2),
      )

      if (!this.payload) {
        logger.error(
          { context: 'repositories/videoAssetRepository' },
          '❌ Payload instance is not available',
        )
        throw new Error('Payload instance is not available')
      }

      const result = await this.payload.create({
        collection: this.collectionSlug,
        data,
      })

      logger.info(
        { context: 'repositories/videoAssetRepository' },
        '✅ Successfully created video asset:',
        result?.id || 'unknown id',
      )

      return result
    } catch (error) {
      logger.error(
        { context: 'repositories/videoAssetRepository' },
        '❌ Failed to create video asset:',
        error,
      )

      // Log more details about the error
      if (error instanceof Error) {
        logger.error({ context: 'repositories/videoAssetRepository' }, '🔍 Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
        })
      }

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
      logger.error(
        { context: 'repositories/videoAssetRepository' },
        `Failed to delete video asset ${id}:`,
        error,
      )
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
      logger.error(
        { context: 'repositories/videoAssetRepository' },
        `Failed to find video asset by ${field}:`,
        error,
      )
      return null
    }
  }
}

// Export the class directly instead of a singleton instance
// This allows us to create a new instance with the request context when needed
export default VideoAssetRepository
