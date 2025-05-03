import { format } from 'date-fns'

/**
 * Format a date for display
 * 
 * @param date - Date to format (string, Date object, or timestamp)
 * @param formatString - Optional format string (defaults to 'MMM d, yyyy h:mm a')
 * @returns Formatted date string
 */
export function formatDate(
  date: string | Date | number | undefined | null,
  formatString: string = 'MMM d, yyyy h:mm a'
): string {
  if (!date) return '—'
  
  try {
    return format(new Date(date), formatString)
  } catch (error) {
    console.error('Error formatting date:', error)
    return '—'
  }
}
