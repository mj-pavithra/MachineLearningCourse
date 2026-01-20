import axiosInstance from './client';
import { Payment, TrainerSalary, CreatePaymentDto, CreateExtraPaymentDto, CreateGroupPaymentDto } from '@/types/finance';
import { ApiResponse, ApiError, validateApiResponse, createApiErrorFromAxiosError } from './types';
import { getGymIdFromToken } from '@/utils/jwt';
import { STORAGE_KEYS } from '@/utils/constants';

// Re-export types for external use
export type { CreatePaymentDto, CreateExtraPaymentDto, CreateGroupPaymentDto };

export interface FetchClientPaymentsParams {
  page?: number;
  size?: number;
  searchTerm?: string;
  paymentId?: string;
  paidFor?: string;
  paidBy?: string;
  month?: string;
  isExtra?: boolean;
  accessgiven?: boolean;
  minAmount?: number;
  maxAmount?: number;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  // Legacy support
  search?: string;
  status?: string;
}

export interface FetchTrainerSalariesParams {
  page?: number;
  size?: number;
  month?: number;
  year?: number;
  trainerId?: string;
  status?: string;
}

/**
 * Payments list response structure
 * Backend returns: { payments: Payment[], totalCount: number, page: number, size: number, totalPages: number }
 * Frontend normalizes to: { items: Payment[], total: number, page: number, size: number }
 */
export interface PaymentsListResponse {
  items: Payment[];
  total: number;
  page?: number;
  size?: number;
  totalPages?: number; // Backend also returns totalPages
  // Backend response properties (for internal handling)
  payments?: Payment[]; // Backend returns 'payments' instead of 'items'
  totalCount?: number; // Backend returns 'totalCount' instead of 'total'
}

export interface SalariesListResponse {
  items: TrainerSalary[];
  total: number;
  page?: number;
  size?: number;
}

// CreatePaymentDto is now imported from @/types/finance

export interface GenerateSalaryDto {
  trainerId: string;
  month: number;
  year: number;
  sessions?: number;
}

/**
 * Finances API service
 * 
 * @module FinancesAPI
 */

/**
 * Fetches a list of client payments with optional filtering and pagination
 * 
 * @endpoint GET /clientsPayment/get-all
 * @method GET
 * @requires Authentication Yes (x-auth-token header)
 * 
 * @param {FetchClientPaymentsParams} params - Query parameters:
 *   - page?: number - Page number (default: 1, backend default: 1)
 *   - size?: number - Page size (default: 20, backend default: 10)
 *   - searchTerm?: string - Search in paymentId, month, paidBy, paidFor (maps to backend searchTerm)
 *   - search?: string - Legacy search parameter (maps to searchTerm)
 *   - paymentId?: string - Filter by specific payment ID
 *   - paidFor?: string - Filter by customer ID (paidFor)
 *   - paidBy?: string - Filter by payer ID (paidBy)
 *   - month?: string - Filter by month (e.g., "January", "February")
 *   - isExtra?: boolean - Filter by extra payments (converted to 'true'/'false' string)
 *   - accessgiven?: boolean - Filter by access given status (converted to 'true'/'false' string)
 *   - minAmount?: number - Minimum payment amount
 *   - maxAmount?: number - Maximum payment amount
 *   - startDate?: string - Filter payments from this date (ISO format or YYYY-MM-DD)
 *   - endDate?: string - Filter payments until this date (ISO format or YYYY-MM-DD)
 *   - sortBy?: string - Sort field (default: createdAt)
 *   - sortOrder?: 'asc' | 'desc' - Sort order (default: desc)
 * 
 * @returns {Promise<PaymentsListResponse>} Paginated list of payments
 *   - Backend returns: { payments: Payment[], totalCount: number, page: number, size: number, totalPages: number }
 *   - Frontend normalizes to: { items: Payment[], total: number, page: number, size: number, totalPages?: number }
 * 
 * @throws {ApiError} If fetch fails
 * 
 * @note API Integration Details:
 *   - Boolean parameters (isExtra, accessgiven) are converted to strings ('true'/'false') before sending
 *   - Backend converts string booleans: isExtra === 'true' → boolean
 *   - All query parameters are sent as strings (Axios automatically converts)
 *   - Response structure is normalized from backend format to frontend format
 */
