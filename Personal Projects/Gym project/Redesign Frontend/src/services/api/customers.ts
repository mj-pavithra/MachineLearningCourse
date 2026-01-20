import axiosInstance from './client';
import { Customer, FetchedCustomer, FetchedGroupCustomer, IndividualCustomer, EmergencyContact, BodyCondition } from '@/types/customer';
import { ApiResponse, ApiError, validateApiResponse, createApiErrorFromAxiosError } from './types';
import { getGymIdFromToken } from '@/utils/jwt';
import { STORAGE_KEYS } from '@/utils/constants';
import { createCustomerDtoSchema, updateCustomerDtoSchema } from './input-validators';
import { z } from 'zod';

// Export DTO types for use in components
export type CreateCustomerDto = z.infer<typeof createCustomerDtoSchema>;
export type UpdateCustomerDto = z.infer<typeof updateCustomerDtoSchema>;

/**
 * Customers API service
 * 
 * @module CustomersAPI
 */

export interface FetchCustomersParams {
  page?: number;
  size?: number;
  searchTerm?: string;
  type?: 'individual' | 'group';
}

export interface CustomersListResponse {
  customers: (Customer | IndividualCustomer)[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Raw API response structure (may vary)
 */
interface RawCustomersListResponse {
  data?: {
    results?: (Customer | IndividualCustomer)[];
    totalResults?: number;
    customers?: (Customer | IndividualCustomer)[];
    total?: number;
  };
  results?: (Customer | IndividualCustomer)[];
  totalResults?: number;
  customers?: (Customer | IndividualCustomer)[];
  total?: number;
  page?: number;
  limit?: number;
}

/**
 * Fetches a list of customers with optional filtering and pagination
 * 
 * @endpoint GET /customers/get-all
 * @method GET
 * @requires Authentication Yes (x-auth-token header)
 * 
 * @param {FetchCustomersParams} params - Query parameters:
 *   - page?: number - Page number (default: 1)
 *   - limit?: number - Page size (default: 10)
 *   - search?: string - Search query
 *   - type?: 'individual' | 'group' - Filter by customer type
 * 
 * @returns {Promise<CustomersListResponse>} Paginated list of customers
 * 
 * @throws {ApiError} If fetch fails
 */
export async function fetchCustomersList(
  params: FetchCustomersParams = {}
): Promise<CustomersListResponse> {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    // Sanitize and encode search parameter
    const sanitizedParams: any = { ...params };
    if (sanitizedParams.searchTerm) {
      // Trim and encode search parameter
      sanitizedParams.searchTerm = sanitizedParams.searchTerm.trim();
      // URL encoding is handled by axios, but we ensure it's a valid string
      if (sanitizedParams.searchTerm.length < 2) {
        delete sanitizedParams.searchTerm;
      }
    }

    // Debug logging (development only)
    if (import.meta.env.DEV && sanitizedParams.searchTerm) {
      console.log('[fetchCustomersList] Searching with term:', sanitizedParams.searchTerm);
    }

    const response = await axiosInstance.get<ApiResponse<RawCustomersListResponse>>(
      '/customers/get-all',
      { params: sanitizedParams }
    );

    // Validate API response and get raw data
    const rawData = validateApiResponse(response.data, '/customers/get-all', 'GET', gymId) as RawCustomersListResponse;

    // Debug logging (development only)
    if (import.meta.env.DEV) {
      console.log('[fetchCustomersList] Raw API response:', rawData);
    }

    // Handle nested response structure: data.data.results or data.results
    let actualData: RawCustomersListResponse = rawData;
    
    // If data is nested (data.data.results), extract the inner data
    if (rawData.data && typeof rawData.data === 'object') {
      actualData = rawData.data as RawCustomersListResponse;
    }

    // Extract customers array - try multiple possible field names
    const customers = actualData.results || actualData.customers || [];
    
    // Extract total - try multiple possible field names
    const total = actualData.totalResults || actualData.total || 0;

    // Extract page and size from response or use params
    const page = actualData.page || params.page || 1;
    const limit = actualData.limit || params.size || 10;

    // Debug logging (development only)
    if (import.meta.env.DEV) {
      console.log('[fetchCustomersList] Transformed response:', {
        customersCount: customers.length,
        total,
        page,
        limit,
      });
    }

    return {
      customers,
      total,
      page,
      limit,
    };
  } catch (error: any) {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    if (error?.response) {
      throw createApiErrorFromAxiosError(error, gymId);
    }

    // Return empty result instead of throwing for graceful degradation
    console.error('Failed to fetch customers:', error);
    return {
      customers: [],
      total: 0,
      page: params.page || 1,
      limit: params.size || 10,
    };
  }
}

/**
 * Fetches a list of individual customers
 * 
 * @endpoint GET /customers/individual
 * @method GET
 * @requires Authentication Yes (x-auth-token header)
 * 
 * @param {FetchCustomersParams} params - Query parameters
 * @returns {Promise<FetchedCustomer[]>} Array of individual customers
 * 
 * @throws {ApiError} If fetch fails
 */
export async function fetchIndividualCustomers(
  params: FetchCustomersParams = {}
): Promise<FetchedCustomer[]> {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    const response = await axiosInstance.get<ApiResponse<FetchedCustomer[]>>(
      '/customers/individual',
      { params }
    );

    const data = validateApiResponse(response.data, '/customers/individual', 'GET', gymId);
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    if (error?.response) {
      throw createApiErrorFromAxiosError(error, gymId);
    }

    console.error('Failed to fetch individual customers:', error);
    return [];
  }
}

