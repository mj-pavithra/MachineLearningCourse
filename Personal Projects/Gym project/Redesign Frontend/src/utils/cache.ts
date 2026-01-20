/**
 * Cache key generation utilities
 * All cache keys are prefixed with 'gymapp-' and include gymId for multi-tenant isolation
 */

export const CACHE_PREFIX = 'gymapp-';

export const generateCacheKey = (type: string, gymId: string): string => {
  return `${CACHE_PREFIX}${type}-cache-${gymId}`;
};

export const getCacheKeys = {
  dashboard: (gymId: string) => generateCacheKey('dashboard', gymId),
  customers: (gymId: string) => generateCacheKey('customers', gymId),
  trainers: (gymId: string) => generateCacheKey('trainers', gymId),
  packages: (gymId: string) => generateCacheKey('packages', gymId),
  equipment: (gymId: string) => generateCacheKey('equipment', gymId),
  finances: (gymId: string) => generateCacheKey('finances', gymId),
  sessions: (gymId: string) => generateCacheKey('sessions', gymId),
};


