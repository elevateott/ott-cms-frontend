# OTT Platform Event System Documentation

This document provides a detailed explanation of the event system in the OTT Platform, including how server-side and client-side events work together.

## Overview

The OTT Platform uses an event-driven architecture to communicate between different parts of the application. This architecture consists of two main components:

1. **Server-Side Events (SSE)**: Events that originate from the server and are sent to the client using the Server-Sent Events (SSE) protocol.
2. **Client-Side Events**: Events that are emitted and handled entirely within the client-side application using an event bus.

These two systems work together to create a cohesive event-driven application that can respond to changes in real-time.

## Server-Side Events (SSE)

### How Server-Side Events Work

1. **Event Source**: The server exposes an endpoint (`/api/events`) that clients can connect to using the `EventSource` API.
2. **Connection Management**: The server maintains a list of connected clients in the `ConnectionManager` class.
3. **Event Emission**: When something happens on the server (e.g., a Mux webhook is received), the server emits an event to all connected clients.
4. **Event Format**: Events are sent in the SSE format: `event: EVENT_NAME\ndata: JSON_DATA\n\n`.

### Key Components

#### 1. WebhookHandlerService

The `WebhookHandlerService` is responsible for processing webhook events from Mux and emitting corresponding events to clients:

- It receives webhook events from Mux (e.g., `video.asset.created`, `video.asset.ready`).
- It processes these events and updates the database accordingly.
- It emits events to clients using the `eventEmitter` function passed to its constructor.

Key methods:
- `handleEvent`: Processes webhook events based on their type.
- `emitVideoCreated`: Emits a `video_created` event when a new video is created.
- `emitVideoUpdated`: Emits a `video_updated` event when a video is updated.

#### 2. EventEmitter Service

The `EventEmitter` service is responsible for sending events to connected clients:

- It maintains a list of connected clients in the `ConnectionManager`.
- It provides methods to send events to all connected clients.
- It handles special cases like status changes and page reloads.

Key functions:
- `sendEventToClients`: Sends an event to all connected clients.
- `emitVideoCreated`: Helper function to emit a video created event.
- `emitVideoUpdated`: Helper function to emit a video updated event.

#### 3. API Route for Events

The server exposes an API route (`/api/events`) that clients can connect to using the `EventSource` API. This route:

- Creates a new connection for each client.
- Adds the client to the `ConnectionManager`.
- Sends events to the client when they occur.
- Removes the client from the `ConnectionManager` when the connection is closed.

## Client-Side Events

### How Client-Side Events Work

1. **Event Bus**: The client-side application uses an event bus (`eventBus`) to communicate between components.
2. **Event Subscription**: Components can subscribe to events using the `useEventBusOn` hook.
3. **Event Emission**: Components can emit events using the `useEventBusEmit` hook or directly using `eventBus.emit`.
4. **Event Bridge**: The `EventBridge` component bridges server-sent events to the client-side event bus.

### Key Components

#### 1. EventBus

The `EventBus` class is a simple implementation of the publish-subscribe pattern:

- It maintains a list of subscribers for each event.
- It provides methods to subscribe to events (`on`, `once`).
- It provides a method to emit events (`emit`).
- It provides methods to unsubscribe from events (`off`).

#### 2. useEventBus Hooks

The `useEventBus` hooks provide React-friendly wrappers around the event bus:

- `useEventBusOn`: Hook to subscribe to events.
- `useEventBusOnce`: Hook to subscribe to events once.
- `useEventBusEmit`: Hook to emit events.
- `useEventBusMulti`: Hook to subscribe to multiple events.

#### 3. EventBridge

The `EventBridge` component bridges server-sent events to the client-side event bus:

- It connects to the server's event source endpoint.
- It listens for server-sent events.
- It emits corresponding events on the client-side event bus.

#### 4. useEventSource Hook

The `useEventSource` hook provides a React-friendly wrapper around the `EventSource` API:

- It connects to the server's event source endpoint.
- It handles reconnection logic.
- It provides callbacks for events.

## Event Flow

### Mux Webhook to UI Update

Here's the flow of events from a Mux webhook to a UI update:

