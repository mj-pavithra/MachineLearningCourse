import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getGymIdFromToken, validateToken, getIsAdminFromToken } from '@/utils/jwt';
import { API_BASE_URL, STORAGE_KEYS } from '@/utils/constants';
import { 
  logApiError, 
  logRefreshFailure, 
  logRefreshSuccess, 
  logApiRequest, 
  logApiResponse,
  logSecurityViolation,
  logAuthFailure,
  logAuthzFailure,
  logGymIdMismatch,
  logSuspiciousActivity,
} from '@/utils/monitoring';
import { ApiError, createApiErrorFromAxiosError, ApiResponse } from './types';

// Get API version from environment or default to v1
const API_VERSION = import.meta.env.VITE_API_VERSION || 'v1';
// Get client version from package.json via import.meta or use env var
const CLIENT_VERSION = import.meta.env.VITE_APP_VERSION || '0.1.0';
// Feature flags for optional headers (disable by default if backend CORS doesn't support them)
// Set VITE_ENABLE_VERSION_HEADERS=true in .env to enable when backend supports these headers
const ENABLE_VERSION_HEADERS = import.meta.env.VITE_ENABLE_VERSION_HEADERS === 'true';

/**
 * Axios instance with JWT authentication interceptors
 * Handles token refresh and multi-tenant security
 */

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  maxContentLength: 10 * 1024 * 1024, // 10MB max response size
  maxBodyLength: 10 * 1024 * 1024, // 10MB max request body size
  maxRedirects: 5,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 🔒 CRITICAL SECURITY: Per-gym token refresh state to prevent cross-tenant interference
const refreshStateByGym = new Map<string, {
  isRefreshing: boolean;
  failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
  }>;
}>();

/**
 * Sanitize sensitive data from objects for logging
 * Masks tokens, passwords, and other sensitive information
 */
