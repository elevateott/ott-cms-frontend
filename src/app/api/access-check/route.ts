/**
 * API endpoint to check if a user has access to content or an event
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/getSessionUser';
import { checkAccessForEvent } from '@/lib/access/checkAccessForEvent';
import { checkAccessForContent } from '@/lib/access/checkAccessForContent';
import { logger } from '@/utils/logger';

export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');
    const contentId = searchParams.get('contentId');
    
    // Get the current user
    const user = await getSessionUser();
    
    // If no user or no email, deny access
    if (!user?.email) {
      return NextResponse.json({ hasAccess: false, reason: 'not_authenticated' });
    }
    
    // If no event or content ID, return error
    if (!eventId && !contentId) {
      return NextResponse.json(
        { error: 'Missing eventId or contentId parameter' },
        { status: 400 }
      );
    }
    
    // Check access based on the provided ID
    let hasAccess = false;
    
    if (eventId) {
      hasAccess = await checkAccessForEvent({
        userEmail: user.email,
        eventId,
      });
    } else if (contentId) {
      hasAccess = await checkAccessForContent({
        userEmail: user.email,
        contentId,
      });
    }
    
    // Return the result
    return NextResponse.json({ hasAccess });
  } catch (error) {
    logger.error(
      { error, context: 'access-check' },
      'Error checking access'
    );
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
