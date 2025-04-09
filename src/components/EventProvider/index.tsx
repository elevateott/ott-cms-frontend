'use client';

/**
 * Event Provider Component
 * 
 * Sets up the event system for the application
 */

import { ReactNode, createContext, useContext, useState, useEffect } from 'react';
import { EventBridge } from '@/components/EventBridge';
import { eventBus } from '@/utilities/eventBus';

// Context for the event system
interface EventContextType {
  connected: boolean;
  lastEvent: { type: string; data: any } | null;
}

const EventContext = createContext<EventContextType>({
  connected: false,
  lastEvent: null,
});

// Hook for using the event context
export function useEventContext(): EventContextType {
  return useContext(EventContext);
}

interface EventProviderProps {
  children: ReactNode;
}

/**
 * Provider component that sets up the event system
 */
export function EventProvider({ children }: EventProviderProps): JSX.Element {
  const [connected, setConnected] = useState<boolean>(false);
  const [lastEvent, setLastEvent] = useState<{ type: string; data: any } | null>(null);
  
  // Listen for connection events
  useEffect(() => {
    const unsubscribe = eventBus.on('server_connected', () => {
      setConnected(true);
    });
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  // Listen for all events to update the last event
  useEffect(() => {
    const handleEvent = (type: string) => (data: any) => {
      setLastEvent({ type, data });
    };
    
    // Subscribe to all events
    const unsubscribes = Object.keys(eventBus).map(event => {
      return eventBus.on(event, handleEvent(event));
    });
    
    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, []);
  
  // Clean up the event bus when the component unmounts
  useEffect(() => {
    return () => {
      // Only clear events related to server communication
      eventBus.off('server_connected');
      eventBus.off('server_error');
    };
  }, []);
  
  return (
    <EventContext.Provider value={{ connected, lastEvent }}>
      <EventBridge />
      {children}
    </EventContext.Provider>
  );
}