/**
 * Fetches a list of group customers
 * 
 * @endpoint GET /customers/group
 * @method GET
 * @requires Authentication Yes (x-auth-token header)
 * 
 * @param {FetchCustomersParams} params - Query parameters
 * @returns {Promise<FetchedGroupCustomer[]>} Array of group customers
 * 
 * @throws {ApiError} If fetch fails
 */
export async function fetchGroupCustomers(
  params: FetchCustomersParams = {}
): Promise<FetchedGroupCustomer[]> {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    const response = await axiosInstance.get<ApiResponse<FetchedGroupCustomer[]>>(
      '/customers/group',
      { params }
    );

    const data = validateApiResponse(response.data, '/customers/group', 'GET', gymId);
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    if (error?.response) {
      throw createApiErrorFromAxiosError(error, gymId);
    }

    console.error('Failed to fetch group customers:', error);
    return [];
  }
}

/**
 * Creates a new customer
 * 
 * @endpoint POST /customers/add-customer
 * @method POST
 * @requires Authentication Yes (x-auth-token header)
 * 
 * @param {CreateCustomerDto} payload - Customer data to create (validated against createCustomerDtoSchema)
 * @returns {Promise<Customer>} Created customer data
 * 
 * @throws {ApiError} If creation fails
 * @throws {z.ZodError} If payload validation fails
 */
export async function createCustomer(payload: CreateCustomerDto): Promise<Customer> {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    const res = await axiosInstance.post<ApiResponse<Customer>>('/customers/add-customer', payload);

    return validateApiResponse(res.data, '/customers/add-customer', 'POST', gymId);
  } catch (error: any) {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    if (error?.response) {
      throw createApiErrorFromAxiosError(error, gymId);
    }

    throw new ApiError(
      error?.message || 'Failed to create customer',
      500,
      { url: '/customers/add-customer', method: 'POST', gymId }
    );
  }
}

/**
 * Updates an existing customer
 * 
 * @endpoint PATCH /customers/{id}
 * @method PATCH
 * @requires Authentication Yes (x-auth-token header)
 * 
 * @param {string} id - Customer ID
 * @param {UpdateCustomerDto} payload - Customer data to update (validated against updateCustomerDtoSchema)
 * @returns {Promise<Customer>} Updated customer data
 * 
 * @throws {ApiError} If update fails
 * @throws {z.ZodError} If payload validation fails
 */
export async function updateCustomer(id: string, payload: UpdateCustomerDto): Promise<Customer> {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    const res = await axiosInstance.patch<ApiResponse<Customer>>(`/customers/${id}`, payload);

    return validateApiResponse(res.data, `/customers/${id}`, 'PUT', gymId);
  } catch (error: any) {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    if (error?.response) {
      throw createApiErrorFromAxiosError(error, gymId);
    }

    throw new ApiError(
      error?.message || 'Failed to update customer',
      500,
      { url: `/customers/${id}`, method: 'PUT', gymId }
    );
  }
}

/**
 * Deletes a customer
 * 
 * @endpoint DELETE /customers/{id}
 * @method DELETE
 * @requires Authentication Yes (x-auth-token header)
 * 
 * @param {string} id - Customer ID
 * @returns {Promise<boolean>} True if deletion successful
 * 
 * @throws {ApiError} If deletion fails
 */
