/**
 * Event Emitter Service
 * 
 * Provides a centralized way to emit and listen to events
 */

import { ReadableStreamController } from 'node:stream/web';
import { logError } from '@/utils/errorHandler';
import { EVENT_TYPES } from '@/constants';

// Store active connections with cleanup
class ConnectionManager {
  private clients: Map<string, ReadableStreamController<Uint8Array>> = new Map();
  private static instance: ConnectionManager;

  // Singleton pattern
  static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager();
    }
    return ConnectionManager.instance;
  }

  // Add a client
  addClient(id: string, controller: ReadableStreamController<Uint8Array>): void {
    this.clients.set(id, controller);
    console.log(`Client connected: ${id}, total clients: ${this.clients.size}`);
  }

  // Remove a client
  removeClient(id: string): void {
    this.clients.delete(id);
    console.log(`Client disconnected: ${id}, total clients: ${this.clients.size}`);
  }

  // Send event to all clients
  sendEventToClients(event: string, data: any): void {
    const eventData = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    const encoder = new TextEncoder();
    
    console.log(`Sending event to ${this.clients.size} clients:`, { event, data });
    
    this.clients.forEach((controller, id) => {
      try {
        controller.enqueue(encoder.encode(eventData));
      } catch (error) {
        logError(error, `EventEmitter.sendEventToClients(${id})`);
        this.removeClient(id);
      }
    });
  }

  // Get the number of connected clients
  getClientCount(): number {
    return this.clients.size;
  }
}

// Export the singleton instance
export const connectionManager = ConnectionManager.getInstance();

// Function to send events (used by other modules)
export function sendEventToClients(event: string, data: any): void {
  connectionManager.sendEventToClients(event, data);
}

// Helper functions for specific events
export function emitVideoCreated(id: string): void {
  sendEventToClients(EVENT_TYPES.VIDEO_CREATED, { id });
}

export function emitVideoUpdated(id: string): void {
  sendEventToClients(EVENT_TYPES.VIDEO_UPDATED, { id });
}
