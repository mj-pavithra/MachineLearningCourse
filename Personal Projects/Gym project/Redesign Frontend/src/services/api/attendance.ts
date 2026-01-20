import axiosInstance from './client';
import { ApiResponse, ApiError, validateApiResponse, createApiErrorFromAxiosError } from './types';
import { getGymIdFromToken } from '@/utils/jwt';
import { STORAGE_KEYS } from '@/utils/constants';

/**
 * Attendance API service
 * Handles attendance tracking and reporting
 * 
 * @module AttendanceAPI
 */

export interface DailyAttendanceItem {
  customerId: string;
  firstName: string;
  lastName: string;
  time: string;
  attendedDateTime: string;
  isAllowed: boolean;
  deviceSerial: string;
  verifyMode: string;
}

export interface DailyAttendanceData {
  date: string;
  attendances: DailyAttendanceItem[];
  totalCount: number;
}

export interface DailyAttendanceResponse {
  success: boolean;
  message: string;
  data: DailyAttendanceData[]; // Array of daily attendance data
  totalRecords: number;
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

/**
 * DTO for creating attendance
 * Note: gymId is automatically extracted from JWT token on backend, not sent in payload
 */
export interface CreateAttendanceDto {
  userId: string; // PersonID / userId assigned on device (clientId)
  attendedDateTime: string; // ISO timestamp (YYYY-MM-DDTHH:mm:ss format)
  isCustomer: boolean; // Is this a customer (true) or employee (false)
  isAllowed: boolean; // Whether device allowed access
  deviceSerial?: string; // Device serial number
  verifyMode?: string; // Verification method (e.g., "FINGERPRINT" | "CARD" | "FACE")
  eventType?: string; // Event type from device
  doorNo?: number; // Door number (must be number, not string)
  readerNo?: number; // Reader number (must be number, not string)
  eventDescription?: string; // Event description
}

/**
 * Attendance document structure matching backend AttendanceDocument
 */
export interface Attendance {
  _id?: string;
  attendanceId?: string;
  gymId: string;
  userId: string;
  attendedDateTime: string;
  isCustomer: boolean;
  isAllowed: boolean;
  deviceSerial?: string;
  verifyMode?: string;
  eventType?: string;
  doorNo?: number;
  readerNo?: number;
  eventDescription?: string;
  createdAt?: string;
  updatedAt?: string;
  status?: string;
}

/**
 * Response structure for getAllAttendances
 * Backend returns: { customers: AttendanceDocument[] }
 */
export interface GetAllAttendancesResponse {
  customers: Attendance[];
}

/**
 * Response structure for getAttendanceById
 * Backend returns: AttendanceDocument
 */
export interface AttendanceResponse {
  _id?: string;
  attendanceId?: string;
  gymId: string;
  userId: string;
  attendedDateTime: string;
  isCustomer: boolean;
  isAllowed: boolean;
  deviceSerial?: string;
  verifyMode?: string;
  eventType?: string;
  doorNo?: number;
  readerNo?: number;
  eventDescription?: string;
  createdAt?: string;
  updatedAt?: string;
  status?: string;
}

/**
 * Response structure for createAttendance
 * Backend returns: Created attendance document
 */
export interface CreateAttendanceResponse {
  success?: boolean;
  message?: string;
  data?: Attendance;
}

/**
 * Get daily attendance data for a date range
 * 
 * @endpoint GET /Attendances/daily-attendance
 * @method GET
 * @requires Authentication Yes (x-auth-token header)
 * 
 * @param {Object} params - Query parameters:
 *   - startDate: string - Start date (required, ISO format or YYYY-MM-DD)
 *   - endDate: string - End date (required, ISO format or YYYY-MM-DD)
 * 
 * @returns {Promise<DailyAttendanceResponse>} Daily attendance data
 *   - Backend returns: DailyAttendanceResponseDto
 *   - Structure: {
 *       success: boolean;
 *       message: string;
 *       data: DailyAttendanceDataDto[]; // Array grouped by date
 *       totalRecords: number;
 *       dateRange: { startDate: string; endDate: string };
 *     }
 * 
 * @throws {ApiError} If fetch fails
 * @throws {BadRequestException} If startDate or endDate is missing or invalid
 * 
 * @note API Integration Details:
 *   - Both startDate and endDate are required query parameters
 *   - Backend validates date format and ensures startDate <= endDate
 *   - Backend returns data grouped by date with attendances array per date
 *   - Response includes totalRecords count and dateRange for reference
 *   - Backend filters attendances by gymId automatically (from JWT token)
 */
export async function getDailyAttendance(params: {
  startDate: string;
  endDate: string;
}): Promise<DailyAttendanceResponse> {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    // Validate required parameters
    if (!params.startDate || !params.endDate) {
      throw new ApiError(
        'Both startDate and endDate are required',
        400,
        { url: '/Attendances/daily-attendance', method: 'GET', gymId }
      );
    }

    const response = await axiosInstance.get<ApiResponse<DailyAttendanceResponse>>(
      '/Attendances/daily-attendance',
      { 
        params: {
          startDate: params.startDate,
          endDate: params.endDate,
        }
      }
    );

    const data = validateApiResponse(response.data, '/Attendances/daily-attendance', 'GET', gymId);
    
    // Backend returns: DailyAttendanceResponseDto
    // Ensure response structure matches expected format
    if (data && typeof data === 'object' && 'data' in data && 'success' in data) {
      return data as DailyAttendanceResponse;
    }
    
    // Fallback: return empty response structure if format doesn't match
    return {
      success: false,
      message: 'Invalid response format',
      data: [],
      totalRecords: 0,
      dateRange: {
        startDate: params.startDate,
        endDate: params.endDate,
      },
    };
  } catch (error: any) {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    if (error?.response) {
      throw createApiErrorFromAxiosError(error, gymId);
    }

    throw new ApiError(
      error?.message || 'Failed to fetch daily attendance',
      500,
      { url: '/Attendances/daily-attendance', method: 'GET', gymId }
    );
  }
}

