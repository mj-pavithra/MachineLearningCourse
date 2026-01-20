import axiosInstance from './client';
import { ApiResponse, ApiError, validateApiResponse, createApiErrorFromAxiosError } from './types';
import { getGymIdFromToken } from '@/utils/jwt';
import { STORAGE_KEYS } from '@/utils/constants';

/**
 * Session Management API service
 * Handles active session management, revocation, and logout
 * 
 * @module SessionsManagementAPI
 */

export interface ActiveSession {
  tokenId: string;
  userAgent?: string;
  ipAddress?: string;
  createdAt: string;
  lastActivity: string;
  isCurrent: boolean;
}

export interface ActiveSessionsResponse {
  sessions: ActiveSession[];
  total: number;
}

/**
 * Get all active sessions for the current user
 * 
 * @endpoint GET /admin/admin-management/sessions
 * @method GET
 * @requires Authentication Yes (x-auth-token header)
 * @requires Admin Yes (admin-only endpoint)
 * 
 * @returns {Promise<ActiveSessionsResponse>} List of active sessions
 * 
 * @throws {ApiError} If fetch fails or user is not admin
 * 
 * @example
 * ```typescript
 * const sessions = await getActiveSessions();
 * console.log(sessions.total); // number of active sessions
 * ```
 */
export async function getActiveSessions(): Promise<ActiveSessionsResponse> {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    const response = await axiosInstance.get<ApiResponse<ActiveSessionsResponse>>(
      '/admin/admin-management/sessions'
    );

    return validateApiResponse(response.data, '/admin/admin-management/sessions', 'GET', gymId);
  } catch (error: any) {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    if (error?.response) {
      throw createApiErrorFromAxiosError(error, gymId);
    }

    throw new ApiError(
      error?.message || 'Failed to fetch active sessions',
      500,
      { url: '/admin/admin-management/sessions', method: 'GET', gymId }
    );
  }
}

/**
 * Revoke a specific session by token ID
 * 
 * @endpoint POST /admin/admin-management/sessions/{tokenId}/revoke
 * @method POST
 * @requires Authentication Yes (x-auth-token header)
 * @requires Admin Yes (admin-only endpoint)
 * 
 * @param {string} tokenId - Token ID of the session to revoke
 * @returns {Promise<boolean>} True if revocation successful
 * 
 * @throws {ApiError} If revocation fails or user is not admin
 * 
 * @example
 * ```typescript
 * await revokeSession('token-id-123');
 * ```
 */
export async function revokeSession(tokenId: string): Promise<boolean> {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    const response = await axiosInstance.post<ApiResponse<null>>(
      `/admin/admin-management/sessions/${tokenId}/revoke`
    );

    validateApiResponse(response.data, `/admin/admin-management/sessions/${tokenId}/revoke`, 'POST', gymId);
    return true;
  } catch (error: any) {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    if (error?.response) {
      throw createApiErrorFromAxiosError(error, gymId);
    }

    throw new ApiError(
      error?.message || 'Failed to revoke session',
      500,
      { url: `/admin/admin-management/sessions/${tokenId}/revoke`, method: 'POST', gymId }
    );
  }
}

/**
 * Revoke all sessions for the current user
 * 
 * @endpoint POST /admin/admin-management/sessions/revoke-all
 * @method POST
 * @requires Authentication Yes (x-auth-token header)
 * @requires Admin Yes (admin-only endpoint)
 * 
 * @returns {Promise<boolean>} True if revocation successful
 * 
 * @throws {ApiError} If revocation fails or user is not admin
 * 
 * @example
 * ```typescript
 * await revokeAllSessions();
 * // All sessions (including current) will be revoked
 * ```
 */
export async function revokeAllSessions(): Promise<boolean> {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    const response = await axiosInstance.post<ApiResponse<null>>(
      '/admin/admin-management/sessions/revoke-all'
    );

    validateApiResponse(response.data, '/admin/admin-management/sessions/revoke-all', 'POST', gymId);
    return true;
  } catch (error: any) {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    if (error?.response) {
      throw createApiErrorFromAxiosError(error, gymId);
    }

    throw new ApiError(
      error?.message || 'Failed to revoke all sessions',
      500,
      { url: '/admin/admin-management/sessions/revoke-all', method: 'POST', gymId }
    );
  }
}

