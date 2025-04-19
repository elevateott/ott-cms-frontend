/**
 * API Handler Utilities
 * 
 * Provides utility functions for creating API route handlers
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import configPromise from '@payload-config';
import { createApiResponse, createErrorResponse, createUnauthorizedResponse } from './apiResponse';
import { logError } from './errorHandler';
import { withAuth, withErrorHandling, withCors } from '@/middleware/apiMiddleware';

/**
 * Options for creating an API handler
 */
export interface ApiHandlerOptions {
  requireAuth?: boolean;
  cors?: {
    allowedOrigins?: string[];
    allowedMethods?: string[];
    allowedHeaders?: string[];
    allowCredentials?: boolean;
  };
  errorContext?: string;
}

/**
 * Create a GET API handler
 */
export function createGetHandler(
  handler: (req: NextRequest, context: { user?: any; payload?: any }) => Promise<NextResponse>,
  options: ApiHandlerOptions = {}
): (req: NextRequest) => Promise<NextResponse> {
  const { requireAuth = false, cors, errorContext = 'GET API' } = options;
  
  // Create the base handler
  const baseHandler = async (req: NextRequest): Promise<NextResponse> => {
    // Only allow GET requests
    if (req.method !== 'GET') {
      return createErrorResponse('Method not allowed', 405);
    }
    
    // If authentication is required, use the withAuth middleware
    if (requireAuth) {
      return withAuth(req, async (req, user, payload) => {
        return handler(req, { user, payload });
      });
    }
    
    // Otherwise, just call the handler
    try {
      const payload = await getPayload({ config: configPromise });
      const { user } = await payload.auth({ headers: req.headers });
      return handler(req, { user, payload });
    } catch (error) {
      logError(error, errorContext);
      return createErrorResponse('Internal server error', 500);
    }
  };
  
  // Apply middleware
  let finalHandler = baseHandler;
  
  // Apply error handling middleware
  finalHandler = (req: NextRequest) => withErrorHandling(req, baseHandler, errorContext);
  
  // Apply CORS middleware if needed
  if (cors) {
    finalHandler = (req: NextRequest) => withCors(req, finalHandler, cors);
  }
  
  return finalHandler;
}

/**
 * Create a POST API handler
 */
export function createPostHandler(
  handler: (req: NextRequest, body: any, context: { user?: any; payload?: any }) => Promise<NextResponse>,
  options: ApiHandlerOptions = {}
): (req: NextRequest) => Promise<NextResponse> {
  const { requireAuth = false, cors, errorContext = 'POST API' } = options;
  
  // Create the base handler
  const baseHandler = async (req: NextRequest): Promise<NextResponse> => {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return createErrorResponse('Method not allowed', 405);
    }
    
    // Parse the request body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      return createErrorResponse('Invalid JSON body', 400);
    }
    
    // If authentication is required, use the withAuth middleware
    if (requireAuth) {
      return withAuth(req, async (req, user, payload) => {
        return handler(req, body, { user, payload });
      });
    }
    
    // Otherwise, just call the handler
    try {
      const payload = await getPayload({ config: configPromise });
      const { user } = await payload.auth({ headers: req.headers });
      return handler(req, body, { user, payload });
    } catch (error) {
      logError(error, errorContext);
      return createErrorResponse('Internal server error', 500);
    }
  };
  
  // Apply middleware
  let finalHandler = baseHandler;
  
  // Apply error handling middleware
  finalHandler = (req: NextRequest) => withErrorHandling(req, baseHandler, errorContext);
  
  // Apply CORS middleware if needed
  if (cors) {
    finalHandler = (req: NextRequest) => withCors(req, finalHandler, cors);
  }
  
  return finalHandler;
}

/**
 * Create a PUT API handler
 */
export function createPutHandler(
  handler: (req: NextRequest, body: any, context: { user?: any; payload?: any }) => Promise<NextResponse>,
  options: ApiHandlerOptions = {}
): (req: NextRequest) => Promise<NextResponse> {
  const { requireAuth = true, cors, errorContext = 'PUT API' } = options;
  
  // Create the base handler
  const baseHandler = async (req: NextRequest): Promise<NextResponse> => {
    // Only allow PUT requests
    if (req.method !== 'PUT') {
      return createErrorResponse('Method not allowed', 405);
    }
    
    // Parse the request body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      return createErrorResponse('Invalid JSON body', 400);
    }
    
    // If authentication is required, use the withAuth middleware
    if (requireAuth) {
      return withAuth(req, async (req, user, payload) => {
        return handler(req, body, { user, payload });
      });
    }
    
    // Otherwise, just call the handler
    try {
      const payload = await getPayload({ config: configPromise });
      const { user } = await payload.auth({ headers: req.headers });
      return handler(req, body, { user, payload });
    } catch (error) {
      logError(error, errorContext);
      return createErrorResponse('Internal server error', 500);
    }
  };
  
  // Apply middleware
  let finalHandler = baseHandler;
  
  // Apply error handling middleware
  finalHandler = (req: NextRequest) => withErrorHandling(req, baseHandler, errorContext);
  
  // Apply CORS middleware if needed
  if (cors) {
    finalHandler = (req: NextRequest) => withCors(req, finalHandler, cors);
  }
  
  return finalHandler;
}

/**
 * Create a DELETE API handler
 */
export function createDeleteHandler(
  handler: (req: NextRequest, context: { user?: any; payload?: any }) => Promise<NextResponse>,
  options: ApiHandlerOptions = {}
): (req: NextRequest) => Promise<NextResponse> {
  const { requireAuth = true, cors, errorContext = 'DELETE API' } = options;
  
  // Create the base handler
  const baseHandler = async (req: NextRequest): Promise<NextResponse> => {
    // Only allow DELETE requests
    if (req.method !== 'DELETE') {
      return createErrorResponse('Method not allowed', 405);
    }
    
    // If authentication is required, use the withAuth middleware
    if (requireAuth) {
      return withAuth(req, async (req, user, payload) => {
        return handler(req, { user, payload });
      });
    }
    
    // Otherwise, just call the handler
    try {
      const payload = await getPayload({ config: configPromise });
      const { user } = await payload.auth({ headers: req.headers });
      return handler(req, { user, payload });
    } catch (error) {
      logError(error, errorContext);
      return createErrorResponse('Internal server error', 500);
    }
  };
  
  // Apply middleware
  let finalHandler = baseHandler;
  
  // Apply error handling middleware
  finalHandler = (req: NextRequest) => withErrorHandling(req, baseHandler, errorContext);
  
  // Apply CORS middleware if needed
  if (cors) {
    finalHandler = (req: NextRequest) => withCors(req, finalHandler, cors);
  }
  
  return finalHandler;
}
