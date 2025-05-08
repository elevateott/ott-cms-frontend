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
const LOG_STATUS_ENDPOINT = '/api/log/status'

// Error tracking to disable logging if there are persistent errors
let consecutiveErrors = 0
const MAX_CONSECUTIVE_ERRORS = 3
let loggingDisabled = false
let lastErrorTime = 0
const RETRY_INTERVAL = 60000 // 1 minute in milliseconds

// Function to disable server logging after too many errors
const disableServerLoggingIfNeeded = () => {
  consecutiveErrors++
  if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS && !loggingDisabled) {
    console.warn('[ClientLogger] Disabling server logging due to persistent errors')
    loggingDisabled = true
    lastErrorTime = Date.now()
  }
}

// Function to reset error count on successful log
const resetErrorCount = () => {
  consecutiveErrors = 0

  // If logging was disabled but enough time has passed, re-enable it
  if (loggingDisabled && Date.now() - lastErrorTime > RETRY_INTERVAL) {
    loggingDisabled = false
    console.info('[ClientLogger] Re-enabling server logging')
  }
}

// Function to check if logging is currently enabled
const isLoggingEnabled = () => {
  return LOG_TO_SERVER && !loggingDisabled
}

// Helper function to fetch with timeout using Promise.race
const fetchWithTimeout = (url: string, options: RequestInit, timeout = 3000): Promise<Response> => {
  // Check if fetch is available (only in browser environment)
  if (typeof fetch === 'undefined') {
    return Promise.reject(new Error('Fetch API not available'))
  }

  return Promise.race([
    fetch(url, options).catch((error) => {
      // Convert network errors to a rejected promise with a more descriptive message
      return Promise.reject(new Error(`Network error: ${error.message || 'Unknown error'}`))
    }),
    new Promise<Response>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout),
    ),
  ])
}

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
  if (!isLoggingEnabled()) return

  // Don't attempt to send logs if we're not in a browser environment
  if (typeof window === 'undefined') return

  // Get the current server URL from the window location
  const serverUrl = window.location.origin
  const fullEndpoint = `${serverUrl}${LOG_ENDPOINT}`

  try {
    // Check if the API endpoint exists before sending
    if (!fullEndpoint || !serverUrl) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[ClientLogger] Invalid API endpoint, skipping log send')
      }
      return
    }

    const response = await fetchWithTimeout(
      fullEndpoint,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData),
        keepalive: true, // This ensures the request completes even if the page is unloading
        // Add credentials to ensure cookies are sent
        credentials: 'same-origin',
      },
      3000, // 3 second timeout
    )

    // Reset error count on successful request
    if (response.ok) {
      resetErrorCount()
    } else {
      // Increment error count for non-200 responses
      disableServerLoggingIfNeeded()
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[ClientLogger] Server returned ${response.status}: ${response.statusText}`)
      }
    }
  } catch (err) {
    // Don't use the logger here to avoid infinite loops
    // Track consecutive errors
    disableServerLoggingIfNeeded()

    // Only log to console in development
    if (process.env.NODE_ENV === 'development') {
      // Check if it's a timeout error
      if (err instanceof Error && err.message === 'Request timeout') {
        console.warn('[ClientLogger] Request timed out after 3 seconds')
      } else if (err instanceof Error && err.message.startsWith('Network error:')) {
        console.warn(`[ClientLogger] ${err.message}`)
      } else {
        console.warn('[ClientLogger] Failed to send log to server:', err)
      }
    }
  }
}

// Queue for batching logs
let logQueue: ClientLogData[] = []
let sendTimeout: NodeJS.Timeout | null = null
const BATCH_INTERVAL = 10000 // 10 seconds

// Function to send queued logs
const sendQueuedLogs = () => {
  if (logQueue.length === 0) return

  // Take a copy of the current queue and clear it
  const logsToSend = [...logQueue]
  logQueue = []

  // Send each log with proper error handling
  logsToSend.forEach((logData) => {
    sendToServer(logData).catch((error) => {
      // If server logging is disabled, don't re-queue
      if (loggingDisabled) return

      // For network errors, re-queue the log for the next batch
      // but only if we haven't exceeded the maximum queue size
      if (logQueue.length < 100) {
        logQueue.push(logData)
        if (process.env.NODE_ENV === 'development') {
          console.warn(
            `[ClientLogger] Re-queued log due to error: ${error.message || 'Unknown error'}`,
          )
        }
      } else if (process.env.NODE_ENV === 'development') {
        console.warn('[ClientLogger] Log queue full, dropping log')
      }
    })
  })

  // Clear the timeout
  sendTimeout = null
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
  if (isLoggingEnabled()) {
    // For errors, send immediately
    if (level === 'error') {
      sendToServer(logData).catch(() => {
        // Silent catch to prevent errors if server logging fails
      })
    } else {
      // For other levels, batch them
      logQueue.push(logData)

      // Set a timeout to send the queued logs if not already set
      if (!sendTimeout) {
        sendTimeout = setTimeout(sendQueuedLogs, BATCH_INTERVAL)
      }
    }
  }
}

// Check server availability on startup
if (typeof window !== 'undefined' && LOG_TO_SERVER) {
  // Wait for the page to load completely
  window.addEventListener('load', () => {
    // Check if the server is available
    const serverUrl = window.location.origin
    const statusEndpoint = `${serverUrl}${LOG_STATUS_ENDPOINT}`

    // Don't try to check if the endpoint is invalid
    if (!statusEndpoint || !serverUrl) {
      console.warn('[ClientLogger] Invalid API endpoint, disabling server logging')
      loggingDisabled = true
      return
    }

    // Use a try-catch to handle any unexpected errors
    try {
      fetchWithTimeout(
        statusEndpoint,
        {
          method: 'GET',
          cache: 'no-store',
          // Add credentials to ensure cookies are sent
          credentials: 'same-origin',
        },
        3000, // 3 second timeout
      )
        .then(async (response) => {
          if (response.ok) {
            try {
              // Parse the JSON response
              const data = await response.json()

              if (data.success && data.status === 'available') {
                console.debug('[ClientLogger] Server logging is available')
                resetErrorCount()
                loggingDisabled = false
              } else {
                console.warn(
                  '[ClientLogger] Server logging is not available:',
                  data.status || 'unknown status',
                )
                loggingDisabled = true
              }
            } catch (error) {
              console.warn('[ClientLogger] Error parsing status response:', error)
              loggingDisabled = true
            }
          } else {
            console.warn(`[ClientLogger] Server returned ${response.status}, disabling logging`)
            // Disable logging immediately for non-200 responses
            loggingDisabled = true
          }
        })
        .catch((err) => {
          // Check if it's a timeout error
          if (err instanceof Error && err.message === 'Request timeout') {
            console.warn('[ClientLogger] Server availability check timed out after 3 seconds')
          } else if (err instanceof Error && err.message.startsWith('Network error:')) {
            console.warn(`[ClientLogger] ${err.message}`)
          } else {
            console.warn(
              '[ClientLogger] Server logging is not available:',
              err.message || 'Unknown error',
            )
          }

          // Disable logging immediately for any error
          loggingDisabled = true
        })
    } catch (error) {
      console.warn('[ClientLogger] Error checking server availability:', error)
      loggingDisabled = true
    }
  })
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
