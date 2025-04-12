/**
 * Logger utility functions
 */

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