export async function fetchClientPayments(
  params: FetchClientPaymentsParams = { page: 1, size: 20 }
): Promise<PaymentsListResponse> {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    // Map frontend params to backend params
    // Backend expects all query params as strings, so we need to convert booleans
    // Axios will automatically convert numbers to strings in query params
    const backendParams: Record<string, string | number> = {
      page: params.page || 1,
      size: params.size || 20,
    };
    
    // Search parameter mapping
    // Backend expects 'searchTerm', frontend can use 'searchTerm' or legacy 'search'
    if (params.searchTerm) {
      backendParams.searchTerm = params.searchTerm;
    } else if (params.search) {
      backendParams.searchTerm = params.search;
    }
    
    // String parameters - sent as-is (Axios converts to query string)
    // Only include if they have a non-empty value
    if (params.paymentId && params.paymentId.trim().length > 0) {
      backendParams.paymentId = params.paymentId.trim();
    }
    if (params.paidFor && params.paidFor.trim().length > 0) {
      backendParams.paidFor = params.paidFor.trim();
    }
    if (params.paidBy && params.paidBy.trim().length > 0) {
      backendParams.paidBy = params.paidBy.trim();
    }
    if (params.month && params.month.trim().length > 0) {
      backendParams.month = params.month.trim();
    }
    
    // Boolean parameters - MUST convert to strings for backend
    // Backend controller receives as string and converts: isExtra === 'true' → boolean
    // This ensures proper boolean conversion on backend side
    if (params.isExtra !== undefined) {
      backendParams.isExtra = params.isExtra ? 'true' : 'false';
    }
    if (params.accessgiven !== undefined) {
      backendParams.accessgiven = params.accessgiven ? 'true' : 'false';
    }
    
    // Number parameters - Axios will convert to string in query params
    // Backend parses: parseInt(size, 10) and parseFloat(minAmount)
    if (params.minAmount !== undefined) backendParams.minAmount = params.minAmount;
    if (params.maxAmount !== undefined) backendParams.maxAmount = params.maxAmount;
    
    // Date parameters - sent as ISO strings or YYYY-MM-DD format
    if (params.startDate) backendParams.startDate = params.startDate;
    if (params.endDate) backendParams.endDate = params.endDate;
    
    // Sort parameters - backend uses: { [sortBy]: sortOrder === 'asc' ? 1 : -1 }
    if (params.sortBy) backendParams.sortBy = params.sortBy;
    if (params.sortOrder) backendParams.sortOrder = params.sortOrder;

    const res = await axiosInstance.get<ApiResponse<PaymentsListResponse | Payment[] | any>>(
      '/clientsPayment/get-all',
      { params: backendParams }
    );

    const data = validateApiResponse(res.data, '/clientsPayment/get-all', 'GET', gymId);
    
    // Backend returns: { payments: Payment[], totalCount: number, page: number, size: number, totalPages: number }
    // Normalize to frontend format: { items: Payment[], total: number, page: number, size: number }
    
    // Handle array response (legacy format)
    if (Array.isArray(data)) {
      return {
        items: data,
        total: data.length,
        page: params.page || 1,
        size: params.size || 20,
      };
    }

    // Backend response structure: { payments, totalCount, page, size, totalPages }
    const response = data as {
      payments?: Payment[];
      totalCount?: number;
      page?: number;
      size?: number;
      totalPages?: number;
      items?: Payment[];
      total?: number;
    };
    
    // Check if response has payments property (backend standard format)
    if (response && 'payments' in response && Array.isArray(response.payments)) {
      return {
        items: response.payments,
        total: response.totalCount ?? 0,
        page: response.page ?? params.page ?? 1,
        size: response.size ?? params.size ?? 20,
        totalPages: response.totalPages,
      };
    }

    // If response already has items property (already normalized)
    if (response && 'items' in response && Array.isArray(response.items)) {
      return {
        items: response.items,
        total: response.totalCount ?? response.total ?? response.items.length,
        page: response.page ?? params.page ?? 1,
        size: response.size ?? params.size ?? 20,
        totalPages: response.totalPages,
      };
    }

    // Fallback: return as-is (should not happen with proper backend)
    return data as PaymentsListResponse;
  } catch (error: any) {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    if (error?.response) {
      throw createApiErrorFromAxiosError(error, gymId);
    }

    throw new ApiError(
      error?.message || 'Failed to fetch client payments',
      500,
      { url: '/clientsPayment/get-all', method: 'GET', gymId }
    );
  }
}

