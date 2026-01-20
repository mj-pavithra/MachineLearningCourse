import axiosInstance from './client';
import { LoginRequest, LoginResponse } from '@/types/auth';
import { ApiResponse, createApiErrorFromAxiosError } from './types';
import { getGymIdFromToken } from '@/utils/jwt';
import { STORAGE_KEYS, API_BASE_URL } from '@/utils/constants';

/**
 * Authentication API service
 * 
 * @module AuthAPI
 * 
 * Note: Auth endpoints return FAIL status instead of throwing errors
 * to allow UI to handle authentication failures gracefully
 */

/**
 * Helper function to detect connection refused errors and generate user-friendly messages
 * 
 * @param error - The error object from axios
 * @param defaultMessage - Default error message if not a connection error
 * @returns User-friendly error message
 */
function getNetworkErrorMessage(error: any, defaultMessage: string = 'Network error. Please check your connection and try again.'): string {
  if (!error) {
    return defaultMessage;
  }

  const errorMessage = error?.message || '';
  const errorCode = error?.code || '';
  
  // Check for connection refused errors
  const isConnectionRefused = 
    errorMessage.includes('ERR_CONNECTION_REFUSED') ||
    errorMessage.includes('ECONNREFUSED') ||
    errorCode === 'ECONNREFUSED' ||
    errorCode === 'ERR_CONNECTION_REFUSED' ||
    (error?.request && !error?.response && errorMessage.includes('Network Error'));

  if (isConnectionRefused) {
    return `Cannot connect to the server. Please ensure the backend server is running at ${API_BASE_URL}`;
  }

  // Check for other network errors
  if (errorMessage.includes('CORS') || errorMessage.includes('Failed to fetch') || errorMessage.includes('ERR_FAILED')) {
    return 'Connection error. Please ensure the server is running and CORS is configured correctly.';
  }

  // Return the original error message or default
  return errorMessage || defaultMessage;
}

