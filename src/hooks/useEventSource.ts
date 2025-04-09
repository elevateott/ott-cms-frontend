/**
 * useEventSource Hook
 * 
 * A custom hook for using Server-Sent Events (EventSource) with React
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { UseEventSourceOptions, UseEventSourceResult } from '@/types/hooks';
import { API_ENDPOINTS } from '@/constants';

/**
 * Hook for connecting to a server-sent events endpoint
 */
export function useEventSource(
  options: UseEventSourceOptions = {
    url: API_ENDPOINTS.EVENTS,
    events: {},
  }
): UseEventSourceResult {
  const { 
    url = API_ENDPOINTS.EVENTS, 
    events = {}, 
    onOpen, 
    onError 
  } = options;
  
  const [connected, setConnected] = useState<boolean>(false);
  const [error, setError] = useState<Event | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  
  // Create a function to connect to the event source
  const connect = useCallback(() => {
    try {
      // Close any existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      
      // Create a new EventSource
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;
      
      // Set up event listeners
      eventSource.onopen = () => {
        console.log('EventSource connected');
        setConnected(true);
        setError(null);
        if (onOpen) onOpen();
      };
      
      eventSource.onerror = (event) => {
        console.error('EventSource error:', event);
        setError(event);
        setConnected(false);
        if (onError) onError(event);
      };
      
      // Add event listeners for each event
      Object.entries(events).forEach(([eventName, handler]) => {
        eventSource.addEventListener(eventName, (event) => {
          try {
            // Parse the data if it's JSON
            const data = event.data ? JSON.parse(event.data) : {};
            handler(data);
          } catch (error) {
            console.error(`Error handling event ${eventName}:`, error);
            handler(event.data);
          }
        });
      });
      
      // Add a listener for the 'connected' event
      eventSource.addEventListener('connected', () => {
        console.log('Received connected event from server');
        setConnected(true);
      });
      
    } catch (error) {
      console.error('Error setting up EventSource:', error);
      setError(error as Event);
      setConnected(false);
    }
  }, [url, events, onOpen, onError]);
  
  // Connect to the event source when the component mounts
  useEffect(() => {
    connect();
    
    // Clean up the event source when the component unmounts
    return () => {
      if (eventSourceRef.current) {
        console.log('Closing EventSource connection');
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [connect]);
  
  // Function to manually reconnect
  const reconnect = useCallback(() => {
    console.log('Manually reconnecting to EventSource');
    connect();
  }, [connect]);
  
  // Function to manually close the connection
  const close = useCallback(() => {
    if (eventSourceRef.current) {
      console.log('Manually closing EventSource connection');
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setConnected(false);
    }
  }, []);
  
  return {
    connected,
    error,
    reconnect,
    close,
  };
}
