import axiosInstance from './client';
import { Equipment, CreateEquipmentDto, UpdateEquipmentDto } from '@/types/equipment';
import { ApiResponse, ApiError, validateApiResponse, createApiErrorFromAxiosError } from './types';
import { getGymIdFromToken } from '@/utils/jwt';
import { STORAGE_KEYS } from '@/utils/constants';

export interface FetchEquipmentParams {
  page?: number;
  size?: number; // Backend uses 'limit', but we'll map it
  search?: string;
  type?: string;
  status?: string;
  locationRoom?: string;
  locationZone?: string;
}

export interface EquipmentListResponse {
  items: Equipment[];
  total: number;
  page?: number;
  size?: number;
}

/**
 * Equipment API service
 * 
 * @module EquipmentAPI
 */

/**
 * Fetches a list of equipment with optional filtering and pagination
 * 
 * @endpoint GET /equipments
 * @method GET
 * @requires Authentication Yes (x-auth-token header, gym-id header)
 * 
 * @param {FetchEquipmentParams} params - Query parameters:
 *   - page?: number - Page number (default: 1)
 *   - size?: number - Page size (default: 20)
 *   - search?: string - Search query
 *   - type?: string - Filter by equipment type
 *   - status?: string - Filter by status
 * 
 * @returns {Promise<EquipmentListResponse>} Paginated list of equipment
 * 
 * @throws {ApiError} If fetch fails
 */
export async function fetchEquipment(
  params: FetchEquipmentParams = { page: 1, size: 20 }
): Promise<EquipmentListResponse> {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    // Map frontend params to backend params (size -> limit)
    const backendParams: any = {
      page: params.page || 1,
      limit: params.size || 20,
    };
    if (params.search) backendParams.search = params.search;
    if (params.type) backendParams.type = params.type;
    if (params.status) backendParams.status = params.status;
    if (params.locationRoom) backendParams.locationRoom = params.locationRoom;
    if (params.locationZone) backendParams.locationZone = params.locationZone;

    const res = await axiosInstance.get<ApiResponse<EquipmentListResponse | Equipment[]>>(
      '/equipments',
      { params: backendParams }
    );

    const data = validateApiResponse(res.data, '/equipments', 'GET', gymId);
    
    // Handle different response structures
    if (Array.isArray(data)) {
      return {
        items: data,
        total: data.length,
        page: params.page || 1,
        size: params.size || 20,
      };
    }

    // Backend returns { equipments, total, page, limit }
    const response = data as any;
    if (response.equipments) {
      return {
        items: response.equipments,
        total: response.total || response.equipments.length,
        page: response.page || params.page || 1,
        size: response.limit || params.size || 20,
      };
    }

    return data as EquipmentListResponse;
  } catch (error: any) {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    if (error?.response) {
      throw createApiErrorFromAxiosError(error, gymId);
    }

    throw new ApiError(
      error?.message || 'Failed to fetch equipment',
      500,
      { url: '/equipments', method: 'GET', gymId }
    );
  }
}

/**
 * Fetches a single equipment item by ID
 * 
 * @endpoint GET /equipments/{id}
 * @method GET
 * @requires Authentication Yes (x-auth-token header)
 * 
 * @param {string} id - Equipment ID
 * @returns {Promise<Equipment>} Equipment data
 * 
 * @throws {ApiError} If equipment not found (404) or other error occurs
 */
export async function fetchEquipmentById(id: string): Promise<Equipment> {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    const res = await axiosInstance.get<ApiResponse<Equipment>>(`/equipments/${id}`);

    return validateApiResponse(res.data, `/equipments/${id}`, 'GET', gymId);
  } catch (error: any) {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    if (error?.response) {
      throw createApiErrorFromAxiosError(error, gymId);
    }

    throw new ApiError(
      error?.message || 'Failed to fetch equipment',
      500,
      { url: `/equipments/${id}`, method: 'GET', gymId }
    );
  }
}

/**
 * Creates a new equipment item
 * 
 * @endpoint POST /equipments
 * @method POST
 * @requires Authentication Yes (x-auth-token header, gym-id header)
 * 
 * @param {CreateEquipmentDto} payload - Equipment data to create
 * @returns {Promise<Equipment>} Created equipment data
 * 
 * @throws {ApiError} If creation fails
 */
export async function createEquipment(payload: CreateEquipmentDto): Promise<Equipment> {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    const res = await axiosInstance.post<ApiResponse<Equipment>>('/equipments', payload);

    return validateApiResponse(res.data, '/equipments', 'POST', gymId);
  } catch (error: any) {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    if (error?.response) {
      throw createApiErrorFromAxiosError(error, gymId);
    }

    throw new ApiError(
      error?.message || 'Failed to create equipment',
      500,
      { url: '/equipments', method: 'POST', gymId }
    );
  }
}

/**
 * Updates an existing equipment item
 * 
 * @endpoint PATCH /equipments/{id}
 * @method PATCH
 * @requires Authentication Yes (x-auth-token header)
 * 
 * @param {string} id - Equipment ID
 * @param {UpdateEquipmentDto} payload - Equipment data to update
 * @returns {Promise<Equipment>} Updated equipment data
 * 
 * @throws {ApiError} If update fails
 */
export async function updateEquipment(
  id: string,
  payload: UpdateEquipmentDto
): Promise<Equipment> {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    const res = await axiosInstance.patch<ApiResponse<Equipment>>(`/equipments/${id}`, payload);

    return validateApiResponse(res.data, `/equipments/${id}`, 'PATCH', gymId);
  } catch (error: any) {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    if (error?.response) {
      throw createApiErrorFromAxiosError(error, gymId);
    }

    throw new ApiError(
      error?.message || 'Failed to update equipment',
      500,
      { url: `/equipments/${id}`, method: 'PATCH', gymId }
    );
  }
}

/**
 * Deletes an equipment item
 * 
 * @endpoint DELETE /equipments/{id}
 * @method DELETE
 * @requires Authentication Yes (x-auth-token header)
 * 
 * @param {string} id - Equipment ID
 * @returns {Promise<boolean>} True if deletion successful
 * 
 * @throws {ApiError} If deletion fails
 */
export async function deleteEquipment(id: string): Promise<boolean> {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    const res = await axiosInstance.delete<ApiResponse<null>>(`/equipments/${id}`);

    validateApiResponse(res.data, `/equipments/${id}`, 'DELETE', gymId);
    return true;
  } catch (error: any) {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    if (error?.response) {
      throw createApiErrorFromAxiosError(error, gymId);
    }

    throw new ApiError(
      error?.message || 'Failed to delete equipment',
      500,
      { url: `/equipments/${id}`, method: 'DELETE', gymId }
    );
  }
}
