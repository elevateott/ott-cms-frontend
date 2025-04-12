import { createContext, useContext } from 'react';

export interface EventContextType {
  connected: boolean;
  lastEvent: { type: string; data: any } | null;
}

export const EventContext = createContext<EventContextType>({
  connected: false,
  lastEvent: null,
});

export const useEventContext = () => useContext(EventContext);