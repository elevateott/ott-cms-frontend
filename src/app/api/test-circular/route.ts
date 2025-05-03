/**
 * Test API route to check for circular dependencies
 */

import { NextResponse } from 'next/server'
import { logger } from '@/utils/logger'
import { config } from '@/config'

export async function GET() {
  return NextResponse.json({
    success: true,
    loggerInitialized: logger !== undefined,
    configInitialized: config !== undefined,
    message: 'Test completed successfully!'
  })
}
