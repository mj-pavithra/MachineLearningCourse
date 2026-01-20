import { useCallback } from 'react';
import { useGymId } from './useGymId';
import { cacheHelpers } from '@/services/cache/localStorageCache';

/**
 * Hook for cache management with gymId
 */
export function useCache() {
  const gymId = useGymId();

  const getCache = useCallback(<T,>(type: keyof typeof cacheHelpers): T | null => {
    if (!gymId) return null;
    return cacheHelpers[type].get<T>(gymId);
  }, [gymId]);

  const setCache = useCallback(<T,>(type: keyof typeof cacheHelpers, data: T, ttl?: number): void => {
    if (!gymId) return;
    cacheHelpers[type].set(gymId, data, ttl);
  }, [gymId]);

  const clearCache = useCallback((type: keyof typeof cacheHelpers): void => {
    if (!gymId) return;
    cacheHelpers[type].clear(gymId);
  }, [gymId]);

  return {
    getCache,
    setCache,
    clearCache,
    gymId,
  };
}


