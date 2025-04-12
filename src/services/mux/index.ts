import { MuxService } from './muxService';
import { MockMuxService } from './mockMuxService';
import { appConfig, muxConfig } from '@/config';

export const createMuxService = () => {
  // Check if we're in development and mock mode is enabled
  if (process.env.NODE_ENV === 'development' && process.env.USE_MOCK_MUX === 'true') {
    console.log('Using mock Mux service for development');
    return new MockMuxService();
  }

  // Validate environment variables
  const tokenId = process.env.MUX_TOKEN_ID || muxConfig.tokenId;
  const tokenSecret = process.env.MUX_TOKEN_SECRET || muxConfig.tokenSecret;

  if (!tokenId || !tokenSecret) {
    console.error('Missing Mux credentials');
    if (process.env.NODE_ENV === 'development') {
      console.log('Falling back to mock service due to missing credentials');
      return new MockMuxService();
    }
    throw new Error('MUX_TOKEN_ID and MUX_TOKEN_SECRET environment variables are required');
  }

  try {
    console.log('Initializing Mux service with token ID:', tokenId.substring(0, 8) + '...');
    return new MuxService({
      tokenId,
      tokenSecret
    });
  } catch (error) {
    console.error('Failed to initialize Mux service:', error);
    if (process.env.NODE_ENV === 'development') {
      console.log('Falling back to mock service due to initialization error');
      return new MockMuxService();
    }
    throw error;
  }
};

