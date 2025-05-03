import { Endpoint } from 'payload/config'
import { Parser } from 'json2csv'
import { logger } from '@/utils/logger'
import { PayloadRequest } from 'payload/types'
import { authenticated } from '@/access/authenticated'

/**
 * Format a date for CSV export
 */
const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return ''
  try {
    return new Date(date).toISOString().split('T')[0]
  } catch (error) {
    return ''
  }
}

/**
 * Format duration in seconds to HH:MM:SS
 */
const formatDuration = (seconds: number | null | undefined): string => {
  if (!seconds) return ''
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  
  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    remainingSeconds.toString().padStart(2, '0')
  ].join(':')
}

/**
 * Extract names from relationship fields
 */
const extractNames = (items: any[] | null | undefined): string => {
  if (!items || !Array.isArray(items)) return ''
  return items.map(item => item?.name || item?.title || '').filter(Boolean).join(', ')
}

/**
 * Extract tags from array fields
 */
const extractTags = (tags: any[] | null | undefined): string => {
  if (!tags || !Array.isArray(tags)) return ''
  return tags.map(tag => tag?.value || '').filter(Boolean).join(', ')
}

/**
 * Create CSV export endpoint for Content collection
 */
export const contentExportEndpoint: Endpoint = {
  path: '/export/content',
  method: 'get',
  handler: async (req: PayloadRequest, res) => {
    try {
      // Check authentication
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      // Get query parameters
      const { limit = '1000', page = '1', sort = '-createdAt' } = req.query

      // Fetch content items
      const result = await req.payload.find({
        collection: 'content',
        limit: parseInt(limit as string, 10),
        page: parseInt(page as string, 10),
        sort: sort as string,
        depth: 2, // Populate relationships
      })

      // Transform data for CSV export
      const rows = result.docs.map(doc => ({
        'ID': doc.id,
        'Title': doc.title,
        'Slug': doc.slug,
        'Description': doc.description,
        'Status': doc.status,
        'Published': doc.isPublished ? 'Yes' : 'No',
        'Release Date': formatDate(doc.releaseDate),
        'Publish At': formatDate(doc.publishAt),
        'Unpublish At': formatDate(doc.unpublishAt),
        'Categories': extractNames(doc.categories),
        'Creators': extractNames(doc.creators),
        'Tags': extractTags(doc.tags),
        'Series': doc.series?.title || '',
        'Main Video': doc.mainVideo?.title || '',
        'Main Video ID': doc.mainVideo?.id || '',
        'Main Video Source': doc.mainVideo?.sourceType || '',
        'Main Video Duration': formatDuration(doc.mainVideo?.duration),
        'Trailer Video': doc.trailerVideo?.title || '',
        'Created At': formatDate(doc.createdAt),
        'Updated At': formatDate(doc.updatedAt),
      }))

      // Generate CSV
      const fields = Object.keys(rows[0] || {})
      const parser = new Parser({ fields })
      const csv = parser.parse(rows)

      // Set headers and send response
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename=content-export-${new Date().toISOString().split('T')[0]}.csv`)
      return res.send(csv)
    } catch (error) {
      logger.error({ context: 'contentExportEndpoint' }, 'Error exporting content to CSV:', error)
      return res.status(500).json({ error: 'Failed to export content to CSV' })
    }
  },
  access: authenticated,
}

/**
 * Create CSV export endpoint for VideoAssets collection
 */
export const videoAssetsExportEndpoint: Endpoint = {
  path: '/export/videoassets',
  method: 'get',
  handler: async (req: PayloadRequest, res) => {
    try {
      // Check authentication
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      // Get query parameters
      const { limit = '1000', page = '1', sort = '-createdAt' } = req.query

      // Fetch video assets
      const result = await req.payload.find({
        collection: 'videoassets',
        limit: parseInt(limit as string, 10),
        page: parseInt(page as string, 10),
        sort: sort as string,
      })

      // Transform data for CSV export
      const rows = result.docs.map(doc => ({
        'ID': doc.id,
        'Title': doc.title,
        'Slug': doc.slug,
        'Source Type': doc.sourceType,
        'Status': doc.muxData?.status || '',
        'Duration': formatDuration(doc.duration),
        'Aspect Ratio': doc.aspectRatio || '',
        'DRM Enabled': doc.useDRM ? 'Yes' : 'No',
        'Playback Policy': doc.muxAdvancedSettings?.playbackPolicy || '',
        'Video Quality': doc.muxAdvancedSettings?.videoQuality || '',
        'Max Resolution': doc.muxAdvancedSettings?.maxResolution || '',
        'Normalize Audio': doc.muxAdvancedSettings?.normalizeAudio ? 'Yes' : 'No',
        'Auto-generate Captions': doc.muxAdvancedSettings?.autoGenerateCaptions ? 'Yes' : 'No',
        'Mux Asset ID': doc.muxData?.assetId || '',
        'Mux Playback ID': doc.muxData?.playbackId || '',
        'Embedded URL': doc.embeddedUrl || '',
        'Subtitle Tracks': doc.subtitles?.tracks?.length || 0,
        'Created At': formatDate(doc.createdAt),
        'Updated At': formatDate(doc.updatedAt),
      }))

      // Generate CSV
      const fields = Object.keys(rows[0] || {})
      const parser = new Parser({ fields })
      const csv = parser.parse(rows)

      // Set headers and send response
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename=videoassets-export-${new Date().toISOString().split('T')[0]}.csv`)
      return res.send(csv)
    } catch (error) {
      logger.error({ context: 'videoAssetsExportEndpoint' }, 'Error exporting video assets to CSV:', error)
      return res.status(500).json({ error: 'Failed to export video assets to CSV' })
    }
  },
  access: authenticated,
}

export const csvExportEndpoints = [
  contentExportEndpoint,
  videoAssetsExportEndpoint,
]