/**
 * Creates a new client payment
 * 
 * @endpoint POST /clientsPayment/create
 * @method POST
 * @requires Authentication Yes (x-auth-token header)
 * 
 * @param {CreatePaymentDto} payload - Payment data to create
 * @returns {Promise<Payment>} Created payment data
 * 
 * @throws {ApiError} If creation fails
 */
export async function createClientPayment(payload: CreatePaymentDto): Promise<Payment> {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    const res = await axiosInstance.post<ApiResponse<Payment>>(
      '/clientsPayment/create',
      payload
    );

    return validateApiResponse(res.data, '/clientsPayment/create', 'POST', gymId);
  } catch (error: any) {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    if (error?.response) {
      throw createApiErrorFromAxiosError(error, gymId);
    }

    throw new ApiError(
      error?.message || 'Failed to create payment',
      500,
      { url: '/clientsPayment/create', method: 'POST', gymId }
    );
  }
}

/**
 * Creates a new extra payment
 * 
 * @endpoint POST /clientsPayment/createExtra
 * @method POST
 * @requires Authentication Yes (x-auth-token header)
 * 
 * @param {CreateExtraPaymentDto} payload - Extra payment data to create
 * @returns {Promise<Payment>} Created payment data
 * 
 * @throws {ApiError} If creation fails
 */
export async function createExtraPayment(payload: CreateExtraPaymentDto): Promise<Payment> {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    const res = await axiosInstance.post<ApiResponse<Payment>>(
      '/clientsPayment/createExtra',
      payload
    );

    return validateApiResponse(res.data, '/clientsPayment/createExtra', 'POST', gymId);
  } catch (error: any) {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    if (error?.response) {
      throw createApiErrorFromAxiosError(error, gymId);
    }

    throw new ApiError(
      error?.message || 'Failed to create extra payment',
      500,
      { url: '/clientsPayment/createExtra', method: 'POST', gymId }
    );
  }
}

/**
 * Fetches payments by user ID
 * 
 * @endpoint GET /clientsPayment/userPayments/{userId}
 * @method GET
 * @requires Authentication Yes (x-auth-token header)
 * 
 * @param {string} userId - User ID to get payments for
 * @returns {Promise<Payment[]>} Array of payments for the user
 * 
 * @throws {ApiError} If fetch fails
 * @throws {NotFoundException} If user has no payments (404)
 * 
 * @note API Integration Details:
 *   - Backend returns: Payment[] (array of Payment documents)
 *   - Backend throws NotFoundException if no payments found
 *   - This endpoint is specifically designed for getting a user's payment history
 */
export async function fetchPaymentsByUserId(userId: string): Promise<Payment[]> {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    if (!userId || userId.trim().length === 0) {
      throw new ApiError(
        'User ID is required',
        400,
        { url: `/clientsPayment/userPayments/${userId}`, method: 'GET', gymId }
      );
    }

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/aa08310a-e7e9-4150-934e-d72f41a46c0c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'finances.ts:356',message:'Before axios.get call',data:{userId:userId.trim(),endpoint:`/clientsPayment/userPayments/${userId.trim()}`},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    const res = await axiosInstance.get<ApiResponse<Payment[]>>(
      `/clientsPayment/userPayments/${userId.trim()}`
    );

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/aa08310a-e7e9-4150-934e-d72f41a46c0c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'finances.ts:360',message:'After axios.get - before validateApiResponse',data:{status:res.status,responseStatus:res.data?.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    const data = validateApiResponse(res.data, `/clientsPayment/userPayments/${userId}`, 'GET', gymId);
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/aa08310a-e7e9-4150-934e-d72f41a46c0c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'finances.ts:365',message:'After validateApiResponse',data:{isArray:Array.isArray(data),dataLength:Array.isArray(data)?data.length:'not-array'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    // Backend returns: Payment[] (array directly)
    // If data is already an array, return it
    if (Array.isArray(data)) {
      return data;
    }
    
    // Fallback: return empty array if data is not an array
    return [];
  } catch (error: any) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/aa08310a-e7e9-4150-934e-d72f41a46c0c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'finances.ts:375',message:'Catch block entered',data:{errorType:error?.constructor?.name,hasResponse:!!error?.response,responseStatus:error?.response?.status,responseData:error?.response?.data,errorMessage:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    // Handle 404 (no payments found) gracefully
    if (error?.response?.status === 404) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/aa08310a-e7e9-4150-934e-d72f41a46c0c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'finances.ts:380',message:'404 detected - returning empty array',data:{responseStatus:error?.response?.status,responseData:error?.response?.data},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return []; // Return empty array instead of throwing
    }

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/aa08310a-e7e9-4150-934e-d72f41a46c0c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'finances.ts:385',message:'404 check failed - will throw error',data:{responseStatus:error?.response?.status,hasResponse:!!error?.response},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    if (error?.response) {
      throw createApiErrorFromAxiosError(error, gymId);
    }

    throw new ApiError(
      error?.message || 'Failed to fetch payments by user ID',
      500,
      { url: `/clientsPayment/userPayments/${userId}`, method: 'GET', gymId }
    );
  }
}

