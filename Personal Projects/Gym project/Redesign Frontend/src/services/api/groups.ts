import axiosInstance from './client';
import { ApiResponse, ApiError, validateApiResponse, createApiErrorFromAxiosError } from './types';
import { getGymIdFromToken } from '@/utils/jwt';
import { STORAGE_KEYS } from '@/utils/constants';

/**
 * Group Management API service
 * Handles customer group operations
 * 
 * @module GroupsAPI
 */

export interface GroupMember {
  id: string;
  clientId: string;
  name: string;
  relationship: string;
  packageId: string;
}

export interface GroupDetails {
  groupId: string;
  createdAt: string;
  status: string;
  members: GroupMember[];
}

export interface GroupListResponse {
  total: number;
  page: number;
  size: number;
  groups: GroupDetails[];
}

export interface CreateGroupDto {
  customerIds: string[];
  relatioship?: string; // Note: typo in API spec
  packageId: string;
}

/**
 * Get all groups with their members
 * 
 * @endpoint GET /api/groups
 * @method GET
 * @requires Authentication Yes (x-auth-token header)
 * 
 * @param {Object} params - Query parameters (pagination, filters)
 * @returns {Promise<GroupListResponse>} List of groups
 * 
 * @throws {ApiError} If fetch fails
 */
export async function getAllGroups(params?: {
  page?: number;
  size?: number;
  search?: string;
}): Promise<GroupListResponse> {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    const response = await axiosInstance.get<ApiResponse<GroupListResponse>>(
      '/api/groups',
      { params }
    );

    return validateApiResponse(response.data, '/api/groups', 'GET', gymId);
  } catch (error: any) {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    if (error?.response) {
      throw createApiErrorFromAxiosError(error, gymId);
    }

    throw new ApiError(
      error?.message || 'Failed to fetch groups',
      500,
      { url: '/api/groups', method: 'GET', gymId }
    );
  }
}

/**
 * Search for group by member identity
 * 
 * @endpoint GET /api/groups/search
 * @method GET
 * @requires Authentication Yes (x-auth-token header)
 * 
 * @param {Object} params - Search parameters:
 *   - customerId?: string
 *   - nic?: string
 *   - email?: string
 * 
 * @returns {Promise<GroupDetails>} Group details
 * 
 * @throws {ApiError} If search fails
 */
export async function searchGroupByMember(params: {
  customerId?: string;
  nic?: string;
  email?: string;
}): Promise<GroupDetails> {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    const response = await axiosInstance.get<ApiResponse<GroupDetails>>(
      '/api/groups/search',
      { params }
    );

    return validateApiResponse(response.data, '/api/groups/search', 'GET', gymId);
  } catch (error: any) {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    if (error?.response) {
      throw createApiErrorFromAxiosError(error, gymId);
    }

    throw new ApiError(
      error?.message || 'Failed to search group',
      500,
      { url: '/api/groups/search', method: 'GET', gymId }
    );
  }
}

/**
 * Create a new group with multiple customers
 * 
 * @endpoint POST /api/groups/createGroup
 * @method POST
 * @requires Authentication Yes (x-auth-token header)
 * 
 * @param {CreateGroupDto} payload - Group creation data
 * @returns {Promise<GroupDetails>} Created group details
 * 
 * @throws {ApiError} If creation fails
 */
export async function createGroup(payload: CreateGroupDto): Promise<GroupDetails> {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    const response = await axiosInstance.post<ApiResponse<GroupDetails>>(
      '/api/groups/createGroup',
      payload
    );

    return validateApiResponse(response.data, '/api/groups/createGroup', 'POST', gymId);
  } catch (error: any) {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    if (error?.response) {
      throw createApiErrorFromAxiosError(error, gymId);
    }

    throw new ApiError(
      error?.message || 'Failed to create group',
      500,
      { url: '/api/groups/createGroup', method: 'POST', gymId }
    );
  }
}

/**
 * Get total number of groups
 * 
 * @endpoint GET /api/groups/count/total
 * @method GET
 * @requires Authentication Yes (x-auth-token header)
 * 
 * @returns {Promise<number>} Total number of groups
 * 
 * @throws {ApiError} If fetch fails
 */
export async function getTotalGroupsCount(): Promise<number> {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    const response = await axiosInstance.get<ApiResponse<number>>(
      '/api/groups/count/total'
    );

    return validateApiResponse(response.data, '/api/groups/count/total', 'GET', gymId);
  } catch (error: any) {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    if (error?.response) {
      throw createApiErrorFromAxiosError(error, gymId);
    }

    throw new ApiError(
      error?.message || 'Failed to fetch total groups count',
      500,
      { url: '/api/groups/count/total', method: 'GET', gymId }
    );
  }
}

/**
 * Get count of active groups
 * 
 * @endpoint GET /api/groups/count/active
 * @method GET
 * @requires Authentication Yes (x-auth-token header)
 * 
 * @returns {Promise<number>} Count of active groups
 * 
 * @throws {ApiError} If fetch fails
 */
export async function getActiveGroupsCount(): Promise<number> {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    const response = await axiosInstance.get<ApiResponse<number>>(
      '/api/groups/count/active'
    );

    return validateApiResponse(response.data, '/api/groups/count/active', 'GET', gymId);
  } catch (error: any) {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    if (error?.response) {
      throw createApiErrorFromAxiosError(error, gymId);
    }

    throw new ApiError(
      error?.message || 'Failed to fetch active groups count',
      500,
      { url: '/api/groups/count/active', method: 'GET', gymId }
    );
  }
}

