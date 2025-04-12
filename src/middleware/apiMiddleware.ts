/**
 * API Middleware
 *
 * Provides middleware functions for API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import configPromise from '@payload-config';
import { createUnauthorizedResponse, createErrorResponse } from '@/utils/apiResponse';
import { logError } from '@/utils/errorHandler';

/**
 * Middleware to handle authentication
 */
export async function withAuth(
  req: NextRequest,
  handler: (req: NextRequest, user: any, payload: any) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Initialize Payload
    const payload = await getPayload({ config: configPromise });

    // Check if the user is authenticated
    const { user } = await payload.auth({ headers: req.headers });

    if (!user) {
      return createUnauthorizedResponse();
    }

    // Call the handler with the authenticated user
    return await handler(req, user, payload);
  } catch (error) {
    logError(error, 'AuthMiddleware');
    return createErrorResponse('Authentication failed', 500);
  }
}

/**
 * Middleware to handle errors
 */
export async function withErrorHandling(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>,
  context: string = 'API'
): Promise<NextResponse> {
  try {
    return await handler(req);
  } catch (error) {
    logError(error, context);
    return createErrorResponse('Internal server error', 500);
  }
}

/**
 * Middleware to handle CORS
 */
export function withCors(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: {
    allowedOrigins?: string[];
    allowedMethods?: string[];
    allowedHeaders?: string[];
    allowCredentials?: boolean;
  } = {}
): Promise<NextResponse> {
  const {
    allowedOrigins = ['*'],
    allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders = ['Content-Type', 'Authorization'],
    allowCredentials = true,
  } = options;

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });

    response.headers.set('Access-Control-Allow-Methods', allowedMethods.join(', '));
    response.headers.set('Access-Control-Allow-Headers', allowedHeaders.join(', '));
    response.headers.set('Access-Control-Max-Age', '86400');

    if (allowCredentials) {
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    // Set the allowed origin
    const origin = req.headers.get('origin') || '';
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }

    return Promise.resolve(response);
  }

  // Handle regular requests
  return handler(req).then(response => {
    // Set CORS headers
    const origin = req.headers.get('origin') || '';
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }

    if (allowCredentials) {
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    return response;
  });
}

/**
 * Combine multiple middleware functions
 */
export function combineMiddleware(
  middlewares: Array<(req: NextRequest, handler: (req: NextRequest) => Promise<NextResponse>) => Promise<NextResponse>>,
  handler: (req: NextRequest) => Promise<NextResponse>
): (req: NextRequest) => Promise<NextResponse> {
  return (req: NextRequest) => {
    // Apply middleware in reverse order
    return middlewares.reduceRight<(req: NextRequest) => Promise<NextResponse>>(
      (acc, middleware) => (req: NextRequest) => middleware(req, acc),
      handler
    )(req);
  };
}

