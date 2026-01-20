import axiosInstance from './client';
import {
  PTSession,
  FetchSessionsParams,
  CreateSessionDto,
  CreateExtraSessionDto,
} from '@/types/session';
import { ApiResponse, ApiError, validateApiResponse, createApiErrorFromAxiosError } from './types';
import { getGymIdFromToken } from '@/utils/jwt';
import { STORAGE_KEYS } from '@/utils/constants';

export interface SessionsListResponse {
  items: PTSession[];
  total: number;
  page?: number;
  size?: number;
}

/**
 * Sessions API service
 * 
 * @module SessionsAPI
 */

/**
 * Fetches a list of PT sessions with optional filtering and pagination
 * 
 * @endpoint GET /sessions/get-all
 * @method GET
 * @requires Authentication Yes (x-auth-token header)
 * 
 * @param {FetchSessionsParams} params - Query parameters:
 *   - page?: number - Page number
 *   - size?: number - Page size
 *   - trainerId?: string - Filter by trainer ID
 *   - clientId?: string - Filter by client ID
 *   - startDate?: string - Filter by start date
 *   - endDate?: string - Filter by end date
 *   - status?: string - Filter by session status
 * 
 * @returns {Promise<SessionsListResponse>} Paginated list of sessions
 * 
 * @throws {ApiError} If fetch fails
 */
export async function fetchSessions(
  params: FetchSessionsParams = {}
): Promise<SessionsListResponse> {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    // Map frontend params to backend params
    const backendParams: any = {
      page: params.page || 1,
      size: params.size || 20,
    };
    
    if (params.searchTerm) {
      backendParams.searchTerm = params.searchTerm;
    }

    const res = await axiosInstance.get<ApiResponse<SessionsListResponse | PTSession[] | any>>(
      '/sessions/get-all',
      { params: backendParams }
    );

    const data = validateApiResponse(res.data, '/sessions/get-all', 'GET', gymId);
    
    // Handle different response structures
    if (Array.isArray(data)) {
      return {
        items: data,
        total: data.length,
        page: params.page || 1,
        size: params.size || 20,
      };
    }

    // Backend may return array directly or wrapped in response
    const response = data as any;
    if (response.sessions) {
      return {
        items: response.sessions,
        total: response.total || response.totalCount || response.sessions.length,
        page: response.page || params.page || 1,
        size: response.size || params.size || 20,
      };
    }

    return data as SessionsListResponse;
  } catch (error: any) {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    if (error?.response) {
      throw createApiErrorFromAxiosError(error, gymId);
    }

    throw new ApiError(
      error?.message || 'Failed to fetch sessions',
      500,
      { url: '/sessions/get-all', method: 'GET', gymId }
    );
  }
}

/**
 * Fetches a single session by ID
 * 
 * @endpoint GET /sessions/{id}
 * @method GET
 * @requires Authentication Yes (x-auth-token header)
 * 
 * @param {string} id - Session ID
 * @returns {Promise<PTSession>} Session data
 * 
 * @throws {ApiError} If session not found (404) or other error occurs
 */
export async function fetchSessionById(id: string): Promise<PTSession> {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    const res = await axiosInstance.get<ApiResponse<PTSession>>(`/sessions/${id}`);

    return validateApiResponse(res.data, `/sessions/${id}`, 'GET', gymId);
  } catch (error: any) {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    if (error?.response) {
      throw createApiErrorFromAxiosError(error, gymId);
    }

    throw new ApiError(
      error?.message || 'Failed to fetch session',
      500,
      { url: `/sessions/${id}`, method: 'GET', gymId }
    );
  }
}

/**
 * Creates a new PT session
 * 
 * @endpoint POST /sessions/create
 * @method POST
 * @requires Authentication Yes (x-auth-token header)
 * 
 * @param {CreateSessionDto} payload - Session data to create
 * @returns {Promise<PTSession>} Created session data
 * 
 * @throws {ApiError} If creation fails
 */
export async function createSession(payload: CreateSessionDto): Promise<PTSession> {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    // Backend expects: customerId, customerName, trainerId, trainerName
    const backendPayload = {
      customerId: payload.customerId,
      customerName: payload.customerName,
      trainerId: payload.trainerId,
      trainerName: payload.trainerName,
    };

    const res = await axiosInstance.post<ApiResponse<PTSession>>('/sessions/create', backendPayload);

    return validateApiResponse(res.data, '/sessions/create', 'POST', gymId);
  } catch (error: any) {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    if (error?.response) {
      throw createApiErrorFromAxiosError(error, gymId);
    }

    throw new ApiError(
      error?.message || 'Failed to create session',
      500,
      { url: '/sessions/create', method: 'POST', gymId }
    );
  }
}

/**
 * Creates an extra PT session
 * 
 * @endpoint POST /sessions/extra
 * @method POST
 * @requires Authentication Yes (x-auth-token header)
 * 
 * @param {CreateExtraSessionDto} payload - Extra session data to create
 * @returns {Promise<PTSession>} Created extra session data
 * 
 * @throws {ApiError} If creation fails
 */
