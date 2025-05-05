/**
 * Utility functions for formatting data
 */

/**
 * Format a price value with currency symbol
 * @param price - The price to format
 * @param currency - The currency code (default: USD)
 * @param locale - The locale to use for formatting (default: en-US)
 * @returns Formatted price string
 */
export function formatPrice(
  price: number | string | undefined | null,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  if (price === undefined || price === null) {
    return '$0.00';
  }

  // Convert string to number if needed
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;

  // Handle NaN
  if (isNaN(numericPrice)) {
    return '$0.00';
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericPrice);
}

/**
 * Format a date string or timestamp
 * @param date - The date to format
 * @param options - Intl.DateTimeFormatOptions
 * @param locale - The locale to use for formatting (default: en-US)
 * @returns Formatted date string
 */
export function formatDate(
  date: string | number | Date | undefined | null,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  },
  locale: string = 'en-US'
): string {
  if (!date) return 'N/A';

  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, options).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
}

/**
 * Format a number with commas
 * @param num - The number to format
 * @returns Formatted number string
 */
export function formatNumber(num: number | string | undefined | null): string {
  if (num === undefined || num === null) return '0';
  
  const numericValue = typeof num === 'string' ? parseFloat(num) : num;
  
  if (isNaN(numericValue)) return '0';
  
  return new Intl.NumberFormat().format(numericValue);
}

/**
 * Format a duration in seconds to a human-readable string
 * @param seconds - Duration in seconds
 * @returns Formatted duration string (e.g., "1h 30m" or "45m 20s")
 */
export function formatDuration(seconds: number | string | undefined | null): string {
  if (seconds === undefined || seconds === null) return '0s';
  
  const numericSeconds = typeof seconds === 'string' ? parseFloat(seconds) : seconds;
  
  if (isNaN(numericSeconds)) return '0s';
  
  const hours = Math.floor(numericSeconds / 3600);
  const minutes = Math.floor((numericSeconds % 3600) / 60);
  const remainingSeconds = Math.floor(numericSeconds % 60);
  
  let result = '';
  
  if (hours > 0) {
    result += `${hours}h `;
  }
  
  if (minutes > 0 || hours > 0) {
    result += `${minutes}m `;
  }
  
  if (remainingSeconds > 0 && hours === 0) {
    result += `${remainingSeconds}s`;
  }
  
  return result.trim();
}

/**
 * Format a file size in bytes to a human-readable string
 * @param bytes - Size in bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted file size string (e.g., "1.5 MB")
 */
export function formatFileSize(
  bytes: number | string | undefined | null,
  decimals: number = 2
): string {
  if (bytes === undefined || bytes === null) return '0 Bytes';
  
  const numericBytes = typeof bytes === 'string' ? parseFloat(bytes) : bytes;
  
  if (isNaN(numericBytes)) return '0 Bytes';
  if (numericBytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(numericBytes) / Math.log(k));
  
  return parseFloat((numericBytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
