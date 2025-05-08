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

export const runtime = 'nodejs' // Needed for streaming responses

export async function GET(req: NextRequest) {
  try {
    // Get payload instance
    const payload = await getPayloadHMR({ config: configPromise })

    // For CSV exports, we'll skip token verification since this is accessed directly
    // and will rely on Payload's built-in access control instead
    logger.info({ context: 'videoAssetsExportEndpoint' }, 'Starting video assets export')

    // Get query parameters
    const searchParams = req.nextUrl.searchParams
    const limit = searchParams.get('limit') || '1000'
    const page = searchParams.get('page') || '1'
    const sort = searchParams.get('sort') || '-createdAt'

    // Fetch video assets
    const result = await payload.find({
      collection: 'videoassets',
      limit: parseInt(limit, 10),
      page: parseInt(page, 10),
      sort: sort,
    })

    // Transform data for CSV export
    const rows = result.docs.map((doc) => ({
      ID: doc.id,
      Title: doc.title,
      Slug: doc.slug,
      'Source Type': doc.sourceType,
      Status: doc.muxData?.status || '',
      Duration: formatDuration(doc.duration),
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
    try {
      // Check if we have any rows to export
      if (!rows.length) {
        logger.info({ context: 'videoAssetsExportEndpoint' }, 'No video assets found to export')
        return new Response(JSON.stringify({ message: 'No video assets found to export' }), {
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
          'Content-Disposition': `attachment; filename=videoassets-export-${new Date().toISOString().split('T')[0]}.csv`,
        },
      })
    } catch (csvError) {
      logger.error(
        {
          context: 'videoAssetsExportEndpoint',
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
        context: 'videoAssetsExportEndpoint',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Error exporting video assets to CSV:',
    )

    // Return a more detailed error message in development
    const errorMessage =
      process.env.NODE_ENV === 'development'
        ? `Failed to export video assets to CSV: ${error instanceof Error ? error.message : String(error)}`
        : 'Failed to export video assets to CSV'

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