export async function deleteCustomer(id: string): Promise<boolean> {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    const res = await axiosInstance.delete<ApiResponse<null>>(`/customers/${id}`);

    validateApiResponse(res.data, `/customers/${id}`, 'DELETE', gymId);
    return true;
  } catch (error: any) {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    if (error?.response) {
      throw createApiErrorFromAxiosError(error, gymId);
    }

    throw new ApiError(
      error?.message || 'Failed to delete customer',
      500,
      { url: `/customers/${id}`, method: 'DELETE', gymId }
    );
  }
}

/**
 * Fetches a customer by client ID
 * 
 * @endpoint GET /customers/:id
 * @method GET
 * @requires Authentication Yes (x-auth-token header)
 * 
 * @param {string} clientId - Customer client ID
 * @returns {Promise<IndividualCustomer>} Customer data
 * 
 * @throws {ApiError} If customer not found (404) or other error occurs
 */
export async function fetchCustomerByClientId(clientId: string): Promise<IndividualCustomer> {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    const res = await axiosInstance.get<ApiResponse<IndividualCustomer>>(`/customers/${clientId}`);

    return validateApiResponse(res.data, `/customers/${clientId}`, 'GET', gymId);
  } catch (error: any) {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    if (error?.response) {
      throw createApiErrorFromAxiosError(error, gymId);
    }

    throw new ApiError(
      error?.message || 'Failed to fetch customer',
      500,
      { url: `/customers/${clientId}`, method: 'GET', gymId }
    );
  }
}

/**
 * Fetches emergency contacts for a customer by client ID
 * 
 * @endpoint GET /customers/:id/emergency-contacts (may need to be created)
 * @method GET
 * @requires Authentication Yes (x-auth-token header)
 * 
 * @param {string} clientId - Customer client ID
 * @returns {Promise<EmergencyContact[]>} Array of emergency contacts
 * 
 * @throws {ApiError} If fetch fails
 */
export async function fetchEmergencyContactsByClientId(clientId: string): Promise<EmergencyContact[]> {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    // Note: This endpoint may need to be created in the backend
    // For now, we'll try the endpoint, and if it doesn't exist, return empty array
    try {
      const res = await axiosInstance.get<ApiResponse<EmergencyContact[]>>(`/customers/${clientId}/emergency-contacts`);
      const data = validateApiResponse(res.data, `/customers/${clientId}/emergency-contacts`, 'GET', gymId);
      return Array.isArray(data) ? data : [];
    } catch (error: any) {
      // If endpoint doesn't exist (404), return empty array
      if (error?.response?.status === 404) {
        console.warn(`Emergency contacts endpoint not found for clientId: ${clientId}`);
        return [];
      }
      throw error;
    }
  } catch (error: any) {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    if (error?.response) {
      throw createApiErrorFromAxiosError(error, gymId);
    }

    throw new ApiError(
      error?.message || 'Failed to fetch emergency contacts',
      500,
      { url: `/customers/${clientId}/emergency-contacts`, method: 'GET', gymId }
    );
  }
}

/**
 * Fetches body conditions for a customer by client ID
 * 
 * @endpoint GET /customers/:id/body-conditions (may need to be created)
 * @method GET
 * @requires Authentication Yes (x-auth-token header)
 * 
 * @param {string} clientId - Customer client ID
 * @returns {Promise<BodyCondition[]>} Array of body conditions
 * 
 * @throws {ApiError} If fetch fails
 */
export async function fetchBodyConditionsByClientId(clientId: string): Promise<BodyCondition[]> {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    // Note: This endpoint may need to be created in the backend
    // For now, we'll try the endpoint, and if it doesn't exist, return empty array
    try {
      const res = await axiosInstance.get<ApiResponse<BodyCondition[]>>(`/customers/${clientId}/body-conditions`);
      const data = validateApiResponse(res.data, `/customers/${clientId}/body-conditions`, 'GET', gymId);
      return Array.isArray(data) ? data : [];
    } catch (error: any) {
      // If endpoint doesn't exist (404), return empty array
      if (error?.response?.status === 404) {
        console.warn(`Body conditions endpoint not found for clientId: ${clientId}`);
        return [];
      }
      throw error;
    }
  } catch (error: any) {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    if (error?.response) {
      throw createApiErrorFromAxiosError(error, gymId);
    }

    throw new ApiError(
      error?.message || 'Failed to fetch body conditions',
      500,
      { url: `/customers/${clientId}/body-conditions`, method: 'GET', gymId }
    );
  }
}
