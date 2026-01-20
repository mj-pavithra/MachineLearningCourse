/**
 * Structured logging and monitoring utilities
 * Provides consistent logging format for API errors and events
 */

import { ApiError } from '@/services/api/types';

export interface LogContext {
  url?: string;
  method?: string;
  status?: number;
  gymId?: string | null;
  message?: string;
  error?: Error | unknown;
  [key: string]: unknown;
}

/**
 * Structured logger for API errors
 */
export function logApiError(error: ApiError | Error, context?: LogContext): void {
  const logData: Record<string, unknown> = {
    level: 'error',
    type: 'api_error',
    timestamp: new Date().toISOString(),
    ...context,
  };

  if (error instanceof ApiError) {
    logData.url = error.url || context?.url;
    logData.method = error.method || context?.method;
    logData.status = error.status || context?.status;
    logData.gymId = error.gymId || context?.gymId;
    logData.message = error.message || context?.message;
    logData.code = error.code;
    logData.isClientError = error.isClientError();
    logData.isServerError = error.isServerError();
    logData.isAuthError = error.isAuthError();
    logData.isRateLimitError = error.isRateLimitError();
  } else {
    logData.message = error.message || context?.message;
    logData.error = error;
  }

  // Use console.warn for structured logging (can be replaced with Sentry or other service)
  console.warn('[API Error]', JSON.stringify(logData, null, 2));
}

/**
 * Log token refresh failure
 */
export function logRefreshFailure(gymId: string | null, error: Error): void {
  const logData = {
    level: 'error',
    type: 'token_refresh_failure',
    timestamp: new Date().toISOString(),
    gymId,
    message: error.message,
    error: error.toString(),
  };

  console.error('[Token Refresh Failure]', JSON.stringify(logData, null, 2));
  
  // Emit metric event (can be extended to send to monitoring service)
  emitMetric('token_refresh_failure', { gymId });
}

/**
 * Log successful token refresh
 */
export function logRefreshSuccess(gymId: string | null): void {
  const logData = {
    level: 'info',
    type: 'token_refresh_success',
    timestamp: new Date().toISOString(),
    gymId,
  };

  console.log('[Token Refresh Success]', JSON.stringify(logData, null, 2));
  
  emitMetric('token_refresh_success', { gymId });
}

/**
 * Emit a metric event
 * Can be extended to send to monitoring service (e.g., Sentry, DataDog, etc.)
 */
export function emitMetric(eventName: string, data?: Record<string, unknown>): void {
  const metric = {
    event: eventName,
    timestamp: new Date().toISOString(),
    ...data,
  };

  // For now, just log to console
  // In production, this could send to Sentry, DataDog, or other monitoring service
  if (import.meta.env.DEV) {
    console.debug('[Metric]', JSON.stringify(metric, null, 2));
  }
}

/**
 * Log API request (for debugging)
 */
export function logApiRequest(url: string, method: string, gymId?: string | null): void {
  if (import.meta.env.DEV) {
    console.debug('[API Request]', {
      url,
      method,
      gymId,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Log API response (for debugging)
 */
export function logApiResponse(
  url: string,
  method: string,
  status: number,
  gymId?: string | null
): void {
  if (import.meta.env.DEV) {
    console.debug('[API Response]', {
      url,
      method,
      status,
      gymId,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Log security violation (missing token on protected endpoint)
 */
export function logSecurityViolation(
  url: string | undefined,
  method: string | undefined,
  reason: string
): void {
  const logData = {
    level: 'warn',
    type: 'security_violation',
    timestamp: new Date().toISOString(),
    url,
    method,
    reason,
    severity: 'high',
  };

  console.warn('[Security Violation]', JSON.stringify(logData, null, 2));
  emitMetric('security_violation', { url, method, reason });
}

/**
 * Log authentication failure
 */
export function logAuthFailure(
  url: string | undefined,
  method: string | undefined,
  reason: string,
  gymId?: string | null
): void {
  const logData = {
    level: 'warn',
    type: 'auth_failure',
    timestamp: new Date().toISOString(),
    url,
    method,
    reason,
    gymId,
  };

  console.warn('[Auth Failure]', JSON.stringify(logData, null, 2));
  emitMetric('auth_failure', { url, method, reason, gymId });
}

/**
 * Log authorization failure (403 Forbidden)
 */
export function logAuthzFailure(
  url: string | undefined,
  method: string | undefined,
  reason: string,
  gymId?: string | null,
  userId?: string
): void {
  const logData = {
    level: 'warn',
    type: 'authz_failure',
    timestamp: new Date().toISOString(),
    url,
    method,
    reason,
    gymId,
    userId,
    severity: 'high',
  };

  console.warn('[Authorization Failure]', JSON.stringify(logData, null, 2));
  emitMetric('authz_failure', { url, method, reason, gymId, userId });
}

/**
 * Log suspicious activity
 */
export function logSuspiciousActivity(
  activity: string,
  details: Record<string, unknown>,
  gymId?: string | null
): void {
  const logData = {
    level: 'error',
    type: 'suspicious_activity',
    timestamp: new Date().toISOString(),
    activity,
    details,
    gymId,
    severity: 'critical',
  };

  console.error('[Suspicious Activity]', JSON.stringify(logData, null, 2));
  emitMetric('suspicious_activity', { activity, gymId, ...details });
}

/**
 * Log admin action for audit trail
 */
export function logAdminAction(
  action: string,
  url: string | undefined,
  method: string | undefined,
  gymId?: string | null,
  userId?: string,
  details?: Record<string, unknown>
): void {
  const logData = {
    level: 'info',
    type: 'admin_action',
    timestamp: new Date().toISOString(),
    action,
    url,
    method,
    gymId,
    userId,
    ...details,
  };

  console.info('[Admin Action]', JSON.stringify(logData, null, 2));
  emitMetric('admin_action', { action, url, method, gymId, userId });
}

/**
 * Log gymId mismatch (cross-tenant access attempt)
 */
export function logGymIdMismatch(
  url: string | undefined,
  method: string | undefined,
  tokenGymId: string | null,
  requestGymId: string | null
): void {
  const logData = {
    level: 'error',
    type: 'gymid_mismatch',
    timestamp: new Date().toISOString(),
    url,
    method,
    tokenGymId,
    requestGymId,
    severity: 'critical',
  };

  console.error('[GymId Mismatch]', JSON.stringify(logData, null, 2));
  emitMetric('gymid_mismatch', { url, method, tokenGymId, requestGymId });
  
  // Also log as suspicious activity
  logSuspiciousActivity('Cross-tenant access attempt', {
    url,
    method,
    tokenGymId,
    requestGymId,
  });
}

/**
 * Initialize monitoring (e.g., Sentry)
 * Optional: Can be called in App.tsx to set up error tracking
 */
export function initializeMonitoring(): void {
  // Optional: Initialize Sentry or other monitoring service
  // Example:
  // if (import.meta.env.PROD) {
  //   Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN });
  // }
  
  console.log('[Monitoring] Initialized');
}

