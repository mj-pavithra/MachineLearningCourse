/**
 * Unit tests for dashboard API service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchDashboard } from '@/services/api/dashboard';
import { ApiError } from '@/services/api/types';
import axiosInstance from '@/services/api/client';

// Mock axios instance
vi.mock('@/services/api/client', () => ({
  default: {
    get: vi.fn(),
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;

describe('Dashboard API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('mock-token');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch dashboard data successfully', async () => {
    const mockData = {
      status: 'SUCCESS',
      message: 'Dashboard data retrieved',
      data: {
        client: { individual: 10, group: 5, pendingPayments: 2 },
        trainer: { partTime: 3, fullTime: 2 },
        paymentHistory: [],
      },
    };

    (axiosInstance.get as any).mockResolvedValue({ data: mockData });

    const result = await fetchDashboard();

    expect(result).toEqual(mockData.data);
    expect(axiosInstance.get).toHaveBeenCalledWith('/dashboard');
  });

  it('should throw ApiError when response status is FAIL', async () => {
    const mockResponse = {
      status: 'FAIL',
      message: 'Failed to fetch dashboard',
      data: null,
    };

    (axiosInstance.get as any).mockResolvedValue({ data: mockResponse });

    await expect(fetchDashboard()).rejects.toThrow(ApiError);
  });

  it('should handle 404 errors', async () => {
    const error = {
      response: {
        status: 404,
        data: { status: 'FAIL', message: 'Not found' },
      },
    };

    (axiosInstance.get as any).mockRejectedValue(error);

    await expect(fetchDashboard()).rejects.toThrow();
  });

  it('should handle network errors', async () => {
    const error = new Error('Network error');
    (axiosInstance.get as any).mockRejectedValue(error);

    await expect(fetchDashboard()).rejects.toThrow(ApiError);
  });
});

