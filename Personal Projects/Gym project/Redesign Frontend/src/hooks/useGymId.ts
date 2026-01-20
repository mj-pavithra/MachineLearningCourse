import { useAuth } from './useAuth';
import { getGymIdFromToken } from '@/utils/jwt';
import { STORAGE_KEYS } from '@/utils/constants';

/**
 * Hook to get current gymId from authenticated user's token
 * SECURITY: Always extracts gymId from JWT token (never trusts stored values)
 */
export function useGymId(): string | null {
  const { user } = useAuth();
  
  if (!user?.token) {
    return null;
  }

  return getGymIdFromToken(user.token);
}

/**
 * Hook to get gymId from token (for use outside AuthContext)
 */
export function useGymIdFromToken(): string | null {
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  if (!token) {
    return null;
  }
  return getGymIdFromToken(token);
}


