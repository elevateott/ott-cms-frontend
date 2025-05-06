import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  return new Response(JSON.stringify({ message: 'CSV Export API is available. Use /api/export/content or /api/export/videoassets endpoints.' }), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