export const authApi = {
  /**
   * Sign in with email and password
   * 
   * @endpoint POST /admin/admin-management/login
   * @method POST
   * @requires Authentication No (public endpoint)
   * 
   * @param {LoginRequest} data - Login credentials:
   *   - email: string - User email
   *   - password: string - User password
   *   - rememberMe?: boolean - Remember user session
   * 
   * @returns {Promise<LoginResponse>} Login response with status, message, and data:
   *   - status: 'SUCCESS' | 'FAIL'
   *   - message: string - Response message
   *   - data?: { idToken: string, refreshToken: string, user: User } - Auth tokens and user data on success
   * 
   * @example
   * ```typescript
   * const result = await authApi.signIn({ email: 'user@example.com', password: 'password' });
   * if (result.status === 'SUCCESS') {
   *   // Store tokens and redirect
   * }
   * ```
   */
  signIn: async (data: LoginRequest): Promise<LoginResponse> => {
    try {
      const response = await axiosInstance.post<LoginResponse>(
        '/admin/admin-management/login',
        {
          email: data.email,
          password: data.password,
          rememberMe: data.rememberMe,
        }
      );
      return response.data;
    } catch (error: any) {
      // Handle network errors (CORS, connection issues, etc.)
      if (!error.response) {
        return {
          status: 'FAIL',
          message: getNetworkErrorMessage(error, 'Network error. Please check your connection and try again.'),
          data: undefined,
        };
      }

      // Handle API response errors
      const errorMessage = 
        error?.response?.data?.message ||
        error?.message ||
        error?.response?.data?.error ||
        'Invalid email or password. Please try again.';

      return {
        status: 'FAIL',
        message: errorMessage,
        data: undefined,
      };
    }
  },

  /**
   * Request password reset email
   * 
   * @endpoint POST /admin/admin-management/forgot-password
   * @method POST
   * @requires Authentication No (public endpoint)
   * 
   * @param {string} email - User email address
   * @returns {Promise<ApiResponse<null>>} Response with status and message
   * 
   * @example
   * ```typescript
   * const result = await authApi.forgotPassword('user@example.com');
   * if (result.status === 'SUCCESS') {
   *   // Show success message
   * }
   * ```
   */
  forgotPassword: async (email: string): Promise<ApiResponse<null>> => {
    try {
      const response = await axiosInstance.post<ApiResponse<null>>(
        '/admin/admin-management/forgot-password',
        { email }
      );
      return response.data;
    } catch (error: any) {
      const gymId = null; // No token for public endpoint
      if (error?.response) {
        const apiError = createApiErrorFromAxiosError(error, gymId);
        return {
          status: 'FAIL' as const,
          message: apiError.message,
          data: null,
        };
      }
      return {
        status: 'FAIL' as const,
        message: getNetworkErrorMessage(error, 'Failed to send reset email'),
        data: null,
      };
    }
  },

  /**
   * Reset password with reset token
   * 
   * @endpoint PATCH /admin/admin-management/reset-password
   * @method PATCH
   * @requires Authentication No (uses token in header instead)
   * 
   * @param {Object} params - Reset password parameters:
   *   - newPassword: string - New password
   *   - token: string - Password reset token (sent via email)
   * 
   * @returns {Promise<ApiResponse<null>>} Response with status and message
   * 
   * @example
   * ```typescript
   * const result = await authApi.resetPassword({ 
   *   newPassword: 'newPassword123', 
   *   token: 'reset-token-from-email' 
   * });
   * ```
   */
  resetPassword: async ({
    newPassword,
    token,
  }: {
    newPassword: string;
    token: string;
  }): Promise<ApiResponse<null>> => {
    try {
      const response = await axiosInstance.patch<ApiResponse<null>>(
        '/admin/admin-management/reset-password',
        {
          password: newPassword,
          confirmPassword: newPassword,
        },
        {
          headers: {
            'x-auth-token': token,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      const gymId = null; // Token might not be valid JWT
      if (error?.response) {
        const apiError = createApiErrorFromAxiosError(error, gymId);
        return {
          status: 'FAIL' as const,
          message: apiError.message,
          data: null,
        };
      }
      return {
        status: 'FAIL' as const,
        message: getNetworkErrorMessage(error, 'Failed to reset password'),
        data: null,
      };
    }
  },

  /**
   * Change password for authenticated user
   * 
   * @endpoint PATCH /admin/admin-management/reset-password
   * @method PATCH
   * @requires Authentication Yes (x-auth-token header)
   * 
   * @param {Object} params - Change password parameters:
   *   - oldPassword: string - Current password
   *   - newPassword: string - New password
   *   - confirmPassword: string - Confirm new password
   * 
   * @returns {Promise<ApiResponse<null>>} Response with status and message
   * 
   * @example
   * ```typescript
   * const result = await authApi.changePassword({
   *   oldPassword: 'oldPass123',
   *   newPassword: 'newPass123',
   *   confirmPassword: 'newPass123'
   * });
   * ```
   */
  changePassword: async ({
    oldPassword,
    newPassword,
    confirmPassword,
  }: {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<ApiResponse<null>> => {
    try {
      const response = await axiosInstance.patch<ApiResponse<null>>(
        '/admin/admin-management/change-password',
        {
          oldPassword,
          newPassword,
          confirmPassword,
        }
      );
      return response.data;
    } catch (error: any) {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const gymId = token ? getGymIdFromToken(token) : null;

      if (error?.response) {
        const apiError = createApiErrorFromAxiosError(error, gymId);
        return {
          status: 'FAIL' as const,
          message: apiError.message,
          data: null,
        };
      }
      return {
        status: 'FAIL' as const,
        message: getNetworkErrorMessage(error, 'Failed to change password'),
        data: null,
      };
    }
  },

  /**
   * Register a new admin user
   * 
   * @endpoint POST /admin/admin-management/register
   * @method POST
   * @requires Authentication No (public endpoint)
   * 
   * @param {Object} data - Registration data:
   *   - firstName: string
   *   - lastName: string
   *   - email: string
   *   - mobile: string
   *   - password: string
   *   - isAdmin: boolean
   *   - nic: string
   *   - isFullTime: boolean
   * 
   * @returns {Promise<LoginResponse>} Registration response with tokens on success
   * 
   * @example
   * ```typescript
   * const result = await authApi.register({
   *   firstName: 'John',
   *   lastName: 'Doe',
   *   email: 'john@example.com',
   *   mobile: '1234567890',
   *   password: 'password123',
   *   isAdmin: true,
   *   nic: '123456789V',
   *   isFullTime: true,
   * });
   * ```
   */
  register: async (data: {
    firstName: string;
    lastName: string;
    email: string;
    mobile: string;
    password: string;
    isAdmin: boolean;
    nic: string;
    isFullTime: boolean;
  }): Promise<LoginResponse> => {
    try {
      const response = await axiosInstance.post<LoginResponse>(
        '/admin/admin-management/register',
        data
      );
      return response.data;
    } catch (error: any) {
      // Handle network errors
      if (!error.response) {
        return {
          status: 'FAIL',
          message: getNetworkErrorMessage(error, 'Registration failed. Please try again.'),
          data: undefined,
        };
      }

      // Handle API response errors
      const errorMessage = 
        error?.response?.data?.message ||
        error?.message ||
        error?.response?.data?.error ||
        'Registration failed. Please try again.';

      return {
        status: 'FAIL',
        message: errorMessage,
        data: undefined,
      };
    }
  },

  /**
   * Logout user and revoke session
   * 
   * @endpoint POST /admin/admin-management/logout
   * @method POST
   * @requires Authentication Yes (x-auth-token header)
   * @requires Admin Yes (admin-only endpoint)
   * 
   * @returns {Promise<ApiResponse<null>>} Logout response
   * 
   * @example
   * ```typescript
   * const result = await authApi.logout();
   * if (result.status === 'SUCCESS') {
   *   // Clear local storage and redirect
   * }
   * ```
   */
  logout: async (): Promise<ApiResponse<null>> => {
    try {
      const response = await axiosInstance.post<ApiResponse<null>>(
        '/admin/admin-management/logout'
      );
      
      // Clear tokens after successful logout
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      
      return response.data;
    } catch (error: any) {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const gymId = token ? getGymIdFromToken(token) : null;

      // Even if logout fails, clear local tokens
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);

      if (error?.response) {
        const apiError = createApiErrorFromAxiosError(error, gymId);
        return {
          status: 'FAIL' as const,
          message: apiError.message,
          data: null,
        };
      }
      return {
        status: 'FAIL' as const,
        message: getNetworkErrorMessage(error, 'Logout failed'),
        data: null,
      };
    }
  },
};