function sanitizeForLogging(data: any, depth: number = 0): any {
  if (depth > 5) return '[Max depth reached]'; // Prevent infinite recursion
  if (data === null || data === undefined) return data;
  
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => sanitizeForLogging(item, depth + 1));
  }
  
  // Handle objects
  if (typeof data === 'object') {
    const sanitized: any = {};
    const sensitiveKeys = [
      'password', 'passwd', 'pwd', 'secret', 'token', 'auth', 'authorization',
      'x-auth-token', 'refresh-token', 'api-key', 'apikey', 'api_key',
      'access-token', 'accessToken', 'idToken', 'id_token', 'jwt',
      'creditCard', 'credit-card', 'cvv', 'ssn', 'social-security',
      'bankAccount', 'bank-account', 'routing', 'pin', 'otp'
    ];
    
    for (const key in data) {
      const lowerKey = key.toLowerCase();
      const isSensitive = sensitiveKeys.some(sk => lowerKey.includes(sk));
      
      if (isSensitive) {
        const value = data[key];
        if (typeof value === 'string' && value.length > 0) {
          // Show first 4 and last 4 characters for tokens
          if (value.length > 8) {
            sanitized[key] = `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
          } else {
            sanitized[key] = '***';
          }
        } else {
          sanitized[key] = '***';
        }
      } else {
        sanitized[key] = sanitizeForLogging(data[key], depth + 1);
      }
    }
    return sanitized;
  }
  
  return data;
}

/**
 * Sanitize headers for logging
 */
function sanitizeHeaders(headers: any): any {
  if (!headers || typeof headers !== 'object') return headers;
  
  const sanitized: any = {};
  const sensitiveHeaders = [
    'x-auth-token', 'authorization', 'x-api-key', 'api-key',
    'cookie', 'set-cookie', 'x-csrf-token'
  ];
  
  for (const key in headers) {
    const lowerKey = key.toLowerCase();
    if (sensitiveHeaders.includes(lowerKey)) {
      const value = headers[key];
      if (typeof value === 'string' && value.length > 8) {
        sanitized[key] = `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
      } else {
        sanitized[key] = '***';
      }
    } else {
      sanitized[key] = headers[key];
    }
  }
  
  return sanitized;
}

const getRefreshState = (gymId: string | null): {
  isRefreshing: boolean;
  failedQueue: Array<{ resolve: (value?: any) => void; reject: (reason?: any) => void }>;
} => {
  if (!gymId) {
    const defaultKey = '__default__';
    if (!refreshStateByGym.has(defaultKey)) {
      refreshStateByGym.set(defaultKey, { isRefreshing: false, failedQueue: [] });
    }
    return refreshStateByGym.get(defaultKey)!;
  }
  
  if (!refreshStateByGym.has(gymId)) {
    refreshStateByGym.set(gymId, { isRefreshing: false, failedQueue: [] });
  }
  return refreshStateByGym.get(gymId)!;
};

const processQueue = (gymId: string | null, error: Error | null, token: string | null = null): void => {
  const state = getRefreshState(gymId);
  for (const prom of state.failedQueue) {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  }
  state.failedQueue = [];
};

/**
 * Calculate exponential backoff delay with jitter
 * @param attempt - Current attempt number (0-indexed)
 * @param baseDelay - Base delay in milliseconds (default: 1000)
 * @returns Delay in milliseconds
 */
function calculateBackoffDelay(attempt: number, baseDelay: number = 1000): number {
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  // Add jitter: random value between 0 and 20% of exponential delay
  const jitter = Math.random() * 0.2 * exponentialDelay;
  return exponentialDelay + jitter;
}

/**
 * Check if HTTP method is idempotent (safe to retry)
 */
function isIdempotentMethod(method?: string): boolean {
  const upperMethod = method?.toUpperCase();
  return upperMethod === 'GET' || upperMethod === 'HEAD' || upperMethod === 'OPTIONS';
}

/**
 * Check if request has idempotency key (safe to retry POST/PUT/DELETE)
 */
function hasIdempotencyKey(config?: InternalAxiosRequestConfig): boolean {
  return !!(config?.headers?.['idempotency-key'] || config?.headers?.['Idempotency-Key']);
}

/**
 * Parse Retry-After header value
 * Returns delay in milliseconds
 */
function parseRetryAfter(retryAfter: string | null | undefined): number | null {
  if (!retryAfter) return null;
  
  const seconds = parseInt(retryAfter, 10);
  if (!isNaN(seconds)) {
    return seconds * 1000; // Convert to milliseconds
  }
  
  // Try parsing as HTTP date (RFC 7231)
  const date = new Date(retryAfter);
  if (!isNaN(date.getTime())) {
    const delay = date.getTime() - Date.now();
    return delay > 0 ? delay : null;
  }
  
  return null;
}

/**
 * List of public endpoints that don't require authentication
 */
const PUBLIC_ENDPOINTS = [
  '/admin/admin-management/login',
  '/admin/admin-management/refresh-token',
  '/admin/admin-management/forgot-password',
  '/admin/admin-management/reset-password',
  '/admin/admin-management/register',
];

/**
 * List of admin-only endpoints (require isAdmin flag)
 * Note: Dashboard is accessible to all authenticated users, not just admins
 * Note: getAllMembers (trainers list) is accessible to all authenticated users
 */
const ADMIN_ONLY_ENDPOINTS = [
  // '/admin/admin-management/getAllMembers', // Removed - accessible to all authenticated users
  '/admin/admin-management/sessions',
  '/admin/admin-management/sessions/revoke',
  '/admin/admin-management/sessions/revoke-all',
  '/admin/admin-management/logout',
  '/admin/admin-management/change-password',
];

/**
 * Check if endpoint is public (doesn't require authentication)
 */
function isPublicEndpoint(url: string | undefined): boolean {
  if (!url) return false;
  return PUBLIC_ENDPOINTS.some(endpoint => 
    url.includes(endpoint) || url.endsWith(endpoint)
  );
}

/**
 * Check if endpoint requires admin role
 */
function isAdminOnlyEndpoint(url: string | undefined): boolean {
  if (!url) return false;
  return ADMIN_ONLY_ENDPOINTS.some(endpoint => url.includes(endpoint)) ||
         url.startsWith('/admin/admin-management/') && 
         !isPublicEndpoint(url);
}

// Request interceptor: Strict token validation, security headers, and authorization checks
axiosInstance.interceptors.request.use(
  async (request) => {
    try {
      // Add security headers to all requests
      // Only add version headers if enabled (backend CORS must allow these headers)
      if (ENABLE_VERSION_HEADERS) {
        request.headers['X-Client-Version'] = CLIENT_VERSION;
        if (API_VERSION) {
          request.headers['API-Version'] = API_VERSION;
        }
      }
      // Note: X-Requested-With header removed to avoid CORS issues
      // Backend CORS configuration doesn't allow custom headers
      // Only standard headers (Content-Type, Accept) are sent

      const isPublic = isPublicEndpoint(request.url);
      const isAdminOnly = isAdminOnlyEndpoint(request.url);
      
      // Get token from localStorage
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      
      // SECURITY: Strict validation for protected endpoints
      if (!isPublic) {
        // Block request if token is missing
        if (!token) {
          const error = new ApiError(
            'Authentication required. Please sign in.',
            401,
            { code: 'AUTH_REQUIRED', url: request.url, method: request.method }
          );
          logSecurityViolation(request.url, request.method, 'Missing token on protected endpoint');
          return Promise.reject(error);
        }

        // Validate token structure and expiration
        const validation = validateToken(token);
        if (!validation.isValid) {
          const reason = validation.isExpired 
            ? 'Token expired' 
            : validation.isMalformed 
            ? 'Token malformed' 
            : validation.error || 'Token validation failed';
          
          logAuthFailure(request.url, request.method, reason);
          
          // Clear invalid token
          localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
          
          // Trigger logout event
          window.dispatchEvent(new CustomEvent('auth:logout'));
          
          const error = new ApiError(
            'Session expired. Please sign in again.',
            401,
            { code: validation.isExpired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN', url: request.url, method: request.method }
          );
          return Promise.reject(error);
        }

        // Extract gymId and isAdmin from validated token
        const gymId = getGymIdFromToken(token);
        const isAdmin = getIsAdminFromToken(token);

        // Debug logging in development mode
        if (import.meta.env.DEV && isAdminOnly) {
          const decoded = validateToken(token).decoded;
          console.debug('[API Client] Admin check:', {
            url: request.url,
            isAdminOnly,
            isAdmin,
            gymId,
            tokenPayload: decoded ? {
              isAdmin: decoded.isAdmin,
              IsAdmin: (decoded as any).IsAdmin,
              is_admin: (decoded as any).is_admin,
              admin: (decoded as any).admin,
              user_type: (decoded as any).user_type,
              allFields: Object.keys(decoded || {}),
            } : 'Token decode failed',
          });
        }

        // SECURITY: Enforce admin role for admin-only endpoints
        if (isAdminOnly && !isAdmin) {
          // Enhanced logging for authorization failures
          if (import.meta.env.DEV) {
            const decoded = validateToken(token).decoded;
            console.warn('[API Client] Admin access denied:', {
              url: request.url,
              method: request.method,
              gymId,
              tokenPayload: decoded ? {
                isAdmin: decoded.isAdmin,
                IsAdmin: (decoded as any).IsAdmin,
                is_admin: (decoded as any).is_admin,
                admin: (decoded as any).admin,
                user_type: (decoded as any).user_type,
                allFields: Object.keys(decoded || {}),
              } : 'Token decode failed',
              extractedIsAdmin: isAdmin,
            });
          }
          
          logAuthzFailure(
            request.url, 
            request.method, 
            'Non-admin user attempted to access admin-only endpoint',
            gymId
          );
          
          const error = new ApiError(
            'Access denied. Admin privileges required.',
            403,
            { code: 'FORBIDDEN', url: request.url, method: request.method, gymId }
          );
          return Promise.reject(error);
        }

        // Set auth token header
        request.headers['x-auth-token'] = token;

        // SECURITY: Strictly enforce gymId validation for multi-tenant endpoints
        if (!gymId) {
          logSecurityViolation(
            request.url, 
            request.method, 
            'Token missing gymId on protected endpoint'
          );
          // Log as suspicious activity
          logSuspiciousActivity(
            'Token missing gymId',
            { url: request.url, method: request.method },
            null
          );
          // Don't block - let server handle it, but log the violation
        } else {
          // Add gym-id header for multi-tenant endpoints that need it
          const needsGymIdHeader = request.url?.includes('/packages/get-all') ||
                                   request.url?.includes('/equipments') ||
                                   request.url?.includes('/customers') ||
                                   request.url?.includes('/sessions') ||
                                   request.url?.includes('/clientsPayment') ||
                                   request.url?.includes('/api/groups');
          if (needsGymIdHeader) {
            request.headers['gym-id'] = gymId;
            
            // SECURITY: Validate gymId consistency if request has gym-id in body/params
            // This prevents cross-tenant data access attempts
            if (request.data && typeof request.data === 'object') {
              const requestGymId = (request.data as any).gymId;
              if (requestGymId && requestGymId !== gymId) {
                logGymIdMismatch(request.url, request.method, gymId, requestGymId);
                const error = new ApiError(
                  'Gym ID mismatch detected. Access denied.',
                  403,
                  { code: 'GYMID_MISMATCH', url: request.url, method: request.method, gymId }
                );
                return Promise.reject(error);
              }
            }
          }
        }
      } else {
        // For public endpoints, still try to extract gymId if token exists (for logging)
        const gymId = token ? getGymIdFromToken(token) : null;
        if (request.url && request.method) {
          logApiRequest(request.url, request.method, gymId);
        }
      }

      // Extract gymId for logging
      const gymId = token ? getGymIdFromToken(token) : null;
      
      // Store request start time for duration calculation
      (request as any)._requestStartTime = Date.now();
      
      // Comprehensive request logging
      if (request.url && request.method) {
        const fullUrl = request.baseURL 
          ? `${request.baseURL}${request.url}` 
          : request.url;
        
        const requestLog: any = {
          type: 'API_REQUEST',
          timestamp: new Date().toISOString(),
          url: fullUrl,
          method: request.method,
          baseURL: request.baseURL,
          path: request.url,
          headers: sanitizeHeaders(request.headers),
          params: request.params,
          data: sanitizeForLogging(request.data),
          gymId,
          isPublic,
          isAdminOnly,
        };
        
        // Log to console
        console.log('[API Request]', requestLog);
        
        // Also call existing logging function for compatibility
        logApiRequest(request.url, request.method, gymId);
      }

      return request;
    } catch (error) {
      console.error('[Axios Request Interceptor] Error:', error);
      if (error instanceof ApiError) {
        return Promise.reject(error);
      }
      return request;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Handle 401 errors, token refresh, rate limiting, and retries
axiosInstance.interceptors.response.use(
  (response) => {
    // Calculate request duration
    const requestStartTime = (response.config as any)._requestStartTime;
    const duration = requestStartTime ? Date.now() - requestStartTime : null;
    
    // Comprehensive response logging
    if (response.config.url && response.config.method) {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const gymId = token ? getGymIdFromToken(token) : null;
      
      const fullUrl = response.config.baseURL 
        ? `${response.config.baseURL}${response.config.url}` 
        : response.config.url;
      
      const responseLog: any = {
        type: 'API_RESPONSE',
        timestamp: new Date().toISOString(),
        url: fullUrl,
        method: response.config.method,
        status: response.status,
        statusText: response.statusText,
        headers: sanitizeHeaders(response.headers),
        data: sanitizeForLogging(response.data),
        duration: duration ? `${duration}ms` : null,
        gymId,
      };
      
      // Log to console
      console.log('[API Response]', responseLog);
      
      // Also call existing logging function for compatibility
      logApiResponse(response.config.url, response.config.method, response.status, gymId);
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { 
      _retry?: boolean;
      _retryCount?: number;
      _retryDelay?: number;
    };

    // Calculate request duration for error logging
    const requestStartTime = originalRequest ? (originalRequest as any)._requestStartTime : null;
    const duration = requestStartTime ? Date.now() - requestStartTime : null;
    
    // Comprehensive error logging
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;
    
    const errorLog: any = {
      type: 'API_ERROR',
      timestamp: new Date().toISOString(),
      url: originalRequest?.url 
        ? (originalRequest.baseURL 
          ? `${originalRequest.baseURL}${originalRequest.url}` 
          : originalRequest.url)
        : 'Unknown',
      method: originalRequest?.method || 'Unknown',
      status: error.response?.status || null,
      statusText: error.response?.statusText || null,
      message: error.message,
      code: error.code,
      requestHeaders: originalRequest ? sanitizeHeaders(originalRequest.headers) : null,
      requestData: originalRequest ? sanitizeForLogging(originalRequest.data) : null,
      requestParams: originalRequest?.params || null,
      responseHeaders: error.response ? sanitizeHeaders(error.response.headers) : null,
      responseData: error.response ? sanitizeForLogging(error.response.data) : null,
      duration: duration ? `${duration}ms` : null,
      gymId,
      isNetworkError: !error.response,
      isTimeout: error.code === 'ECONNABORTED',
    };
    
    // Log to console
    console.error('[API Error]', errorLog);
    
    // Handle HTML responses (wrong endpoint)
    const resData = error.response?.data;
    if (resData && typeof resData === 'string' && resData.includes('<!DOCTYPE html>')) {
      return Promise.reject(new Error('Invalid API endpoint or baseURL misconfigured'));
    }

    // Handle 429 Too Many Requests with Retry-After
    if (error.response?.status === 429 && originalRequest) {
      const retryAfter = error.response.headers['retry-after'];
      const delay = parseRetryAfter(retryAfter);
      
      // Only retry if method is idempotent or has idempotency key
      const canRetry = isIdempotentMethod(originalRequest.method) || 
                      hasIdempotencyKey(originalRequest);
      
      if (canRetry && delay && delay > 0 && delay < 60000) { // Max 60 seconds
        await new Promise(resolve => setTimeout(resolve, delay));
        return axiosInstance(originalRequest);
      }
      
      // If can't retry or delay too long, reject with rate limit error
      throw new Error(`Rate limit exceeded. ${retryAfter ? `Retry after ${retryAfter} seconds` : 'Please try again later.'}`);
    }

    // Handle network errors with exponential backoff for idempotent requests
    if (!error.response && originalRequest && isIdempotentMethod(originalRequest.method)) {
      const retryCount = originalRequest._retryCount || 0;
      const maxRetries = 3;
      
      if (retryCount < maxRetries) {
        originalRequest._retryCount = retryCount + 1;
        const delay = calculateBackoffDelay(retryCount);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return axiosInstance(originalRequest);
      }
    }

    // Handle 401 Unauthorized - attempt token refresh
    if (error.response?.status === 401 && originalRequest) {
      const originalToken = originalRequest.headers?.['x-auth-token'] as string | undefined;
      const requestGymId = originalToken ? getGymIdFromToken(originalToken) : null;
      const refreshState = getRefreshState(requestGymId);

      // Prevent infinite retry loops
      if (originalRequest._retry) {
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        if (requestGymId) {
          refreshStateByGym.delete(requestGymId);
        }
        // Trigger logout by dispatching event
        window.dispatchEvent(new CustomEvent('auth:logout'));
        return Promise.reject(error);
      }

      // If already refreshing for this gym, queue this request
      if (refreshState.isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshState.failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers['x-auth-token'] = token as string;
            }
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            throw err;
          });
      }

      originalRequest._retry = true;
      refreshState.isRefreshing = true;

      try {
        const refreshTokenValue = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        if (!refreshTokenValue) {
          throw new Error('No refresh token available');
        }

        // Call refresh endpoint
        const refreshResponse = await axios.post<{
          status: 'SUCCESS' | 'FAIL';
          message: string;
          data?: {
            idToken: string;
            refreshToken?: string;
          };
        }>(`${API_BASE_URL}/admin/admin-management/refresh-token`, {
          refreshToken: refreshTokenValue,
        });

        if (refreshResponse.data.status === 'SUCCESS' && refreshResponse.data.data?.idToken) {
          const newToken = refreshResponse.data.data.idToken;
          const newRefreshToken = refreshResponse.data.data.refreshToken || refreshTokenValue;
          
          // SECURITY: Extract gymId from new token
          const newTokenGymId = getGymIdFromToken(newToken);
          
          if (!newTokenGymId) {
            const error = new Error('Refreshed token missing gymId');
            logRefreshFailure(requestGymId, error);
            throw error;
          }

          // SECURITY: Validate gymId matches
          if (requestGymId && newTokenGymId !== requestGymId) {
            const error = new Error('GymId mismatch during token refresh');
            logRefreshFailure(requestGymId, error);
            throw error;
          }

          // SECURITY: Token rotation - store new tokens and optionally revoke old refresh token
          localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, newToken);
          // Only update refresh token if a new one is provided (token rotation)
          if (refreshResponse.data.data?.refreshToken && refreshResponse.data.data.refreshToken !== refreshTokenValue) {
            localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshResponse.data.data.refreshToken);
          } else if (newRefreshToken) {
            localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
          }

          // Update request headers
          if (originalRequest.headers) {
            originalRequest.headers['x-auth-token'] = newToken;
          }

          // Log successful refresh
          logRefreshSuccess(requestGymId);

          // Process queued requests
          processQueue(requestGymId, null, newToken);

          // Retry original request
          return axiosInstance(originalRequest);
        } else {
          const error = new Error(refreshResponse.data.message || 'Token refresh failed');
          logRefreshFailure(requestGymId, error);
          throw error;
        }
      } catch (refreshError) {
        // Refresh failed - clear auth and trigger logout
        const error = refreshError instanceof Error ? refreshError : new Error(String(refreshError));
        logRefreshFailure(requestGymId, error);
        processQueue(requestGymId, error);
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        if (requestGymId) {
          refreshStateByGym.delete(requestGymId);
        }
        window.dispatchEvent(new CustomEvent('auth:logout'));
        return Promise.reject(refreshError);
      } finally {
        refreshState.isRefreshing = false;
      }
    }

    // Note: token and gymId already extracted above for error logging
    
    // Create ApiError for consistent error handling
    const apiError = createApiErrorFromAxiosError(error as AxiosError<ApiResponse<unknown>, any>, gymId);
    
    // Log API error (also call existing logging function for compatibility)
    logApiError(apiError, {
      url: originalRequest?.url,
      method: originalRequest?.method,
      status: error.response?.status,
      responseData: error.response ? sanitizeForLogging(error.response.data) : null,
    });

    return Promise.reject(apiError);
  }
);

export default axiosInstance;


