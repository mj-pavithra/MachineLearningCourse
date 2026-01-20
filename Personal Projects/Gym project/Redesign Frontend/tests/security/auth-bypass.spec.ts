import { describe, it, expect, beforeEach, vi } from 'vitest';
import { validateToken, getGymIdFromToken, getIsAdminFromToken } from '@/utils/jwt';
import { STORAGE_KEYS } from '@/utils/constants';

/**
 * Security test suite for authentication bypass attempts
 */
describe('Authentication Bypass Security Tests', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('Token Validation', () => {
    it('should reject empty token', () => {
      const result = validateToken(null);
      expect(result.isValid).toBe(false);
      expect(result.isMalformed).toBe(true);
    });

    it('should reject malformed token (not 3 parts)', () => {
      const result = validateToken('invalid.token');
      expect(result.isValid).toBe(false);
      expect(result.isMalformed).toBe(true);
    });

    it('should reject expired token', () => {
      // Create an expired token (exp: past date)
      const expiredPayload = {
        exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        gymId: 'test-gym',
      };
      const expiredToken = `header.${btoa(JSON.stringify(expiredPayload))}.signature`;
      
      const result = validateToken(expiredToken);
      expect(result.isValid).toBe(false);
      expect(result.isExpired).toBe(true);
    });

    it('should accept valid token structure', () => {
      const validPayload = {
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        gymId: 'test-gym',
      };
      const validToken = `header.${btoa(JSON.stringify(validPayload))}.signature`;
      
      const result = validateToken(validToken);
      expect(result.isValid).toBe(true);
      expect(result.isExpired).toBe(false);
      expect(result.isMalformed).toBe(false);
    });
  });

  describe('GymId Extraction', () => {
    it('should extract gymId from valid token', () => {
      const payload = {
        gymId: 'test-gym-123',
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      const token = `header.${btoa(JSON.stringify(payload))}.signature`;
      
      const gymId = getGymIdFromToken(token);
      expect(gymId).toBe('test-gym-123');
    });

    it('should return null for token without gymId', () => {
      const payload = {
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      const token = `header.${btoa(JSON.stringify(payload))}.signature`;
      
      const gymId = getGymIdFromToken(token);
      expect(gymId).toBeNull();
    });

    it('should return null for malformed token', () => {
      const gymId = getGymIdFromToken('invalid.token');
      expect(gymId).toBeNull();
    });
  });

  describe('Admin Role Validation', () => {
    it('should extract isAdmin flag from token', () => {
      const payload = {
        isAdmin: true,
        gymId: 'test-gym',
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      const token = `header.${btoa(JSON.stringify(payload))}.signature`;
      
      const isAdmin = getIsAdminFromToken(token);
      expect(isAdmin).toBe(true);
    });

    it('should return false for non-admin token', () => {
      const payload = {
        isAdmin: false,
        gymId: 'test-gym',
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      const token = `header.${btoa(JSON.stringify(payload))}.signature`;
      
      const isAdmin = getIsAdminFromToken(token);
      expect(isAdmin).toBe(false);
    });

    it('should return false for token without isAdmin flag', () => {
      const payload = {
        gymId: 'test-gym',
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      const token = `header.${btoa(JSON.stringify(payload))}.signature`;
      
      const isAdmin = getIsAdminFromToken(token);
      expect(isAdmin).toBe(false);
    });
  });
});

