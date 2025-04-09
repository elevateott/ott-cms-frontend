/**
 * useEventBus Hook
 * 
 * A custom hook for using the event bus with React
 */

import { useEffect, useCallback } from 'react';
import { eventBus } from '@/utilities/eventBus';

/**
 * Hook for subscribing to events on the event bus
 * 
 * @param event The event name to subscribe to
 * @param callback The callback function to call when the event is emitted
 * @param deps The dependencies array for the callback
 */
export function useEventBusOn<T = any>(
  event: string,
  callback: (data?: T) => void,
  deps: any[] = []
): void {
  // Memoize the callback to avoid unnecessary re-subscriptions
  const memoizedCallback = useCallback(callback, deps);
  
  useEffect(() => {
    // Subscribe to the event
    const unsubscribe = eventBus.on<T>(event, memoizedCallback);
    
    // Unsubscribe when the component unmounts or the dependencies change
    return () => {
      unsubscribe();
    };
  }, [event, memoizedCallback]);
}

/**
 * Hook for subscribing to events on the event bus once
 * 
 * @param event The event name to subscribe to
 * @param callback The callback function to call when the event is emitted
 * @param deps The dependencies array for the callback
 */
export function useEventBusOnce<T = any>(
  event: string,
  callback: (data?: T) => void,
  deps: any[] = []
): void {
  // Memoize the callback to avoid unnecessary re-subscriptions
  const memoizedCallback = useCallback(callback, deps);
  
  useEffect(() => {
    // Subscribe to the event once
    const unsubscribe = eventBus.once<T>(event, memoizedCallback);
    
    // Unsubscribe when the component unmounts or the dependencies change
    return () => {
      unsubscribe();
    };
  }, [event, memoizedCallback]);
}

/**
 * Hook for emitting events on the event bus
 * 
 * @returns A function to emit events
 */
export function useEventBusEmit(): <T = any>(event: string, data?: T) => void {
  return useCallback(<T = any>(event: string, data?: T) => {
    eventBus.emit<T>(event, data);
  }, []);
}

/**
 * Hook for subscribing to multiple events on the event bus
 * 
 * @param events An object mapping event names to callback functions
 * @param deps The dependencies array for the callbacks
 */
export function useEventBusMulti(
  events: Record<string, (data?: any) => void>,
  deps: any[] = []
): void {
  useEffect(() => {
    // Subscribe to all events
    const unsubscribes = Object.entries(events).map(([event, callback]) => {
      return eventBus.on(event, callback);
    });
    
    // Unsubscribe from all events when the component unmounts or the dependencies change
    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [events, ...deps]);
}
