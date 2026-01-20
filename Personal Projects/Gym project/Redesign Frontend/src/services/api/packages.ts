import axiosInstance from './client';
import { Package } from '@/types/package';
import { ApiResponse, ApiError, validateApiResponse, createApiErrorFromAxiosError } from './types';
import { getGymIdFromToken } from '@/utils/jwt';
import { STORAGE_KEYS } from '@/utils/constants';

/**
 * Packages API service
 * 
 * @module PackagesAPI
 */

/**
 * Fetches all packages available in the system
 * 
 * @endpoint GET /packages/get-all
 * @method GET
 * @requires Authentication No (public endpoint, but requires gym-id header)
 * 
 * @returns {Promise<Package[]>} Array of all packages
 * 
 * @throws {ApiError} If response status is not SUCCESS or HTTP error occurs
 * 
 * @example
 * ```typescript
 * const packages = await fetchPackages();
 * console.log(packages.length); // total number of packages
 * ```
 */
export async function fetchPackages(): Promise<Package[]> {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    const res = await axiosInstance.get<ApiResponse<any[]>>('/packages/get-all');

    const data = validateApiResponse(res.data, '/packages/get-all', 'GET', gymId);
    const packages = Array.isArray(data) ? data : [];
    
    // Transform API response to match frontend Package type
    // API returns 'name' but frontend uses 'package_name'
    return packages.map((pkg: any) => ({
      ...pkg,
      package_name: pkg.name || pkg.package_name || '',
      name: pkg.name,
      status: pkg.status,
      _id: pkg._id,
    }));
  } catch (error: any) {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    if (error?.response) {
      throw createApiErrorFromAxiosError(error, gymId);
    }

    throw new ApiError(
      error?.message || 'Failed to fetch packages',
      500,
      { url: '/packages/get-all', method: 'GET', gymId }
    );
  }
}

/**
 * Fetches a single package by ID
 * 
 * @endpoint GET /packages/{id}
 * @method GET
 * @requires Authentication Yes (x-auth-token header)
 * 
 * @param {string} id - Package ID
 * @returns {Promise<Package>} Package data
 * 
 * @throws {ApiError} If package not found (404) or other error occurs
 */
export async function fetchPackageById(id: string): Promise<Package> {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    const res = await axiosInstance.get<ApiResponse<Package>>(`/packages/${id}`);

    return validateApiResponse(res.data, `/packages/${id}`, 'GET', gymId);
  } catch (error: any) {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    if (error?.response) {
      throw createApiErrorFromAxiosError(error, gymId);
    }

    throw new ApiError(
      error?.message || 'Failed to fetch package',
      500,
      { url: `/packages/${id}`, method: 'GET', gymId }
    );
  }
}

/**
 * Creates a new package
 * 
 * @endpoint POST /packages
 * @method POST
 * @requires Authentication Yes (x-auth-token header)
 * 
 * @param {Partial<Package>} payload - Package data to create
 * @returns {Promise<Package>} Created package data
 * 
 * @throws {ApiError} If creation fails
 */
export async function createPackage(payload: Partial<Package>): Promise<Package> {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    const res = await axiosInstance.post<ApiResponse<Package>>('/packages', payload);

    return validateApiResponse(res.data, '/packages', 'POST', gymId);
  } catch (error: any) {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    if (error?.response) {
      throw createApiErrorFromAxiosError(error, gymId);
    }

    throw new ApiError(
      error?.message || 'Failed to create package',
      500,
      { url: '/packages', method: 'POST', gymId }
    );
  }
}

/**
 * Updates an existing package
 * 
 * @endpoint PATCH /packages/{id}
 * @method PATCH
 * @requires Authentication Yes (x-auth-token header)
 * 
 * @param {string} id - Package ID
 * @param {Partial<Package>} payload - Package data to update
 * @returns {Promise<Package>} Updated package data
 * 
 * @throws {ApiError} If update fails
 */
export async function updatePackage(id: string, payload: Partial<Package>): Promise<Package> {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    const res = await axiosInstance.patch<ApiResponse<Package>>(`/packages/${id}`, payload);

    return validateApiResponse(res.data, `/packages/${id}`, 'PATCH', gymId);
  } catch (error: any) {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    if (error?.response) {
      throw createApiErrorFromAxiosError(error, gymId);
    }

    throw new ApiError(
      error?.message || 'Failed to update package',
      500,
      { url: `/packages/${id}`, method: 'PATCH', gymId }
    );
  }
}

/**
 * Deletes a package
 * 
 * @endpoint DELETE /packages/{id}
 * @method DELETE
 * @requires Authentication Yes (x-auth-token header)
 * 
 * @param {string} id - Package ID
 * @returns {Promise<boolean>} True if deletion successful
 * 
 * @throws {ApiError} If deletion fails
 */
export async function deletePackage(id: string): Promise<boolean> {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    const res = await axiosInstance.delete<ApiResponse<null>>(`/packages/${id}`);

    validateApiResponse(res.data, `/packages/${id}`, 'DELETE', gymId);
    return true;
  } catch (error: any) {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    if (error?.response) {
      throw createApiErrorFromAxiosError(error, gymId);
    }

    throw new ApiError(
      error?.message || 'Failed to delete package',
      500,
      { url: `/packages/${id}`, method: 'DELETE', gymId }
    );
  }
}

