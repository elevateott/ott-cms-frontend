import { NextResponse } from 'next/server'
import payload from 'payload'
import { logError } from '@/utils/errorHandler'

export async function GET() {
  try {
    const collections = await payload.collections
    return NextResponse.json({
      collections: Object.keys(collections),
      success: true
    })
  } catch (error: unknown) {
    // Use our error handling utility to properly handle the error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    logError(error, 'PayloadAPI.GET')

    return NextResponse.json({
      error: errorMessage,
      success: false
    }, { status: 500 })
  }
}
