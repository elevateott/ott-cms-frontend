// No import of logger to avoid circular dependencies
/**
 * Client-side logger utility
 *
 * This module provides a client-side logger that can both log to the console
 * and optionally forward logs to the server for centralized logging.
 */

// Types for client logging
export type LogLevel = 'info' | 'warn' | 'error' | 'debug'

// Type for log data that can be passed to logging functions
export interface LogData {
  [key: string]: unknown
}

export interface ClientLogData {
  level: LogLevel
  message: string
  context?: string
  timestamp: string
  data?: LogData
  userAgent?: string
  url?: string
  // Add any other browser-specific context you want to capture
}

// Configuration
const LOG_TO_SERVER = process.env.NEXT_PUBLIC_ENABLE_REMOTE_LOGGING === 'true'
const LOG_ENDPOINT = '/api/log/client'

// Get browser information
const getBrowserInfo = () => {
  if (typeof window === 'undefined') return {}

  return {
    userAgent: window.navigator.userAgent,
    url: window.location.href,
  }
}

// Send log to server
const sendToServer = async (logData: ClientLogData): Promise<void> => {
  if (!LOG_TO_SERVER) return

  try {
    // Use fetch with keepalive to ensure logs are sent even during page transitions
    await fetch(LOG_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logData),
      keepalive: true, // This ensures the request completes even if the page is unloading
    })
  } catch (err) {
    // Don't use the logger here to avoid infinite loops
    console.error('[ClientLogger] Failed to send log to server:', err)
  }
}

// Create a log entry and handle both console and server logging
const createLog = (level: LogLevel, message: string, context?: string, data?: LogData) => {
  const timestamp = new Date().toISOString()
  const browserInfo = getBrowserInfo()

  // Format for console
  const consolePrefix = context ? `[${context}] ` : ''

  // Log to console based on level
  switch (level) {
    case 'info':
      console.log(`[INFO] ${consolePrefix}${message}`, data)
      break
    case 'warn':
      console.warn(`[WARN] ${consolePrefix}${message}`, data)
      break
    case 'error':
      console.error(`[ERROR] ${consolePrefix}${message}`, data)
      break
    case 'debug':
      console.debug(`[DEBUG] ${consolePrefix}${message}`, data)
      break
  }

  // Prepare log data for server
  const logData: ClientLogData = {
    level,
    message,
    context,
    timestamp,
    data,
    ...browserInfo,
  }

  // Send to server if enabled
  if (LOG_TO_SERVER) {
    sendToServer(logData).catch(() => {
      // Silent catch to prevent errors if server logging fails
    })
  }
}

// Main logger object
export const clientLogger = {
  info: (message: string, context?: string, data?: LogData) =>
    createLog('info', message, context, data),

  warn: (message: string, context?: string, data?: LogData) =>
    createLog('warn', message, context, data),

  error: (message: string | Error, context?: string, data?: LogData) => {
    // Handle Error objects specially
    if (message instanceof Error) {
      const errorData = {
        ...data,
        name: message.name,
        stack: message.stack,
      }
      createLog('error', message.message, context, errorData)
    } else {
      createLog('error', message, context, data)
    }
  },

  debug: (message: string, context?: string, data?: LogData) =>
    createLog('debug', message, context, data),

  // Create a logger with a fixed context
  createContextLogger: (context: string) => ({
    info: (message: string, data?: LogData) => createLog('info', message, context, data),
    warn: (message: string, data?: LogData) => createLog('warn', message, context, data),
    error: (message: string | Error, data?: LogData) => {
      if (message instanceof Error) {
        const errorData = {
          ...data,
          name: message.name,
          stack: message.stack,
        }
        createLog('error', message.message, context, errorData)
      } else {
        createLog('error', message, context, data)
      }
    },
    debug: (message: string, data?: LogData) => createLog('debug', message, context, data),
  }),
}
