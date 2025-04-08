import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function GET(req: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })

    // Get query parameters
    const url = new URL(req.url)
    const sort = url.searchParams.get('sort') || '-createdAt'
    const limit = parseInt(url.searchParams.get('limit') || '10', 10)
    const page = parseInt(url.searchParams.get('page') || '1', 10)

    // Fetch videos with sorting and pagination
    const videos = await payload.find({
      collection: 'videos',
      sort,
      limit,
      page,
      depth: 1, // Include related data one level deep
    })

    return NextResponse.json(videos)
  } catch (error) {
    console.error('Error fetching videos:', error)
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 })
  }
}
