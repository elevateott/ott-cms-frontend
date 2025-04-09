/**
 * API Response Utilities
 * 
 * This module provides utility functions for creating consistent API responses.
 */

import { NextResponse } from 'next/server';
import { ApiResponse, ApiErrorResponse } from '@/types/api';

/**
 * Create a successful API response
 */
export function createApiResponse<T>(
  data?: T,
  options?: {
    message?: string;
    status?: number;
  }
): NextResponse {
  const { message, status = 200 } = options || {};
  
  const response: ApiResponse<T> = {
    success: true,
    ...(data !== undefined && { data }),
    ...(message && { message }),
  };
  
  return NextResponse.json(response, { status });
}

/**
 * Create an error API response
 */
export function createErrorResponse(
  error: string | Error,
  status: number = 400
): NextResponse {
  const errorMessage = error instanceof Error ? error.message : error;
  
  const response: ApiErrorResponse = {
    success: false,
    error: errorMessage,
    statusCode: status,
  };
  
  return NextResponse.json(response, { status });
}

/**
 * Create a not found API response
 */
export function createNotFoundResponse(
  message: string = 'Resource not found'
): NextResponse {
  return createErrorResponse(message, 404);
}

/**
 * Create an unauthorized API response
 */
export function createUnauthorizedResponse(
  message: string = 'Unauthorized'
): NextResponse {
  return createErrorResponse(message, 401);
}

/**
 * Create a forbidden API response
 */
export function createForbiddenResponse(
  message: string = 'Forbidden'
): NextResponse {
  return createErrorResponse(message, 403);
}

/**
 * Create a validation error API response
 */
export function createValidationErrorResponse(
  errors: Record<string, string> | string[]
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: 'Validation Error',
      errors,
    },
    { status: 422 }
  );
}