1. **Webhook Received**: Mux sends a webhook to the server (e.g., `video.asset.ready`).
2. **Webhook Processing**: The `WebhookHandlerService` processes the webhook and updates the database.
3. **Server Event Emission**: The `WebhookHandlerService` emits a server event (e.g., `video_updated`).
4. **Event Distribution**: The `EventEmitter` service sends the event to all connected clients.
5. **Client Event Reception**: The client receives the event through the `EventSource` connection.
6. **Event Bridging**: The `EventBridge` component emits a corresponding event on the client-side event bus.
7. **Component Notification**: Components that have subscribed to the event (e.g., `ListViewRefresher`) receive the event and update accordingly.
8. **UI Update**: The UI is updated to reflect the new state (e.g., the list view is refreshed).

### Client-Side Event Flow

Here's the flow of events for client-side events:

1. **Event Emission**: A component emits an event using `useEventBusEmit` or `eventBus.emit`.
2. **Event Distribution**: The event bus distributes the event to all subscribers.
3. **Component Notification**: Components that have subscribed to the event receive the event and update accordingly.
4. **UI Update**: The UI is updated to reflect the new state.

## Event Types

The application uses several types of events:

### Server-Side Events

- `video:created`: Emitted when a new video is created.
- `video:updated`: Emitted when a video is updated.
- `video:status:ready`: Emitted when a video's status changes to ready.
- `video:status:updated`: Emitted when a video's status is updated.
- `reload:page`: Emitted when the page should be reloaded.
- `video:upload:started`: Emitted when a video upload starts. This server-side event is triggered when the upload process begins and is used to notify all connected clients about a new upload.
- `video:upload:progress`: Emitted periodically during video upload. Contains progress information as a percentage in the metadata. Used to update upload progress indicators across all connected clients.
- `video:upload:completed`: Emitted when a video upload successfully completes. This triggers the start of the video processing pipeline through Mux.

### Client-Side Events

- `video_created`: Emitted when a new video is created.
- `video_updated`: Emitted when a video is updated.
- `video_upload_error`: Emitted when a video upload errors.
- `refresh:list:view`: Emitted when the list view should be refreshed.

## Differences Between Server-Side and Client-Side Events

### Server-Side Events

- **Origin**: Originate from the server.
- **Transport**: Use the Server-Sent Events (SSE) protocol.
- **Scope**: Global to all connected clients.
- **Persistence**: Not persisted; if a client is not connected, it will miss the event.
- **Use Cases**: Used for server-initiated updates like webhook processing.

### Client-Side Events

- **Origin**: Originate from the client.
- **Transport**: Use the client-side event bus.
- **Scope**: Local to the current browser tab.
- **Persistence**: Not persisted; events are only delivered to currently subscribed components.
- **Use Cases**: Used for client-initiated updates like UI interactions.

## How They Work Together

The server-side and client-side event systems work together through the `EventBridge` component:

1. The `EventBridge` component connects to the server's event source endpoint.
2. It listens for server-sent events.
3. When it receives a server-sent event, it emits a corresponding event on the client-side event bus.
4. Components that have subscribed to the event receive it and update accordingly.

This bridging allows server-initiated updates to propagate to the client-side application in a way that's consistent with the client-side event system.

## Best Practices

### When to Use Server-Side Events

- When the event originates from the server (e.g., webhook processing).
- When the event needs to be broadcast to all connected clients.
- When the event is related to data changes that affect multiple users.

### When to Use Client-Side Events

- When the event originates from the client (e.g., UI interactions).
- When the event is only relevant to the current user session.
- When the event is related to UI state that doesn't affect the server.

### Event Naming Conventions

- Server-side events use colons as separators (e.g., `video:created`).
- Client-side events use underscores as separators (e.g., `video_created`).
- Both systems use the same event names for corresponding events to make bridging easier.

## Conclusion

The OTT Platform's event system provides a powerful way to communicate between different parts of the application. By combining server-side and client-side events, it creates a cohesive event-driven architecture that can respond to changes in real-time.

Understanding how these systems work together is essential for developing new features and debugging issues in the application.

