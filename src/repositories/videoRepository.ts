/**
 * Video Repository
 *
 * Handles all database operations related to videos
 */

import { Payload } from 'payload'
import { VideoDocument } from '@/types/mux'
import { PayloadFindOptions, PayloadPaginatedDocs, PayloadWhereClause } from '@/types/payload'
import { logError } from '@/utils/errorHandler'

export class VideoRepository {
  private payload: Payload

  constructor(payload: Payload) {
    this.payload = payload
  }

  /**
   * Find a video by ID
   */
  async findById(id: string): Promise<VideoDocument | null> {
    try {
      const video = await this.payload.findByID({
        collection: 'videos',
        id,
      })
      return video as VideoDocument
    } catch (error) {
      logError(error, 'VideoRepository.findById')
      return null
    }
  }

  /**
   * Find videos by a specific field value
   */
  async findByField(
    field: string,
    value: any,
    options: Partial<PayloadFindOptions> = {},
  ): Promise<VideoDocument[]> {
    try {
      const whereClause: PayloadWhereClause = {
        [field]: {
          equals: value,
        },
      }

      const result = await this.payload.find({
        collection: 'videos',
        where: whereClause,
        ...options,
      })

      return result.docs as VideoDocument[]
    } catch (error) {
      logError(error, `VideoRepository.findByField(${field})`)
      return []
    }
  }

  /**
   * Find a video by Mux asset ID
   */
  async findByMuxAssetId(assetId: string): Promise<VideoDocument | null> {
    const videos = await this.findByField('muxData.assetId', assetId)
    return videos.length > 0 ? videos[0] : null
  }

  /**
   * Find a video by Mux upload ID
   */
  async findByMuxUploadId(uploadId: string): Promise<VideoDocument | null> {
    const videos = await this.findByField('muxData.uploadId', uploadId)
    return videos.length > 0 ? videos[0] : null
  }

  /**
   * Create a new video
   */
  async create(data: Partial<VideoDocument>): Promise<VideoDocument | null> {
    try {
      const video = await this.payload.create({
        collection: 'videos',
        data,
      })
      return video as VideoDocument
    } catch (error) {
      logError(error, 'VideoRepository.create')
      return null
    }
  }

  /**
   * Update a video
   */
  async update(id: string, data: Partial<VideoDocument>): Promise<VideoDocument | null> {
    try {
      const video = await this.payload.update({
        collection: 'videos',
        id,
        data,
      })
      return video as VideoDocument
    } catch (error) {
      logError(error, 'VideoRepository.update')
      return null
    }
  }

  /**
   * Delete a video
   */
  async delete(id: string): Promise<boolean> {
    try {
      await this.payload.delete({
        collection: 'videos',
        id,
      })
      return true
    } catch (error) {
      logError(error, 'VideoRepository.delete')
      return false
    }
  }

  /**
   * Find recent videos
   */
  async findRecent(limit: number = 10): Promise<VideoDocument[]> {
    try {
      const result = await this.payload.find({
        collection: 'videos',
        sort: '-createdAt',
        limit,
      })
      return result.docs as VideoDocument[]
    } catch (error) {
      logError(error, 'VideoRepository.findRecent')
      return []
    }
  }

  /**
   * Find videos with pagination
   */
  async find(
    options: Partial<PayloadFindOptions> = {},
  ): Promise<PayloadPaginatedDocs<VideoDocument>> {
    try {
      const result = await this.payload.find({
        collection: 'videos',
        ...options,
      })

      return result as PayloadPaginatedDocs<VideoDocument>
    } catch (error) {
      logError(error, 'VideoRepository.find')
      return {
        docs: [],
        totalDocs: 0,
        limit: options.limit || 10,
        totalPages: 0,
        page: options.page || 1,
        hasPrevPage: false,
        hasNextPage: false,
        prevPage: null,
        nextPage: null,
      }
    }
  }

  /**
   * Find featured videos
   */
  async findFeatured(limit: number = 10): Promise<VideoDocument[]> {
    try {
      const result = await this.payload.find({
        collection: 'videos',
        where: {
          featured: {
            equals: true,
          },
        },
        sort: '-createdAt',
        limit,
      })

      return result.docs as VideoDocument[]
    } catch (error) {
      logError(error, 'VideoRepository.findFeatured')
      return []
    }
  }

  /**
   * Find videos by category
   */
  async findByCategory(categoryId: string, limit: number = 10): Promise<VideoDocument[]> {
    try {
      const result = await this.payload.find({
        collection: 'videos',
        where: {
          category: {
            equals: categoryId,
          },
        },
        sort: '-createdAt',
        limit,
      })

      return result.docs as VideoDocument[]
    } catch (error) {
      logError(error, 'VideoRepository.findByCategory')
      return []
    }
  }
}