export async function createExtraSession(payload: CreateExtraSessionDto): Promise<PTSession> {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    const res = await axiosInstance.post<ApiResponse<PTSession>>('/sessions/extra', payload);

    return validateApiResponse(res.data, '/sessions/extra', 'POST', gymId);
  } catch (error: any) {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    if (error?.response) {
      throw createApiErrorFromAxiosError(error, gymId);
    }

    throw new ApiError(
      error?.message || 'Failed to create extra session',
      500,
      { url: '/sessions/extra', method: 'POST', gymId }
    );
  }
}

/**
 * Updates an existing session
 * 
 * @endpoint PATCH /sessions/{id}
 * @method PATCH
 * @requires Authentication Yes (x-auth-token header)
 * 
 * @param {string} id - Session ID
 * @param {Partial<PTSession>} payload - Session data to update
 * @returns {Promise<PTSession>} Updated session data
 * 
 * @throws {ApiError} If update fails
 */
export async function updateSession(
  id: string,
  payload: Partial<PTSession>
): Promise<PTSession> {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    const res = await axiosInstance.patch<ApiResponse<PTSession>>(`/sessions/${id}`, payload);

    return validateApiResponse(res.data, `/sessions/${id}`, 'PATCH', gymId);
  } catch (error: any) {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    if (error?.response) {
      throw createApiErrorFromAxiosError(error, gymId);
    }

    throw new ApiError(
      error?.message || 'Failed to update session',
      500,
      { url: `/sessions/${id}`, method: 'PATCH', gymId }
    );
  }
}

/**
 * Deletes a session
 * 
 * @endpoint DELETE /sessions/delete
 * @method DELETE
 * @requires Authentication Yes (x-auth-token header)
 * 
 * @param {string[]} sessionIds - Array of session IDs to delete
 * @returns {Promise<boolean>} True if deletion successful
 * 
 * @throws {ApiError} If deletion fails
 */
export async function deleteSessions(sessionIds: string[]): Promise<boolean> {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    // Backend expects: DELETE /sessions/delete?ids=id1,id2
    const idsParam = sessionIds.join(',');
    const res = await axiosInstance.delete<ApiResponse<null>>('/sessions/delete', {
      params: { ids: idsParam },
    });

    validateApiResponse(res.data, '/sessions/delete', 'DELETE', gymId);
    return true;
  } catch (error: any) {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    if (error?.response) {
      throw createApiErrorFromAxiosError(error, gymId);
    }

    throw new ApiError(
      error?.message || 'Failed to delete sessions',
      500,
      { url: '/sessions/delete', method: 'DELETE', gymId }
    );
  }
}

/**
 * Marks attendance for a session
 * 
 * @endpoint PATCH /sessions/mark-attended
 * @method PATCH
 * @requires Authentication Yes (x-auth-token header)
 * 
 * @param {string} id - Session ID
 * @param {{ attendance: 'attended' | 'missed' | 'cancelled' }} payload - Attendance status
 * @returns {Promise<PTSession>} Updated session data with attendance marked
 * 
 * @throws {ApiError} If marking attendance fails
 */
export async function markAttendance(
  id: string,
  payload?: { trainerId?: string; customerId?: string }
): Promise<PTSession> {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    // Backend expects: trainerId, sessionId, customerId (optional)
    const backendPayload: any = {
      sessionId: id,
    };
    
    if (payload?.trainerId) {
      backendPayload.trainerId = payload.trainerId;
    }
    
    if (payload?.customerId) {
      backendPayload.customerId = payload.customerId;
    }

    const res = await axiosInstance.patch<ApiResponse<PTSession>>(
      '/sessions/mark-attended',
      backendPayload
    );

    return validateApiResponse(res.data, '/sessions/mark-attended', 'PATCH', gymId);
  } catch (error: any) {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    if (error?.response) {
      throw createApiErrorFromAxiosError(error, gymId);
    }

    throw new ApiError(
      error?.message || 'Failed to mark attendance',
      500,
      { url: '/sessions/mark-attended', method: 'PATCH', gymId }
    );
  }
}

/**
 * Cancel a session
 * 
 * @endpoint PATCH /sessions/cancel/{id}
 * @method PATCH
 * @requires Authentication Yes (x-auth-token header)
 * 
 * @param {string} id - Session ID
 * @returns {Promise<PTSession>} Cancelled session data
 * 
 * @throws {ApiError} If cancellation fails
 */
export async function cancelSession(id: string): Promise<PTSession> {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    const res = await axiosInstance.patch<ApiResponse<PTSession>>(
      `/sessions/cancel/${id}`
    );

    return validateApiResponse(res.data, `/sessions/cancel/${id}`, 'PATCH', gymId);
  } catch (error: any) {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    if (error?.response) {
      throw createApiErrorFromAxiosError(error, gymId);
    }

    throw new ApiError(
      error?.message || 'Failed to cancel session',
      500,
      { url: `/sessions/cancel/${id}`, method: 'PATCH', gymId }
    );
  }
}
