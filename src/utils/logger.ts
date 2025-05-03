/**
 * Server-side logger utility
 *
 * This module provides a configured Pino logger instance for server-side logging.
 * It supports different log levels based on the environment and can be configured
 * to output to files in production.
 */

import pino from 'pino'

// Determine environment-specific settings directly from NODE_ENV
// to avoid circular dependency with config
const isDevelopment = process.env.NODE_ENV !== 'production'
const logLevel = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info')

// Base logger configuration
const loggerConfig: pino.LoggerOptions = {
  level: logLevel,
  // Add timestamp, hostname, and pid to all logs
  base: {
    pid: process.pid,
    hostname: process.env.HOSTNAME || 'unknown',
    env: process.env.NODE_ENV || 'development',
  },
}

// Check if file logging is enabled
const enableFileLogging = process.env.ENABLE_FILE_LOGGING === 'true'
const logFilePath = process.env.LOG_FILE || './logs/app.log'

// Development configuration
if (isDevelopment) {
  if (enableFileLogging) {
    // In development with file logging, use pino-pretty for console and write to file
    loggerConfig.transport = {
      targets: [
        {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
          level: 'debug',
        },
        {
          target: 'pino/file',
          options: { destination: logFilePath },
          level: 'debug',
        },
      ],
    }
  } else {
    // Standard development configuration with pretty printing only
    loggerConfig.transport = {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    }
  }
} else {
  // Production configuration
  // If LOG_FILE is set, log to a file
  if (process.env.LOG_FILE) {
    loggerConfig.transport = {
      target: 'pino/file',
      options: { destination: process.env.LOG_FILE },
    }
  }
}

// Create the logger instance
export const logger = pino(loggerConfig)

// Export convenience methods with context support
export const logInfo = (message: string, context?: string, data?: object) => {
  logger.info({ context, ...data }, message)
}

export const logError = (error: unknown, context?: string, data?: object) => {
  if (error instanceof Error) {
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
}

export const logWarning = (message: string, context?: string, data?: object) => {
  logger.warn({ context, ...data }, message)
}

export const logDebug = (message: string, context?: string, data?: object) => {
  logger.debug({ context, ...data }, message)
}

// Create a child logger with a specific context
export const createContextLogger = (context: string) => {
  const childLogger = logger.child({ context })

  return {
    info: (message: string, data?: object) => childLogger.info(data || {}, message),
    error: (error: unknown, data?: object) => {
      if (error instanceof Error) {
        childLogger.error({ err: error, stack: error.stack, ...data }, error.message)
      } else {
        childLogger.error({ err: error, ...data }, 'Unknown error')
      }
    },
    warn: (message: string, data?: object) => childLogger.warn(data || {}, message),
    debug: (message: string, data?: object) => childLogger.debug(data || {}, message),
  }
}
