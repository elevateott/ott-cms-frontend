# Event System Testing Guide

This guide explains how to test the event system in the OTT CMS Frontend application.

## Overview

The application uses an event-driven architecture with:

1. Server-side events emitted from webhooks and other server processes
2. Server-Sent Events (SSE) to stream events to connected clients
3. Client-side event bus for component communication

## Testing the Event System

### 1. Using the Debug Endpoint

The application includes a debug endpoint for testing the event system:

```
GET /api/debug/event - Lists all available events
POST /api/debug/event - Emits a test event
```

#### Example: Emitting a test event

```bash
# Using curl
curl -X POST http://localhost:3000/api/debug/event \
  -H "Content-Type: application/json" \
  -d '{"event":"video:created","data":{"id":"test-123","title":"Test Video"}}'
```

```javascript
// Using fetch in browser console
fetch('/api/debug/event', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    event: 'video:created',
    data: { id: 'test-123', title: 'Test Video' }
  })
}).then(res => res.json()).then(console.log)
```

### 2. Monitoring the SSE Stream

You can directly monitor the SSE stream using curl:

```bash
curl -N http://localhost:3000/api/events/stream -H "Accept: text/event-stream"
```

This will show all events being emitted from the server, including:
- `connected` - Initial connection event
- `ping` - Keep-alive events (every 30 seconds)
- Any application events (e.g., `video:created`, `video:updated`)

### 3. Using the EventMonitor Component

The application includes an EventMonitor component that displays all events in real-time. This component is visible in the bottom-left corner of the application and can be expanded to show event details.

### 4. Testing with Mux Webhooks

For testing with actual Mux webhooks:

1. Use a service like [Smee.io](https://smee.io/) to forward webhooks to your local environment
2. Run the webhook forwarding script: `pnpm run webhooks`
3. Configure your Mux webhook settings to point to your Smee.io URL
4. Upload a video through the application UI to trigger the webhook flow

## Troubleshooting

If events are not being received by client components:

1. Check the browser console for any connection errors
2. Verify the SSE connection is established (you should see a "connected" event)
3. Check server logs for any errors in the event emission process
4. Verify that event names match exactly between server and client
5. Ensure the EventBridge component is mounted and active

## Event Flow

```
Server Action/Webhook → eventService.emit() → sendEventToClients() → SSE Stream → EventBridge → client eventBus → Components
```

## Available Events

The application defines the following events in `src/constants/events.ts`:

- `video:created` - Emitted when a new video is created
- `video:updated` - Emitted when a video is updated
- `video:deleted` - Emitted when a video is deleted
- `video:upload:started` - Emitted when a video upload begins
- `video:upload:progress` - Emitted during upload progress
- `video:upload:completed` - Emitted when upload completes
- `video:upload:error` - Emitted on upload error
- `video:status:ready` - Emitted when video processing is complete
- `video:status:updated` - Emitted when video status changes
- `video:list:refresh` - Emitted to trigger list view refresh
