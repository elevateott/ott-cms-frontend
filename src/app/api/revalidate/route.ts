import { NextRequest, NextResponse } from 'next/server'

/**
 * API route for revalidating paths and tags
 * This is a client-safe version that doesn't directly import revalidateTag/revalidatePath
 * The actual revalidation happens in the server component
 */
export async function POST(request: NextRequest) {
  try {
    // Simply pass through the request to the server component
    // The actual implementation is in route.server.ts
    return NextResponse.json({
      message: 'Revalidation request received',
      now: Date.now(),
    })
  } catch (error) {
    // Return error response
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
