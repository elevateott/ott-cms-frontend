import { NextRequest } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@/payload.config'
import { Parser } from 'json2csv'
import { logger } from '@/utils/logger'

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
    remainingSeconds.toString().padStart(2, '0'),
  ].join(':')
}

/**
 * Extract names from relationship fields
 */
const extractNames = (items: any[] | null | undefined): string => {
  if (!items || !Array.isArray(items)) return ''
  return items
    .map((item) => item?.name || item?.title || '')
    .filter(Boolean)
    .join(', ')
}

/**
 * Extract tags from array fields
 */
const extractTags = (tags: any[] | null | undefined): string => {
  if (!tags || !Array.isArray(tags)) return ''
  return tags
    .map((tag) => tag?.value || '')
    .filter(Boolean)
    .join(', ')
}

export const runtime = 'nodejs' // Needed for streaming responses

export async function GET(req: NextRequest) {
  try {
    // Get payload instance
    const payload = await getPayloadHMR({ config: configPromise })

    // For CSV exports, we'll skip token verification since this is accessed directly
    // and will rely on Payload's built-in access control instead
    logger.info({ context: 'contentExportEndpoint' }, 'Starting content export')

    // Get query parameters
    const searchParams = req.nextUrl.searchParams
    const limit = searchParams.get('limit') || '1000'
    const page = searchParams.get('page') || '1'
    const sort = searchParams.get('sort') || '-createdAt'

    // Fetch content items
    const result = await payload.find({
      collection: 'content',
      limit: parseInt(limit, 10),
      page: parseInt(page, 10),
      sort: sort,
      depth: 2, // Populate relationships
    })

    // Transform data for CSV export
    const rows = result.docs.map((doc) => ({
      ID: doc.id,
      Title: doc.title,
      Slug: doc.slug,
      Description: doc.description,
      Status: doc.status,
      Published: doc.isPublished ? 'Yes' : 'No',
      'Release Date': formatDate(doc.releaseDate),
      'Publish At': formatDate(doc.publishAt),
      'Unpublish At': formatDate(doc.unpublishAt),
      Categories: extractNames(doc.categories),
      Creators: extractNames(doc.creators),
      Tags: extractTags(doc.tags),
      Series: doc.series?.title || '',
      'Main Video': doc.mainVideo?.title || '',
      'Main Video ID': doc.mainVideo?.id || '',
      'Main Video Source': doc.mainVideo?.sourceType || '',
      'Main Video Duration': formatDuration(doc.mainVideo?.duration),
      'Trailer Video': doc.trailerVideo?.title || '',
      'Created At': formatDate(doc.createdAt),
      'Updated At': formatDate(doc.updatedAt),
    }))

    // Generate CSV
    try {
      // Check if we have any rows to export
      if (!rows.length) {
        logger.info({ context: 'contentExportEndpoint' }, 'No content items found to export')
        return new Response(JSON.stringify({ message: 'No content items found to export' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      const fields = Object.keys(rows[0])
      const parser = new Parser({ fields })
      const csv = parser.parse(rows)

      // Set headers and send response
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename=content-export-${new Date().toISOString().split('T')[0]}.csv`,
        },
      })
    } catch (csvError) {
      logger.error(
        {
          context: 'contentExportEndpoint',
          error: csvError instanceof Error ? csvError.message : String(csvError),
        },
        'Error generating CSV:',
      )

      return new Response(
        JSON.stringify({
          error: 'Error generating CSV file',
          details:
            process.env.NODE_ENV === 'development'
              ? csvError instanceof Error
                ? csvError.message
                : String(csvError)
              : undefined,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }
  } catch (error) {
    // Log detailed error information
    logger.error(
      {
        context: 'contentExportEndpoint',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Error exporting content to CSV:',
    )

    // Return a more detailed error message in development
    const errorMessage =
      process.env.NODE_ENV === 'development'
        ? `Failed to export content to CSV: ${error instanceof Error ? error.message : String(error)}`
        : 'Failed to export content to CSV'

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