/**
 * Query parameters for getAllAttendances
 */
export interface GetAllAttendancesParams {
  page?: number;
  size?: number;
  searchTerm?: string;
}

/**
 * Get all attendances with pagination and search
 * 
 * @endpoint GET /Attendances/get-all
 * @method GET
 * @requires Authentication Yes (x-auth-token header)
 * 
 * @param {GetAllAttendancesParams} params - Query parameters:
 *   - page?: number - Page number (default: 1, backend default: 1)
 *   - size?: number - Items per page (default: 10, backend default: 10)
 *   - searchTerm?: string - Search in userId, attendedDateTime, createdAt
 * 
 * @returns {Promise<GetAllAttendancesResponse>} List of attendances
 *   - Backend returns: { customers: AttendanceDocument[] }
 *   - Frontend normalizes to: { customers: Attendance[] }
 * 
 * @throws {ApiError} If fetch fails
 * 
 * @note API Integration Details:
 *   - Backend controller receives query params as: page (number), size (number), searchTerm (string)
 *   - Backend service searches in: userId, attendedDateTime, createdAt fields
 *   - Response structure: { customers: AttendanceDocument[] }
 *   - All query parameters are sent as strings (Axios automatically converts numbers)
 */
export async function getAllAttendances(
  params: GetAllAttendancesParams = {}
): Promise<GetAllAttendancesResponse> {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    // Map frontend params to backend params
    // Backend expects: page (number), size (number), searchTerm (string)
    // Axios will automatically convert numbers to strings in query params
    const backendParams: Record<string, string | number> = {};
    
    if (params.page !== undefined) {
      backendParams.page = params.page;
    }
    if (params.size !== undefined) {
      backendParams.size = params.size;
    }
    if (params.searchTerm) {
      backendParams.searchTerm = params.searchTerm;
    }

    const response = await axiosInstance.get<ApiResponse<GetAllAttendancesResponse>>(
      '/Attendances/get-all',
      { params: backendParams }
    );

    const data = validateApiResponse(response.data, '/Attendances/get-all', 'GET', gymId);
    
    // Backend returns: { customers: AttendanceDocument[] }
    // Ensure we always return the correct structure
    if (data && typeof data === 'object' && 'customers' in data) {
      return data as GetAllAttendancesResponse;
    }
    
    // Fallback: wrap in customers array if needed
    return {
      customers: Array.isArray(data) ? data : []
    };
  } catch (error: any) {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    if (error?.response) {
      throw createApiErrorFromAxiosError(error, gymId);
    }

    throw new ApiError(
      error?.message || 'Failed to fetch attendances',
      500,
      { url: '/Attendances/get-all', method: 'GET', gymId }
    );
  }
}

