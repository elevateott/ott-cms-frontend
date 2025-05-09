/**
 * Utility functions for formatting data
 */

/**
 * Format a price value with currency symbol
 *
 * @param price - The price value to format
 * @param currency - The currency code (default: 'USD')
 * @param locale - The locale to use for formatting (default: 'en-US')
 * @returns Formatted price string with currency symbol
 */
export function formatPrice(
  price: number | string,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  // Convert string to number if needed
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price

  // Handle invalid input
  if (isNaN(numericPrice)) {
    return 'Invalid price'
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericPrice)
}

/**
 * Format a date string or timestamp
 *
 * @param date - Date string, timestamp, or Date object
 * @param options - Intl.DateTimeFormatOptions object
 * @param locale - The locale to use for formatting (default: 'en-US')
 * @returns Formatted date string
 */
export function formatDate(
  date: string | number | Date,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  },
  locale: string = 'en-US'
): string {
  try {
    const dateObj = date instanceof Date ? date : new Date(date)
    return new Intl.DateTimeFormat(locale, options).format(dateObj)
  } catch (error) {
    console.error('Error formatting date:', error)
    return 'Invalid date'
  }
}

/**
 * Format a file size in bytes to a human-readable string
 *
 * @param bytes - Size in bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted file size string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i]
}

/**
 * Truncate a string to a specified length and add ellipsis if needed
 *
 * @param str - The string to truncate
 * @param maxLength - Maximum length before truncation (default: 100)
 * @param ellipsis - String to append when truncated (default: '...')
 * @returns Truncated string
 */
export function truncateString(
  str: string,
  maxLength: number = 100,
  ellipsis: string = '...'
): string {
  if (!str) return ''

  if (str.length <= maxLength) return str

  return str.slice(0, maxLength) + ellipsis
}
