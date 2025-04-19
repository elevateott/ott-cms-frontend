'use client';

import { useEffect, useState } from 'react';
import { EventBridge } from '../EventBridge';
import { eventBus, EVENTS } from '@/utilities/eventBus';
import { EventContext } from './EventContext';

export function EventProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState<boolean>(false);
  const [lastEvent, setLastEvent] = useState<{ type: string; data: any } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    const unsubscribe = eventBus.on('server_connected', () => {
      console.log('Server connected event received');
      setConnected(true);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleEvent = (type: string) => (data: any) => {
      console.log(`Event received: ${type}`, data);
      setLastEvent({ type, data });
    };

    const unsubscribes = Object.values(EVENTS).map((event) => {
      return eventBus.on(event, handleEvent(event));
    });

    unsubscribes.push(
      eventBus.on('server_connected', handleEvent('server_connected')),
      eventBus.on('server_error', handleEvent('server_error')),
    );

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  return (
    <EventContext.Provider value={{ connected, lastEvent }}>
      {mounted && <EventBridge />}
      {children}
    </EventContext.Provider>
  );
}