/**
 * Get attendances for a specific customer by customer ID
 * 
 * @endpoint GET /Attendances/get-all
 * @method GET
 * @requires Authentication Yes (x-auth-token header)
 * 
 * @param {string} customerId - Customer ID (clientId) to search for
 * @param {GetAllAttendancesParams} params - Optional pagination parameters
 *   - page?: number - Page number (default: 1)
 *   - size?: number - Items per page (default: 100 to get more records)
 * 
 * @returns {Promise<Attendance[]>} Array of attendance records for the customer
 *   - Filters results where userId matches customerId
 *   - Returns empty array if no matches found
 * 
 * @throws {ApiError} If fetch fails
 * 
 * @note API Integration Details:
 *   - Uses getAllAttendances with searchTerm set to customerId
 *   - Backend searches in userId field, which should match clientId
 *   - More efficient than fetching all attendances and filtering client-side
 *   - Returns array of Attendance objects directly (not wrapped in response object)
 */
export async function getAttendancesByCustomerId(
  customerId: string,
  params?: Omit<GetAllAttendancesParams, 'searchTerm'>
): Promise<Attendance[]> {
  try {
    if (!customerId || customerId.trim().length === 0) {
      return [];
    }

    // Use getAllAttendances with searchTerm set to customerId
    // Backend searches in userId field, which should match the customer's clientId
    const result = await getAllAttendances({
      ...params,
      searchTerm: customerId.trim(),
      size: params?.size || 100, // Default to 100 to get more records
    });

    // Filter results to ensure userId matches customerId (case-insensitive for safety)
    // The backend searchTerm should already filter, but we add an extra check
    const filteredAttendances = result.customers.filter(
      (attendance) => attendance.userId?.toLowerCase() === customerId.toLowerCase()
    );

    return filteredAttendances;
  } catch (error: any) {
    // If error is 404 or empty result, return empty array instead of throwing
    if (error?.response?.status === 404) {
      return [];
    }

    // Log error in development
    if (import.meta.env.DEV) {
      console.error('[getAttendancesByCustomerId] Error fetching attendances:', error);
    }

    // Re-throw other errors
    throw error;
  }
}

/**
 * Get attendance by ID (user ID)
 * 
 * @endpoint GET /Attendances/{id}
 * @method GET
 * @requires Authentication Yes (x-auth-token header)
 * 
 * @param {string} id - Attendance ID (MongoDB ObjectId, validated by ParseObjectIdPipe)
 * 
 * @returns {Promise<AttendanceResponse>} Attendance data
 *   - Backend returns: AttendanceDocument
 *   - Structure matches Attendance interface
 * 
 * @throws {ApiError} If fetch fails
 * @throws {NotFoundException} If attendance not found (404)
 * 
 * @note API Integration Details:
 *   - Backend uses ParseObjectIdPipe to validate and convert id to ObjectId
 *   - Backend service method: getAttendanceByUserId(gymId, id)
 *   - Backend automatically filters by gymId from JWT token for security
 *   - Returns single AttendanceDocument or throws NotFoundException
 */