/**
 * Creates a new group payment
 * 
 * @endpoint POST /clientsPayment/createGroup
 * @method POST
 * @requires Authentication Yes (x-auth-token header)
 * 
 * @param {CreateGroupPaymentDto} payload - Group payment data to create
 * @returns {Promise<Payment>} Created payment data
 * 
 * @throws {ApiError} If creation fails
 */
export async function createGroupPayment(payload: CreateGroupPaymentDto): Promise<Payment> {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    const res = await axiosInstance.post<ApiResponse<Payment>>(
      '/clientsPayment/createGroup',
      payload
    );

    return validateApiResponse(res.data, '/clientsPayment/createGroup', 'POST', gymId);
  } catch (error: any) {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    if (error?.response) {
      throw createApiErrorFromAxiosError(error, gymId);
    }

    throw new ApiError(
      error?.message || 'Failed to create group payment',
      500,
      { url: '/clientsPayment/createGroup', method: 'POST', gymId }
    );
  }
}

/**
 * Fetches a list of trainer salaries with optional filtering and pagination
 * 
 * @endpoint GET /finances/trainer-salaries
 * @method GET
 * @requires Authentication Yes (x-auth-token header)
 * 
 * @param {FetchTrainerSalariesParams} params - Query parameters:
 *   - page?: number - Page number (default: 1)
 *   - size?: number - Page size (default: 20)
 *   - month?: number - Filter by month (1-12)
 *   - year?: number - Filter by year
 *   - trainerId?: string - Filter by trainer ID
 *   - status?: string - Filter by salary status
 * 
 * @returns {Promise<SalariesListResponse>} Paginated list of salaries
 * 
 * @throws {ApiError} If fetch fails
 */
export async function fetchTrainerSalaries(
  params: FetchTrainerSalariesParams = { page: 1, size: 20 }
): Promise<SalariesListResponse> {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    const res = await axiosInstance.get<ApiResponse<SalariesListResponse | TrainerSalary[]>>(
      '/finances/trainer-salaries',
      { params }
    );

    const data = validateApiResponse(res.data, '/finances/trainer-salaries', 'GET', gymId);
    
    // Handle different response structures
    if (Array.isArray(data)) {
      return {
        items: data,
        total: data.length,
        page: params.page || 1,
        size: params.size || 20,
      };
    }

    return data as SalariesListResponse;
  } catch (error: any) {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    if (error?.response) {
      throw createApiErrorFromAxiosError(error, gymId);
    }

    throw new ApiError(
      error?.message || 'Failed to fetch trainer salaries',
      500,
      { url: '/finances/trainer-salaries', method: 'GET', gymId }
    );
  }
}

/**
 * Generates a trainer salary for a specific month/year
 * 
 * @endpoint POST /finances/trainer-salaries/generate
 * @method POST
 * @requires Authentication Yes (x-auth-token header)
 * 
 * @param {GenerateSalaryDto} payload - Salary generation data:
 *   - trainerId: string - Trainer ID
 *   - month: number - Month (1-12)
 *   - year: number - Year
 *   - sessions?: number - Optional session count override
 * 
 * @returns {Promise<TrainerSalary>} Generated salary data
 * 
 * @throws {ApiError} If generation fails
 */
export async function generateTrainerSalary(payload: GenerateSalaryDto): Promise<TrainerSalary> {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    const res = await axiosInstance.post<ApiResponse<TrainerSalary>>(
      '/finances/trainer-salaries/generate',
      payload
    );

    return validateApiResponse(res.data, '/finances/trainer-salaries/generate', 'POST', gymId);
  } catch (error: any) {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    if (error?.response) {
      throw createApiErrorFromAxiosError(error, gymId);
    }

    throw new ApiError(
      error?.message || 'Failed to generate salary',
      500,
      { url: '/finances/trainer-salaries/generate', method: 'POST', gymId }
    );
  }
}
