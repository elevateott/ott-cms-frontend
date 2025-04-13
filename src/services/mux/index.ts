import { MuxService } from './muxService';
import { MockMuxService } from './mockMuxService';
import { IMuxService } from './IMuxService';
import { muxConfig } from '@/config';

let muxServiceInstance: IMuxService | null = null;

export const createMuxService = (): IMuxService => {
  // Return existing instance if already created
  if (muxServiceInstance) {
    return muxServiceInstance;
  }

  // Check if we're in development and mock mode is enabled
  if (process.env.NODE_ENV === 'development' && process.env.USE_MOCK_MUX === 'true') {
    console.log('Using mock Mux service for development');
    muxServiceInstance = new MockMuxService();
    return muxServiceInstance;
  }

  // Validate environment variables
  const tokenId = process.env.MUX_TOKEN_ID || muxConfig.tokenId;
  const tokenSecret = process.env.MUX_TOKEN_SECRET || muxConfig.tokenSecret;

  if (!tokenId || !tokenSecret) {
    console.error('Missing Mux credentials');
    if (process.env.NODE_ENV === 'development') {
      console.log('Falling back to mock service due to missing credentials');
      muxServiceInstance = new MockMuxService();
      return muxServiceInstance;
    }
    throw new Error('MUX_TOKEN_ID and MUX_TOKEN_SECRET environment variables are required');
  }

  try {
    console.log('Initializing Mux service with token ID:', tokenId.substring(0, 8) + '...');
    muxServiceInstance = new MuxService({
      tokenId,
      tokenSecret
    });
    return muxServiceInstance;
  } catch (error) {
    console.error('Failed to initialize Mux service:', error);
    if (process.env.NODE_ENV === 'development') {
      console.log('Falling back to mock service due to initialization error');
      muxServiceInstance = new MockMuxService();
      return muxServiceInstance;
    }
    throw error;
  }
};