export async function getAttendanceById(id: string): Promise<AttendanceResponse> {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    if (!id) {
      throw new ApiError(
        'Attendance ID is required',
        400,
        { url: `/Attendances/${id}`, method: 'GET', gymId }
      );
    }

    const response = await axiosInstance.get<ApiResponse<AttendanceResponse>>(
      `/Attendances/${id}`
    );

    const data = validateApiResponse(response.data, `/Attendances/${id}`, 'GET', gymId);
    
    // Backend returns: AttendanceDocument
    return data as AttendanceResponse;
  } catch (error: any) {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    if (error?.response) {
      throw createApiErrorFromAxiosError(error, gymId);
    }

    throw new ApiError(
      error?.message || 'Failed to fetch attendance',
      500,
      { url: `/Attendances/${id}`, method: 'GET', gymId }
    );
  }
}

/**
 * Create a new attendance (test endpoint)
 * 
 * @endpoint POST /Attendances/create-test
 * @method POST
 * @requires Authentication Yes (x-auth-token header)
 * 
 * @param {CreateAttendanceDto} payload - Attendance data
 *   - userId: string (required) - PersonID / userId assigned on device (clientId)
 *   - attendedDateTime: string (required) - ISO timestamp (YYYY-MM-DDTHH:mm:ss format)
 *   - isCustomer: boolean (required) - Is this a customer (true) or employee (false)
 *   - isAllowed: boolean (required) - Whether device allowed access
 *   - deviceSerial?: string - Device serial number
 *   - verifyMode?: string - Verification method (e.g., "FINGERPRINT" | "CARD" | "FACE")
 *   - eventType?: string - Event type from device
 *   - doorNo?: number - Door number (must be number, not string)
 *   - readerNo?: number - Reader number (must be number, not string)
 *   - eventDescription?: string - Event description
 * 
 * @returns {Promise<CreateAttendanceResponse>} Created attendance data
 *   - Backend returns: { success: boolean, message: string, data: AttendanceDocument }
 *   - Or directly returns: AttendanceDocument
 * 
 * @throws {ApiError} If creation fails
 * @throws {BadRequestException} If validation fails
 * 
 * @note API Integration Details:
 *   - Backend validates DTO using class-validator decorators
 *   - attendedDateTime must match format: YYYY-MM-DDTHH:mm:ss
 *   - Backend service checks for duplicate attendances before creating
 *   - Backend automatically sets gymId from JWT token (not in DTO)
 *   - Backend generates attendanceId automatically (A{YY}{MM}{####} format)
 *   - doorNo and readerNo must be numbers, not strings
 */
export async function createAttendance(payload: CreateAttendanceDto): Promise<CreateAttendanceResponse> {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    // Validate required fields
    if (!payload.userId || !payload.attendedDateTime) {
      throw new ApiError(
        'userId and attendedDateTime are required',
        400,
        { url: '/Attendances/create-test', method: 'POST', gymId }
      );
    }

    // Ensure doorNo and readerNo are numbers if provided
    const requestPayload: CreateAttendanceDto = {
      ...payload,
      doorNo: payload.doorNo !== undefined ? (typeof payload.doorNo === 'string' ? parseInt(payload.doorNo, 10) : payload.doorNo) : undefined,
      readerNo: payload.readerNo !== undefined ? (typeof payload.readerNo === 'string' ? parseInt(payload.readerNo, 10) : payload.readerNo) : undefined,
    };

    const response = await axiosInstance.post<ApiResponse<CreateAttendanceResponse | AttendanceResponse>>(
      '/Attendances/create-test',
      requestPayload
    );

    const data = validateApiResponse(response.data, '/Attendances/create-test', 'POST', gymId);
    
    // Backend may return: { success: boolean, message: string, data: AttendanceDocument }
    // Or directly: AttendanceDocument
    if (data && typeof data === 'object' && 'success' in data) {
      return data as CreateAttendanceResponse;
    }
    
    // If data is directly an AttendanceDocument, wrap it
    return {
      success: true,
      message: 'Attendance created successfully',
      data: data as AttendanceResponse,
    };
  } catch (error: any) {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const gymId = token ? getGymIdFromToken(token) : null;

    if (error?.response) {
      throw createApiErrorFromAxiosError(error, gymId);
    }

    throw new ApiError(
      error?.message || 'Failed to create attendance',
      500,
      { url: '/Attendances/create-test', method: 'POST', gymId }
    );
  }
}

