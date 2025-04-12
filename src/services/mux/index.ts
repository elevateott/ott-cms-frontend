import { MuxService } from './muxService'

export const createMuxService = () => {
  const tokenId = process.env.MUX_TOKEN_ID
  const tokenSecret = process.env.MUX_TOKEN_SECRET

  // Temporary debug log (remove in production)
  console.log('MUX ENV Variables:', {
    tokenId: tokenId ? `${tokenId.substring(0, 8)}...` : 'missing',
    hasSecret: !!tokenSecret
  })

  if (!tokenId || !tokenSecret) {
    throw new Error('MUX_TOKEN_ID and MUX_TOKEN_SECRET environment variables are required')
  }

  try {
    // Log the token ID (but not the secret) for debugging
    console.log('Initializing Mux service with token ID:', tokenId.substring(0, 8) + '...')

    const service = new MuxService({
      tokenId,
      tokenSecret
    })

    console.log('Mux service initialized successfully')
    return service
  } catch (error) {
    console.error('Failed to initialize Mux service:', error)
    throw error
  }
}




