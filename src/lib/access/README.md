# Access Control Utilities

This directory contains utilities for checking user access to content and events.

## Overview

The access control utilities provide a single source of truth for determining whether a user has access to content or events based on:

- Active subscription
- PPV purchase
- Valid (non-expired) rental

## Usage

### Server-Side Usage

```typescript
import { checkAccessForEvent } from '@/lib/access/checkAccessForEvent';
import { checkAccessForContent } from '@/lib/access/checkAccessForContent';

// Check access to an event
const hasEventAccess = await checkAccessForEvent({
  userEmail: 'user@example.com',
  eventId: 'event123',
});

// Check access to content
const hasContentAccess = await checkAccessForContent({
  userEmail: 'user@example.com',
  contentId: 'content123',
});
```

### API Route Usage

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/getSessionUser';
import { checkAccessForEvent } from '@/lib/access/checkAccessForEvent';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get('eventId');
  
  const user = await getSessionUser();
  
  if (!eventId || !user?.email) {
    return NextResponse.json({ hasAccess: false });
  }
  
  const hasAccess = await checkAccessForEvent({
    userEmail: user.email,
    eventId,
  });
  
  return NextResponse.json({ hasAccess });
}
```

### Client-Side Component Usage

```tsx
import { AccessCheck } from '@/components/access/AccessCheck';
import { PurchaseOptions } from '@/components/checkout/PurchaseOptions';

const EventPage = ({ eventId }) => {
  return (
    <AccessCheck 
      eventId={eventId}
      fallback={<PurchaseOptions eventId={eventId} />}
    >
      {/* Content only shown to users with access */}
      <VideoPlayer eventId={eventId} />
    </AccessCheck>
  );
};
```

## API Reference

### `checkAccessForEvent({ userEmail, eventId })`

Checks if a user has access to a live event.

- **Parameters**:
  - `userEmail`: The email of the user to check access for
  - `eventId`: The ID of the live event to check access for
- **Returns**: A boolean indicating whether the user has access to the event

### `checkAccessForContent({ userEmail, contentId })`

Checks if a user has access to content.

- **Parameters**:
  - `userEmail`: The email of the user to check access for
  - `contentId`: The ID of the content to check access for
- **Returns**: A boolean indicating whether the user has access to the content

### `getSessionUser()`

Gets the current user from session.

- **Returns**: The current user or null if not authenticated
