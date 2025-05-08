import { revalidatePath, revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/utils/logger'

export async function POST(request: NextRequest) {
  try {
    // Get the revalidation secret from the request
    const body = await request.json()
    const { revalidateSecret } = body

    // Check if the secret is valid
    if (revalidateSecret !== process.env.REVALIDATION_SECRET) {
      logger.warn({ context: 'revalidate' }, 'Invalid revalidation secret')
      return NextResponse.json({ error: 'Invalid revalidation secret' }, { status: 401 })
    }

    // Get the path or tag from the query parameters
    const path = request.nextUrl.searchParams.get('path')
    const tag = request.nextUrl.searchParams.get('tag')

    if (!path && !tag) {
      logger.warn({ context: 'revalidate' }, 'No path or tag provided')
      return NextResponse.json({ error: 'No path or tag provided' }, { status: 400 })
    }

    // Revalidate the path or tag
    if (path) {
      logger.info({ context: 'revalidate' }, `Revalidating path: ${path}`)
      revalidatePath(path)
    }

    if (tag) {
      logger.info({ context: 'revalidate' }, `Revalidating tag: ${tag}`)
      revalidateTag(tag)
    }

    return NextResponse.json({ 
      success: true, 
      revalidated: true, 
      path, 
      tag 
    })
  } catch (error) {
    logger.error({ context: 'revalidate' }, 'Error revalidating:', error)
    return NextResponse.json({ error: 'Error revalidating' }, { status: 500 })
  }
}
