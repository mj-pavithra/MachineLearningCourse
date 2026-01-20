/**
 * Application constants
 */

export const APP_NAME = import.meta.env.VITE_APP_NAME || 'PayZhe';
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.payzhe.fit/api/v1';

// Cache TTL (Time To Live) in milliseconds
export const CACHE_TTL = {
  DASHBOARD: 5 * 60 * 1000, // 5 minutes
  CUSTOMERS: 10 * 60 * 1000, // 10 minutes
  TRAINERS: 10 * 60 * 1000, // 10 minutes
  PACKAGES: 15 * 60 * 1000, // 15 minutes
  EQUIPMENT: 15 * 60 * 1000, // 15 minutes
  FINANCES: 5 * 60 * 1000, // 5 minutes
  SESSIONS: 2 * 60 * 1000, // 2 minutes
};

// LocalStorage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'x-auth-token',
  REFRESH_TOKEN: 'refresh-token',
  COLOR_MODE: 'chakra-ui-color-mode',
};


