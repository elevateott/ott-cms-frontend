'use client';

/**
 * Event Bridge Component
 *
 * Bridges server-sent events to the client-side event bus
 */

import { useEffect } from 'react';
import { useEventSource } from '@/hooks/useEventSource';
import { eventBus, EVENTS } from '@/utilities/eventBus';
import { EVENT_TYPES } from '@/constants';
import { API_ENDPOINTS } from '@/constants';

/**
 * Maps server event types to client event types
 */
const EVENT_MAP: Record<string, string> = {
  [EVENT_TYPES.VIDEO_CREATED]: EVENTS.VIDEO_CREATED,
  [EVENT_TYPES.VIDEO_UPDATED]: EVENTS.VIDEO_UPDATED,
  [EVENT_TYPES.CONNECTED]: 'server_connected',
};

/**
 * Component that listens for server-sent events and bridges them to the client-side event bus
 */
export function EventBridge(): null {
  // Set up the event source
  const { connected, error } = useEventSource({
    url: API_ENDPOINTS.EVENTS,
    events: {
      // Bridge video created events
      [EVENT_TYPES.VIDEO_CREATED]: (data) => {
        console.log('Received video_created event from server:', data);
        eventBus.emit(EVENTS.VIDEO_CREATED, data);
      },

      // Bridge video updated events
      [EVENT_TYPES.VIDEO_UPDATED]: (data) => {
        console.log('Received video_updated event from server:', data);
        eventBus.emit(EVENTS.VIDEO_UPDATED, data);
      },
    },
    onOpen: () => {
      console.log('EventSource connected');
      eventBus.emit('server_connected');
    },
    onError: (error) => {
      console.error('EventSource error:', error);
      eventBus.emit('server_error', error);
    },
  });

  // Log connection status changes
  useEffect(() => {
    console.log('EventBridge connection status:', connected ? 'connected' : 'disconnected');
  }, [connected]);

  // Log errors
  useEffect(() => {
    if (error) {
      console.error('EventBridge error:', error);
    }
  }, [error]);

  // This component doesn't render anything
  return null;
}

