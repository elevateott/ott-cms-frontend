import { NextResponse } from 'next/server'
import { VideoRepository } from '@/repositories/videoRepository'

export async function POST(request: Request) {
  try {
    const { testUploadId, testAssetId } = await request.json()
    const repo = new VideoRepository()

    // Test both methods
    await repo.findByMuxUploadId(testUploadId)
    await repo.findByMuxAssetId(testAssetId)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}