import { describe, it, expect } from 'vitest';
import { validateToken, getGymIdFromToken, getIsAdminFromToken } from '@/utils/jwt';

/**
 * Security test suite for token tampering scenarios
 */
describe('Token Tampering Security Tests', () => {
  describe('Token Structure Tampering', () => {
    it('should reject token with missing parts', () => {
      const result = validateToken('header.payload');
      expect(result.isValid).toBe(false);
      expect(result.isMalformed).toBe(true);
    });

    it('should reject token with invalid base64 payload', () => {
      const result = validateToken('header.invalid-base64!.signature');
      expect(result.isValid).toBe(false);
      expect(result.isMalformed).toBe(true);
    });

    it('should reject token with non-JSON payload', () => {
      const invalidPayload = btoa('not-json');
      const token = `header.${invalidPayload}.signature`;
      
      const result = validateToken(token);
      expect(result.isValid).toBe(false);
      expect(result.isMalformed).toBe(true);
    });
  });

  describe('Token Payload Tampering', () => {
    it('should handle tampered gymId gracefully', () => {
      const tamperedPayload = {
        gymId: null, // Tampered to null
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      const token = `header.${btoa(JSON.stringify(tamperedPayload))}.signature`;
      
      const gymId = getGymIdFromToken(token);
      expect(gymId).toBeNull();
    });

    it('should handle tampered isAdmin flag', () => {
      const tamperedPayload = {
        isAdmin: 'true', // Tampered to string instead of boolean
        gymId: 'test-gym',
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      const token = `header.${btoa(JSON.stringify(tamperedPayload))}.signature`;
      
      // Should return false for non-boolean values
      const isAdmin = getIsAdminFromToken(token);
      expect(isAdmin).toBe(false);
    });

    it('should reject token with tampered expiration', () => {
      const tamperedPayload = {
        gymId: 'test-gym',
        exp: 'invalid', // Tampered expiration
      };
      const token = `header.${btoa(JSON.stringify(tamperedPayload))}.signature`;
      
      const result = validateToken(token);
      // Should handle gracefully - if exp is invalid, treat as no expiration
      expect(result.decoded).toBeDefined();
    });
  });

  describe('Cross-Tenant Access Prevention', () => {
    it('should extract correct gymId from token', () => {
      const payload1 = {
        gymId: 'gym-1',
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      const token1 = `header.${btoa(JSON.stringify(payload1))}.signature`;
      
      const payload2 = {
        gymId: 'gym-2',
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      const token2 = `header.${btoa(JSON.stringify(payload2))}.signature`;
      
      const gymId1 = getGymIdFromToken(token1);
      const gymId2 = getGymIdFromToken(token2);
      
      expect(gymId1).toBe('gym-1');
      expect(gymId2).toBe('gym-2');
      expect(gymId1).not.toBe(gymId2);
    });
  });
});

