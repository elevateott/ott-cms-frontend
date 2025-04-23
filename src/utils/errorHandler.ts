/**
 * Error Handling Utilities
 *
 * This module provides utility functions for handling errors consistently.
 * It integrates with the application logger for structured error logging.
 */

import { appConfig } from '@/config'
import { logger } from '@/utils/logger'

/**
 * Custom application error class
 */
export class AppError extends Error {
  public statusCode: number
  public isOperational: boolean

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * Log an error with consistent formatting
 */
export function logError(
  error: Error | AppError | unknown,
  context?: string,
  data?: Record<string, unknown>,
): void {
  // Use the structured logger
  if (error instanceof AppError) {
    logger.error(
      {
        context,
        err: error,
        stack: error.stack,
        statusCode: error.statusCode,
        isOperational: error.isOperational,
        ...data,
      },
      error.message,
    )
  } else if (error instanceof Error) {
    logger.error(
      {
        context,
        err: error,
        stack: error.stack,
        ...data,
      },
      error.message,
    )
  } else {
    logger.error(
      {
        context,
        err: error,
        ...data,
      },
      'Unknown error',
    )
  }

  // For backward compatibility, also log to console in development
  if (appConfig.environment === 'development') {
    const formattedError = {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      statusCode: error instanceof AppError ? error.statusCode : undefined,
      isOperational: error instanceof AppError ? error.isOperational : undefined,
      context,
    }

    console.error(
      `[ERROR]${context ? ` [${context}]` : ''}:`,
      JSON.stringify(formattedError, null, 2),
    )
  }
}

/**
 * Handle an error and return appropriate information
 */
export function handleError(
  error: Error | AppError | unknown,
  context?: string,
): {
  message: string
  statusCode: number
  isOperational: boolean
} {
  // Log the error
  logError(error, context)

  // Return appropriate error information
  if (error instanceof AppError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      isOperational: error.isOperational,
    }
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      statusCode: 500,
      isOperational: false,
    }
  }

  return {
    message: 'An unknown error occurred',
    statusCode: 500,
    isOperational: false,
  }
}

/**
 * Create a not found error
 */
export function createNotFoundError(resource: string): AppError {
  return new AppError(`${resource} not found`, 404)
}

/**
 * Create an unauthorized error
 */
export function createUnauthorizedError(message: string = 'Unauthorized'): AppError {
  return new AppError(message, 401)
}

/**
 * Create a forbidden error
 */
export function createForbiddenError(message: string = 'Forbidden'): AppError {
  return new AppError(message, 403)
}

/**
 * Create a validation error
 */
export function createValidationError(message: string = 'Validation Error'): AppError {
  return new AppError(message, 422)
}
