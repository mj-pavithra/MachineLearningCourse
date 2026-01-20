import { CACHE_PREFIX, getCacheKeys } from '@/utils/cache';
import { CACHE_TTL } from '@/utils/constants';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Multi-tenant localStorage cache utilities
 * All cache keys include gymId to enforce data isolation
 */

export const getCache = <T>(key: string): T | null => {
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      return null;
    }

    const entry: CacheEntry<T> = JSON.parse(item);
    const now = Date.now();

    // Check if cache is expired
    if (now - entry.timestamp > entry.ttl) {
      localStorage.removeItem(key);
      return null;
    }

    return entry.data;
  } catch (error) {
    console.error(`Error reading cache for key ${key}:`, error);
    return null;
  }
};

export const setCache = <T>(key: string, data: T, ttl: number = CACHE_TTL.DASHBOARD): void => {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (error) {
    console.error(`Error setting cache for key ${key}:`, error);
    // Handle quota exceeded error
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('LocalStorage quota exceeded. Clearing old caches...');
      clearAllCaches();
    }
  }
};

export const clearCache = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error clearing cache for key ${key}:`, error);
  }
};

/**
 * Clear all caches with the gymapp- prefix
 * Called on logout to ensure multi-tenant data isolation
 */
export const clearAllCaches = (): void => {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error('Error clearing all caches:', error);
  }
};

/**
 * Clear caches for a specific gymId
 */
export const clearGymCaches = (gymId: string): void => {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes(`-cache-${gymId}`)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error(`Error clearing caches for gymId ${gymId}:`, error);
  }
};

// Convenience functions for each cache type
export const cacheHelpers = {
  dashboard: {
    get: <T>(gymId: string): T | null => getCache<T>(getCacheKeys.dashboard(gymId)),
    set: <T>(gymId: string, data: T, ttl?: number): void => 
      setCache(getCacheKeys.dashboard(gymId), data, ttl || CACHE_TTL.DASHBOARD),
    clear: (gymId: string): void => clearCache(getCacheKeys.dashboard(gymId)),
  },
  customers: {
    get: <T>(gymId: string): T | null => getCache<T>(getCacheKeys.customers(gymId)),
    set: <T>(gymId: string, data: T, ttl?: number): void => 
      setCache(getCacheKeys.customers(gymId), data, ttl || CACHE_TTL.CUSTOMERS),
    clear: (gymId: string): void => clearCache(getCacheKeys.customers(gymId)),
  },
  trainers: {
    get: <T>(gymId: string): T | null => getCache<T>(getCacheKeys.trainers(gymId)),
    set: <T>(gymId: string, data: T, ttl?: number): void => 
      setCache(getCacheKeys.trainers(gymId), data, ttl || CACHE_TTL.TRAINERS),
    clear: (gymId: string): void => clearCache(getCacheKeys.trainers(gymId)),
  },
  packages: {
    get: <T>(gymId: string): T | null => getCache<T>(getCacheKeys.packages(gymId)),
    set: <T>(gymId: string, data: T, ttl?: number): void => 
      setCache(getCacheKeys.packages(gymId), data, ttl || CACHE_TTL.PACKAGES),
    clear: (gymId: string): void => clearCache(getCacheKeys.packages(gymId)),
  },
  equipment: {
    get: <T>(gymId: string): T | null => getCache<T>(getCacheKeys.equipment(gymId)),
    set: <T>(gymId: string, data: T, ttl?: number): void => 
      setCache(getCacheKeys.equipment(gymId), data, ttl || CACHE_TTL.EQUIPMENT),
    clear: (gymId: string): void => clearCache(getCacheKeys.equipment(gymId)),
  },
  finances: {
    get: <T>(gymId: string): T | null => getCache<T>(getCacheKeys.finances(gymId)),
    set: <T>(gymId: string, data: T, ttl?: number): void => 
      setCache(getCacheKeys.finances(gymId), data, ttl || CACHE_TTL.FINANCES),
    clear: (gymId: string): void => clearCache(getCacheKeys.finances(gymId)),
  },
  sessions: {
    get: <T>(gymId: string): T | null => getCache<T>(getCacheKeys.sessions(gymId)),
    set: <T>(gymId: string, data: T, ttl?: number): void => 
      setCache(getCacheKeys.sessions(gymId), data, ttl || CACHE_TTL.SESSIONS),
    clear: (gymId: string): void => clearCache(getCacheKeys.sessions(gymId)),
  },
};


