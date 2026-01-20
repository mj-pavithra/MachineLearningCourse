/**
 * Unit tests for prefetcher functions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import * as prefetchers from '@/routes/prefetchers';
import * as apiServices from '@/services/api';

// Mock API services
vi.mock('@/services/api/dashboard', () => ({
  fetchDashboard: vi.fn().mockResolvedValue({ client: {}, trainer: {}, paymentHistory: [] }),
}));

vi.mock('@/services/api/customers', () => ({
  fetchCustomersList: vi.fn().mockResolvedValue({ customers: [], total: 0, page: 1, limit: 10 }),
}));

vi.mock('@/services/api/trainers', () => ({
  fetchTrainers: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, size: 20 }),
}));

vi.mock('@/services/api/packages', () => ({
  fetchPackages: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/services/api/equipment', () => ({
  fetchEquipment: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, size: 20 }),
}));

vi.mock('@/services/api/finances', () => ({
  fetchClientPayments: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, size: 20 }),
  fetchTrainerSalaries: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, size: 20 }),
}));

vi.mock('@/services/api/sessions', () => ({
  fetchSessions: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, size: 20 }),
}));

describe('Prefetchers', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  it('should prefetch dashboard data', async () => {
    await prefetchers.prefetchDashboard(queryClient);
    
    const data = queryClient.getQueryData(['dashboard']);
    expect(data).toBeDefined();
  });

  it('should prefetch customers data', async () => {
    await prefetchers.prefetchCustomers(queryClient);
    
    const data = queryClient.getQueryData(['customers', { page: 1 }]);
    expect(data).toBeDefined();
  });

  it('should handle prefetch errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    // Mock a failing prefetch
    vi.mocked(apiServices.fetchDashboard).mockRejectedValueOnce(new Error('Network error'));
    
    await prefetchers.prefetchDashboard(queryClient);
    
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

