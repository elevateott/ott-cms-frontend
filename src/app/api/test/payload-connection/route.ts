import { NextResponse } from 'next/server'
import payload from 'payload'

export async function GET() {
  try {
    const collections = await payload.collections
    return NextResponse.json({
      success: true,
      collections: Object.keys(collections)
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}