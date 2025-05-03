/**
 * Legacy Logger utility functions
 *
 * These functions are kept for backward compatibility.
 * New code should use the logger from @/utils/logger directly.
 */

// Use console directly to avoid circular dependencies
export const logError = (error: unknown, context?: string) => {
  const errorMessage = error instanceof Error ? error.message : String(error)
  const contextPrefix = context ? `[${context}] ` : ''
  console.error(`${contextPrefix}Error: ${errorMessage}`)

  if (error instanceof Error && error.stack) {
    console.error('Stack trace:', error.stack)
  }
}

export const logInfo = (message: string, context?: string) => {
  const contextPrefix = context ? `[${context}] ` : ''
  console.log(`${contextPrefix}${message}`)
}

export const logWarning = (message: string, context?: string) => {
  const contextPrefix = context ? `[${context}] ` : ''
  console.warn(`${contextPrefix}${message}`)
}
