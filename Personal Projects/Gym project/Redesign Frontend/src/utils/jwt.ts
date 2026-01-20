import { decodeJwt } from 'jose';

/**
 * Extract gymId from JWT token payload
 * SECURITY: Always extract gymId from JWT (never trust stored values)
 */
export const getGymIdFromToken = (token: string): string | null => {
  try {
    const decoded = decodeJwt(token);
    return (decoded.gymId as string) || null;
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return null;
  }
};

/**
 * Extract gym name from JWT token payload
 * Falls back to gymId if gymName is not available
 */
export const getGymNameFromToken = (token: string): string | null => {
  try {
    const decoded = decodeJwt(token);
    return (decoded.gymName as string) || (decoded.gymId as string) || null;
  } catch (error) {
    console.error('Error decoding JWT token for gym name:', error);
    return null;
  }
};

/**
 * Extract user name from JWT token payload
 * Returns formatted name from firstName and lastName
 */
export const getUserNameFromToken = (token: string): string | null => {
  try {
    const decoded = decodeJwt(token);
    const firstName = (decoded.firstName as string) || '';
    const lastName = (decoded.lastName as string) || '';
    const name = `${firstName} ${lastName}`.trim();
    return name || (decoded.name as string) || (decoded.email as string) || null;
  } catch (error) {
    console.error('Error decoding JWT token for user name:', error);
    return null;
  }
};

/**
 * Check if JWT token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = decodeJwt(token);
    if (!decoded.exp) {
      return false; // No expiration claim
    }
    return Date.now() >= decoded.exp * 1000;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true; // Assume expired if we can't decode
  }
};

/**
 * Validate JWT token structure and expiration
 * SECURITY: Strict validation before allowing requests
 * @param token - JWT token string
 * @returns Object with validation result and decoded token if valid
 */
export const validateToken = (token: string | null): {
  isValid: boolean;
  isExpired: boolean;
  isMalformed: boolean;
  decoded?: any;
  error?: string;
} => {
  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    return {
      isValid: false,
      isExpired: false,
      isMalformed: true,
      error: 'Token is missing or empty',
    };
  }

  // Basic JWT structure check (should have 3 parts separated by dots)
  const parts = token.split('.');
  if (parts.length !== 3) {
    return {
      isValid: false,
      isExpired: false,
      isMalformed: true,
      error: 'Token has invalid structure',
    };
  }

  try {
    const decoded = decodeJwt(token);
    
    // Check expiration
    const expired = decoded.exp ? Date.now() >= decoded.exp * 1000 : false;
    
    if (expired) {
      return {
        isValid: false,
        isExpired: true,
        isMalformed: false,
        decoded,
        error: 'Token has expired',
      };
    }

    return {
      isValid: true,
      isExpired: false,
      isMalformed: false,
      decoded,
    };
  } catch (error) {
    return {
      isValid: false,
      isExpired: false,
      isMalformed: true,
      error: error instanceof Error ? error.message : 'Failed to decode token',
    };
  }
};

/**
 * Log token payload structure for debugging (development only)
 * Helps developers see what fields are actually in the token
 * 
 * @param token - JWT token string
 * @returns Decoded token payload or null if decoding fails
 */
export const logTokenPayload = (token: string): any | null => {
  if (!import.meta.env.DEV) {
    return null; // Only log in development
  }
  
  try {
    const decoded = decodeJwt(token);
    console.debug('[Token Payload] Full token structure:', {
      allFields: Object.keys(decoded),
      payload: decoded,
      isAdmin: decoded.isAdmin,
      IsAdmin: (decoded as any).IsAdmin,
      is_admin: (decoded as any).is_admin,
      admin: (decoded as any).admin,
      gymId: decoded.gymId,
      email: (decoded as any).email,
      _id: (decoded as any)._id,
      sub: decoded.sub,
    });
    return decoded;
  } catch (error) {
    console.error('[Token Payload] Error decoding token:', error);
    return null;
  }
};

/**
 * Extract isAdmin flag from JWT token
 * SECURITY: Always extract from token, never trust stored values
 * 
 * Handles various formats:
 * - Boolean: true/false
 * - String: "true"/"True"/"TRUE" or "false"/"False"/"FALSE"
 * - Number: 1 (true) or 0 (false)
 * - Alternative field names: IsAdmin, is_admin, admin
 * 
 * @param token - JWT token string
 * @returns boolean indicating if user is admin
 */
export const getIsAdminFromToken = (token: string): boolean => {
  try {
    const decoded = decodeJwt(token);
    
    // Check for isAdmin field (primary field name)
    let isAdminValue = decoded.isAdmin;
    
    // If not found, check alternative field names
    if (isAdminValue === undefined || isAdminValue === null) {
      isAdminValue = (decoded as any).IsAdmin || 
                     (decoded as any).is_admin || 
                     (decoded as any).admin;
    }
    
    // If still not found, check user_type field
    if (isAdminValue === undefined || isAdminValue === null) {
      const userType = (decoded as any).user_type;
      if (userType && typeof userType === 'string') {
        const normalizedUserType = userType.toLowerCase().trim();
        // Check if user_type indicates admin status
        if (normalizedUserType === 'admin' || normalizedUserType === 'administrator') {
          return true;
        }
      }
    }
    
    // Handle various value types
    if (isAdminValue === undefined || isAdminValue === null) {
      // Field not found - default to false
      if (import.meta.env.DEV) {
        console.debug('[getIsAdminFromToken] isAdmin field not found in token. Available fields:', Object.keys(decoded));
      }
      return false;
    }
    
    // Handle boolean
    if (typeof isAdminValue === 'boolean') {
      return isAdminValue === true;
    }
    
    // Handle string (case-insensitive)
    if (typeof isAdminValue === 'string') {
      const normalized = isAdminValue.toLowerCase().trim();
      if (normalized === 'true' || normalized === '1') {
        return true;
      }
      if (normalized === 'false' || normalized === '0') {
        return false;
      }
      // Log unexpected string value in development
      if (import.meta.env.DEV) {
        console.warn('[getIsAdminFromToken] Unexpected string value for isAdmin:', isAdminValue);
      }
      return false;
    }
    
    // Handle number (1 = true, 0 = false)
    if (typeof isAdminValue === 'number') {
      return isAdminValue === 1 || isAdminValue > 0;
    }
    
    // Fallback: use Boolean conversion
    const result = Boolean(isAdminValue);
    
    // Debug logging in development mode
    if (import.meta.env.DEV) {
      console.debug('[getIsAdminFromToken] Token payload:', {
        isAdmin: decoded.isAdmin,
        IsAdmin: (decoded as any).IsAdmin,
        is_admin: (decoded as any).is_admin,
        admin: (decoded as any).admin,
        resolvedValue: isAdminValue,
        resolvedType: typeof isAdminValue,
        finalResult: result,
      });
    }
    
    return result;
  } catch (error) {
    console.error('[getIsAdminFromToken] Error extracting isAdmin from token:', error);
    return false;
  }
};


