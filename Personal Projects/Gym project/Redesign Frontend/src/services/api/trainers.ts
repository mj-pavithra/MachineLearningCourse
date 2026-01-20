import axiosInstance from './client';
import { Trainer } from '@/types/trainer';
import { ApiResponse, ApiError, validateApiResponse, createApiErrorFromAxiosError } from './types';
import { getGymIdFromToken } from '@/utils/jwt';
import { STORAGE_KEYS } from '@/utils/constants';

export interface FetchTrainersParams {
  page?: number;
  size?: number;
  search?: string;
  type?: 'part-time' | 'full-time';
  status?: 'active' | 'inactive';
}

export interface TrainersListResponse {
  items: Trainer[];
  total: number;
  page?: number;
  size?: number;
}

/**
 * Trainers API service
 * 
 * @module TrainersAPI
 */

/**
 * Fetches a list of trainers with optional filtering and pagination
 * 
 * @endpoint GET /admin/admin-management/getAllMembers
 * @method GET
 * @requires Authentication Yes (x-auth-token header)
 * 
 * @param {FetchTrainersParams} params - Query parameters:
 *   - page?: number - Page number (default: 1)
 *   - size?: number - Page size (default: 20)
 *   - search?: string - Search query
 *   - type?: 'part-time' | 'full-time' - Filter by trainer type
 *   - status?: 'active' | 'inactive' - Filter by status
 * 
 * @returns {Promise<TrainersListResponse>} Paginated list of trainers
 * 
 * @throws {ApiError} If fetch fails
 * 
 * @example
 * ```typescript
 * const trainers = await fetchTrainers({ page: 1, size: 20, type: 'full-time' });
 * console.log(trainers.items.length); // number of trainers on this page
 * ```
 */
export async function fetchTrainers(
  params: FetchTrainersParams = { page: 1, size: 20 }
): Promise<TrainersListResponse> {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    const res = await axiosInstance.get<ApiResponse<TrainersListResponse | Trainer[]>>(
      '/admin/admin-management/getAllMembers',
      { params }
    );

    const data = validateApiResponse(res.data, '/admin/admin-management/getAllMembers', 'GET', gymId);
    
    // Handle different response structures
    if (Array.isArray(data)) {
      return {
        items: data,
        total: data.length,
        page: params.page || 1,
        size: params.size || 20,
      };
    }

    return data as TrainersListResponse;
  } catch (error: any) {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    if (error?.response) {
      throw createApiErrorFromAxiosError(error, gymId);
    }

    throw new ApiError(
      error?.message || 'Failed to fetch trainers',
      500,
      { url: '/admin/admin-management/getAllMembers', method: 'GET', gymId }
    );
  }
}

/**
 * Fetches a single trainer by ID
 * 
 * @endpoint GET /admin/admin-management/{id}
 * @method GET
 * @requires Authentication Yes (x-auth-token header)
 * 
 * @param {string} id - Trainer ID
 * @returns {Promise<Trainer>} Trainer data
 * 
 * @throws {ApiError} If trainer not found (404) or other error occurs
 */
export async function fetchTrainerById(id: string): Promise<Trainer> {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    const res = await axiosInstance.get<ApiResponse<Trainer>>(`/admin/admin-management/${id}`);

    return validateApiResponse(res.data, `/admin/admin-management/${id}`, 'GET', gymId);
  } catch (error: any) {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    if (error?.response) {
      throw createApiErrorFromAxiosError(error, gymId);
    }

    throw new ApiError(
      error?.message || 'Failed to fetch trainer',
      500,
      { url: `/admin/admin-management/${id}`, method: 'GET', gymId }
    );
  }
}

/**
 * Creates a new trainer
 * 
 * @endpoint POST /admin/admin-management/create
 * @method POST
 * @requires Authentication Yes (x-auth-token header)
 * 
 * @param {Partial<Trainer>} payload - Trainer data to create
 * @returns {Promise<Trainer>} Created trainer data
 * 
 * @throws {ApiError} If creation fails
 */
export async function createTrainer(payload: Partial<Trainer>): Promise<Trainer> {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    const res = await axiosInstance.post<ApiResponse<Trainer>>(
      '/admin/admin-management/create',
      payload
    );

    return validateApiResponse(res.data, '/admin/admin-management/create', 'POST', gymId);
  } catch (error: any) {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    if (error?.response) {
      throw createApiErrorFromAxiosError(error, gymId);
    }

    throw new ApiError(
      error?.message || 'Failed to create trainer',
      500,
      { url: '/admin/admin-management/create', method: 'POST', gymId }
    );
  }
}

/**
 * Updates an existing trainer
 * 
 * @endpoint PUT /admin/admin-management/update/{id}
 * @method PUT
 * @requires Authentication Yes (x-auth-token header)
 * 
 * @param {string} id - Trainer ID
 * @param {Partial<Trainer>} payload - Trainer data to update
 * @returns {Promise<Trainer>} Updated trainer data
 * 
 * @throws {ApiError} If update fails
 */
export async function updateTrainer(id: string, payload: Partial<Trainer>): Promise<Trainer> {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    const res = await axiosInstance.put<ApiResponse<Trainer>>(
      `/admin/admin-management/update/${id}`,
      payload
    );

    return validateApiResponse(res.data, `/admin/admin-management/update/${id}`, 'PUT', gymId);
  } catch (error: any) {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    if (error?.response) {
      throw createApiErrorFromAxiosError(error, gymId);
    }

    throw new ApiError(
      error?.message || 'Failed to update trainer',
      500,
      { url: `/admin/admin-management/update/${id}`, method: 'PUT', gymId }
    );
  }
}

/**
 * Deletes a trainer
 * 
 * @endpoint DELETE /admin/admin-management/delete/{id}
 * @method DELETE
 * @requires Authentication Yes (x-auth-token header)
 * 
 * @param {string} id - Trainer ID
 * @returns {Promise<boolean>} True if deletion successful
 * 
 * @throws {ApiError} If deletion fails
 */
export async function deleteTrainer(id: string): Promise<boolean> {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    const res = await axiosInstance.delete<ApiResponse<null>>(
      `/admin/admin-management/delete/${id}`
    );

    validateApiResponse(res.data, `/admin/admin-management/delete/${id}`, 'DELETE', gymId);
    return true;
  } catch (error: any) {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    if (error?.response) {
      throw createApiErrorFromAxiosError(error, gymId);
    }

    throw new ApiError(
      error?.message || 'Failed to delete trainer',
      500,
      { url: `/admin/admin-management/delete/${id}`, method: 'DELETE', gymId }
    );
  }
}

