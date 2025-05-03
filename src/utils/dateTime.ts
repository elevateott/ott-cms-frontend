/**
 * Date and Time Utilities
 * 
 * This module provides utility functions for working with dates and times.
 */

/**
 * Format a date as an ISO string
 */
export function formatISODate(date: Date | string | number): string {
  const dateObj = typeof date === 'object' ? date : new Date(date);
  return dateObj.toISOString();
}

/**
 * Format a date for display
 */
export function formatDisplayDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
): string {
  const dateObj = typeof date === 'object' ? date : new Date(date);
  return new Intl.DateTimeFormat('en-US', options).format(dateObj);
}

/**
 * Format a duration in seconds to a human-readable string
 */
export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) {
    return '0:00';
  }
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Check if a date is in the past
 */
export function isPastDate(date: Date | string | number): boolean {
  const dateObj = typeof date === 'object' ? date : new Date(date);
  return dateObj < new Date();
}

/**
 * Check if a date is in the future
 */
export function isFutureDate(date: Date | string | number): boolean {
  const dateObj = typeof date === 'object' ? date : new Date(date);
  return dateObj > new Date();
}

/**
 * Get the difference between two dates in days
 */
export function getDaysDifference(
  date1: Date | string | number,
  date2: Date | string | number = new Date()
): number {
  const dateObj1 = typeof date1 === 'object' ? date1 : new Date(date1);
  const dateObj2 = typeof date2 === 'object' ? date2 : new Date(date2);
  
  const diffTime = Math.abs(dateObj2.getTime() - dateObj1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Get a relative time string (e.g., "2 days ago", "in 3 hours")
 */
export function getRelativeTimeString(
  date: Date | string | number,
  now: Date | string | number = new Date()
): string {
  const dateObj = typeof date === 'object' ? date : new Date(date);
  const nowObj = typeof now === 'object' ? now : new Date(now);
  
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const diffInSeconds = Math.floor((dateObj.getTime() - nowObj.getTime()) / 1000);
  
  if (Math.abs(diffInSeconds) < 60) {
    return rtf.format(Math.sign(diffInSeconds), 'second');
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (Math.abs(diffInMinutes) < 60) {
    return rtf.format(diffInMinutes, 'minute');
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (Math.abs(diffInHours) < 24) {
    return rtf.format(diffInHours, 'hour');
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (Math.abs(diffInDays) < 30) {
    return rtf.format(diffInDays, 'day');
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (Math.abs(diffInMonths) < 12) {
    return rtf.format(diffInMonths, 'month');
  }
  
  const diffInYears = Math.floor(diffInDays / 365);
  return rtf.format(diffInYears, 'year');
}
