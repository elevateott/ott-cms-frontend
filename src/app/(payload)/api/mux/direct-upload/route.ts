// src/app/api/mux/direct-upload/route.ts
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
// No need for the utility function anymore

// Use the createMuxUpload utility function
import { createMuxUpload } from '@/utilities/mux'

export async function POST(req: NextRequest) {
  try {
    // Authenticate the request
    const payload = await getPayload({ config: configPromise })

    // Check if the user is authenticated
    const { user } = await payload.auth({ headers: req.headers })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create a direct upload URL with Mux
    const upload = await createMuxUpload()

    // Return the upload URL and ID to the client
    return NextResponse.json(upload)
  } catch (error: unknown) {
    console.error('Error creating Mux upload:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: `Failed to create upload: ${errorMessage}` }, { status: 500 })
  }
}
