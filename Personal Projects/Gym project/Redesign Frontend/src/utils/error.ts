import { AxiosError } from 'axios';
import { ApiError } from '@/services/api/types';

/**
 * Sanitize error message to prevent information leakage
 * Removes sensitive information like stack traces, internal paths, etc.
 */
function sanitizeErrorMessage(message: string, isProduction: boolean = import.meta.env.PROD): string {
  if (!isProduction) {
    // In development, return full message for debugging
    return message;
  }

  // Remove stack traces
  let sanitized = message.split('\n')[0];

  // Remove file paths
  sanitized = sanitized.replace(/\/[^\s]+/g, '[path]');

  // Remove internal error codes that might leak system info
  sanitized = sanitized.replace(/Error:\s*\d+/g, 'Error');

  // Generic messages for common errors
  if (sanitized.toLowerCase().includes('user not found') || 
      sanitized.toLowerCase().includes('user does not exist')) {
    return 'Invalid email or password';
  }

  if (sanitized.toLowerCase().includes('password') && 
      sanitized.toLowerCase().includes('incorrect')) {
    return 'Invalid email or password';
  }

  if (sanitized.toLowerCase().includes('unauthorized') || 
      sanitized.toLowerCase().includes('authentication')) {
    return 'Authentication required. Please sign in.';
  }

  if (sanitized.toLowerCase().includes('forbidden') || 
      sanitized.toLowerCase().includes('access denied')) {
    return 'Access denied. You do not have permission to perform this action.';
  }

  // Limit message length
  if (sanitized.length > 200) {
    sanitized = sanitized.substring(0, 200) + '...';
  }

  return sanitized;
}

/**
 * Extract user-friendly error message from various error types
 * SECURITY: Sanitizes error messages to prevent information leakage
 */
export function getErrorMessage(error: unknown): string {
  // Handle ApiError (our custom error type)
  if (error instanceof ApiError) {
    return sanitizeErrorMessage(error.message);
  }

  if (error instanceof Error) {
    // Check if it's an Axios error
    if ('response' in error) {
      const axiosError = error as AxiosError<{ message?: string; error?: string }>;
      const status = axiosError.response?.status;

      // Generic messages for auth errors
      if (status === 401) {
        return 'Session expired. Please sign in again.';
      }

      if (status === 403) {
        return 'Access denied. You do not have permission to perform this action.';
      }

      if (status === 404) {
        return 'The requested resource was not found.';
      }

      if (status === 429) {
        return 'Too many requests. Please try again later.';
      }

      if (status && status >= 500) {
        return 'Server error. Please try again later.';
      }

      if (axiosError.response?.data) {
        const data = axiosError.response.data;
        if (typeof data === 'object' && data !== null) {
          if (data.message && typeof data.message === 'string') {
            return sanitizeErrorMessage(data.message);
          }
          if (data.error && typeof data.error === 'string') {
            return sanitizeErrorMessage(data.error);
          }
        }
      }
      if (axiosError.response?.statusText) {
        return sanitizeErrorMessage(axiosError.response.statusText);
      }
      if (axiosError.message) {
        return sanitizeErrorMessage(axiosError.message);
      }
    }
    return sanitizeErrorMessage(error.message);
  }

  if (typeof error === 'string') {
    return sanitizeErrorMessage(error);
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const errorObj = error as { message: unknown };
    if (typeof errorObj.message === 'string') {
      return sanitizeErrorMessage(errorObj.message);
    }
  }

  return 'An unexpected error occurred. Please try again.';
}

