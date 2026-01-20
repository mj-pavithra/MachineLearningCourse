import { AxiosError } from 'axios';
import { CommonResponseDataType } from '@/types/common';

/**
 * Standard API Response type
 * Wraps the common response format used across all endpoints
 */
export type ApiResponse<T> = CommonResponseDataType<T>;

/**
 * API Error class for standardized error handling
 * Extends Error with additional API-specific properties
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly code?: string;
  public readonly response?: unknown;
  public readonly url?: string;
  public readonly method?: string;
  public readonly gymId?: string | null;

  constructor(
    message: string,
    status: number,
    options?: {
      code?: string;
      response?: unknown;
      url?: string;
      method?: string;
      gymId?: string | null;
    }
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = options?.code;
    this.response = options?.response;
    this.url = options?.url;
    this.method = options?.method;
    this.gymId = options?.gymId;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /**
   * Check if error is a client error (4xx)
   */
  isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  /**
   * Check if error is a server error (5xx)
   */
  isServerError(): boolean {
    return this.status >= 500 && this.status < 600;
  }

  /**
   * Check if error is an authentication error (401)
   */
  isAuthError(): boolean {
    return this.status === 401;
  }

  /**
   * Check if error is a rate limit error (429)
   */
  isRateLimitError(): boolean {
    return this.status === 429;
  }

  /**
   * Check if error is a not found error (404)
   */
  isNotFoundError(): boolean {
    return this.status === 404;
  }

  /**
   * Convert to JSON for logging
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      code: this.code,
      url: this.url,
      method: this.method,
      gymId: this.gymId,
      stack: this.stack,
    };
  }
}

/**
 * Helper to create ApiError from AxiosError
 */
export function createApiErrorFromAxiosError(
  error: AxiosError<ApiResponse<unknown>>,
  gymId?: string | null
): ApiError {
  const status = error.response?.status || error.status || 500;
  const responseData = error.response?.data;
  const message =
    responseData?.message ||
    error.message ||
    error.response?.statusText ||
    'API request failed';

  return new ApiError(message, status, {
    code: responseData?.status === 'FAIL' ? 'API_FAIL' : undefined,
    response: responseData,
    url: error.config?.url,
    method: error.config?.method?.toUpperCase(),
    gymId,
  });
}

/**
 * Helper to validate API response status
 * Throws ApiError if status is not SUCCESS
 */
export function validateApiResponse<T>(
  response: ApiResponse<T>,
  url?: string,
  method?: string,
  gymId?: string | null
): T {
  if (response.status !== 'SUCCESS') {
    throw new ApiError(
      response.message || 'API request failed',
      200, // HTTP 200 but business logic failure
      {
        code: 'API_FAIL',
        response,
        url,
        method,
        gymId,
      }
    );
  }

  return response.data;
}

/**
 * Request configuration type for API calls
 */
export interface ApiRequestConfig {
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  timeout?: number;
  idempotencyKey?: string; // For retry-safe POST/PUT/DELETE
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  size?: number;
  limit?: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page?: number;
  size?: number;
}

