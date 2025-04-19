/**
 * Validation Utilities
 *
 * This module provides utility functions for validating data.
 */

/**
 * Validate that required fields are present
 */
export function validateRequiredFields<T extends Record<string, unknown>>(
  data: T,
  requiredFields: (keyof T)[]
): { isValid: boolean; missingFields: string[] } {
  const missingFields = requiredFields.filter(
    (field) => data[field] === undefined || data[field] === null || data[field] === ''
  );

  return {
    isValid: missingFields.length === 0,
    missingFields: missingFields as string[],
  };
}

/**
 * Validate that a string matches a pattern
 */
export function validatePattern(
  value: string,
  pattern: RegExp,
  errorMessage: string = 'Invalid format'
): { isValid: boolean; error?: string } {
  if (!pattern.test(value)) {
    return { isValid: false, error: errorMessage };
  }

  return { isValid: true };
}

/**
 * Validate that a value is within a range
 */
export function validateRange(
  value: number,
  min: number,
  max: number,
  errorMessage: string = 'Value out of range'
): { isValid: boolean; error?: string } {
  if (value < min || value > max) {
    return { isValid: false, error: errorMessage };
  }

  return { isValid: true };
}

/**
 * Validate that a string has a minimum length
 */
export function validateMinLength(
  value: string,
  minLength: number,
  errorMessage: string = `Must be at least ${minLength} characters`
): { isValid: boolean; error?: string } {
  if (value.length < minLength) {
    return { isValid: false, error: errorMessage };
  }

  return { isValid: true };
}

/**
 * Validate that a string has a maximum length
 */
export function validateMaxLength(
  value: string,
  maxLength: number,
  errorMessage: string = `Must be at most ${maxLength} characters`
): { isValid: boolean; error?: string } {
  if (value.length > maxLength) {
    return { isValid: false, error: errorMessage };
  }

  return { isValid: true };
}

/**
 * Validate an email address
 */
export function validateEmail(
  email: string,
  errorMessage: string = 'Invalid email address'
): { isValid: boolean; error?: string } {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return validatePattern(email, emailPattern, errorMessage);
}

/**
 * Validate a URL
 */
export function validateUrl(
  url: string,
  errorMessage: string = 'Invalid URL'
): { isValid: boolean; error?: string } {
  try {
    new URL(url);
    return { isValid: true };
  } catch (_error) { // Use underscore prefix to indicate intentionally unused parameter
    return { isValid: false, error: errorMessage };
  }
}

