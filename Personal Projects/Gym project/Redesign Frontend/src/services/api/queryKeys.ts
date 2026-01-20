/**
 * Centralized React Query key factory
 * Ensures consistent query key naming across the application
 * 
 * Pattern: ["<resource>", params]
 * 
 * @module QueryKeys
 */

import type { FetchClientPaymentsParams } from './finances';
import type { FetchSessionsParams } from '@/types/session';

export const queryKeys = {
  /**
   * Dashboard query keys
   */
  dashboard: {
    all: ['dashboard'] as const,
    detail: () => ['dashboard'] as const,
    kpis: (range?: { from: string; to: string }) => ['dashboard', 'kpis', range] as const,
    earnings: (range?: { from: string; to: string }) => ['dashboard', 'earnings', range] as const,
    payments: (params?: { page?: number; size?: number; filters?: any }) => ['dashboard', 'payments', params] as const,
    attendance: (date?: string) => ['dashboard', 'attendance', date] as const,
    activity: (params?: { page?: number; size?: number }) => ['dashboard', 'activity', params] as const,
  },

  /**
   * Customers query keys
   */
  customers: {
    all: ['customers'] as const,
    lists: () => ['customers', 'list'] as const,
    list: (params?: { page?: number; limit?: number; search?: string; type?: 'individual' | 'group' }) =>
      ['customers', params || {}] as const,
    individual: (params?: { page?: number; limit?: number; search?: string }) =>
      ['customers', 'individual', params || {}] as const,
    group: (params?: { page?: number; limit?: number; search?: string }) =>
      ['customers', 'group', params || {}] as const,
    detail: (id: string) => ['customers', id] as const,
    profile: {
      detail: (clientId: string) => ['customers', 'profile', clientId, 'detail'] as const,
      emergencyContacts: (clientId: string) => ['customers', 'profile', clientId, 'emergency-contacts'] as const,
      bodyConditions: (clientId: string) => ['customers', 'profile', clientId, 'body-conditions'] as const,
      payments: (clientId: string, params?: { page?: number; size?: number }) =>
        ['customers', 'profile', clientId, 'payments', params || {}] as const,
      attendance: (clientId: string, params?: { startDate?: string; endDate?: string }) =>
        ['customers', 'profile', clientId, 'attendance', params || {}] as const,
    },
  },

  /**
   * Trainers query keys
   */
  trainers: {
    all: ['trainers'] as const,
    lists: () => ['trainers', 'list'] as const,
    list: (params?: { page?: number; size?: number; search?: string; type?: 'part-time' | 'full-time'; status?: 'active' | 'inactive' }) =>
      ['trainers', params || {}] as const,
    detail: (id: string) => ['trainers', id] as const,
  },

  /**
   * Packages query keys
   */
  packages: {
    all: ['packages'] as const,
    lists: () => ['packages', 'list'] as const,
    list: () => ['packages'] as const,
    detail: (id: string) => ['packages', id] as const,
  },

  /**
   * Equipment query keys
   */
  equipment: {
    all: ['equipment'] as const,
    lists: () => ['equipment', 'list'] as const,
    list: (params?: { page?: number; size?: number; search?: string; type?: string; status?: string }) =>
      ['equipment', params || {}] as const,
    detail: (id: string) => ['equipment', id] as const,
  },

  /**
   * Finances query keys
   */
  finances: {
    all: ['finances'] as const,
    clientPayments: {
      all: ['client-payments'] as const,
      lists: () => ['client-payments', 'list'] as const,
      list: (params?: FetchClientPaymentsParams) =>
        ['client-payments', params || {}] as const,
      detail: (id: string) => ['client-payments', id] as const,
    },
    trainerSalaries: {
      all: ['trainer-salaries'] as const,
      lists: () => ['trainer-salaries', 'list'] as const,
      list: (params?: { page?: number; size?: number; month?: number; year?: number; trainerId?: string; status?: string }) =>
        ['trainer-salaries', params || {}] as const,
      detail: (id: string) => ['trainer-salaries', id] as const,
    },
  },

  /**
   * Sessions query keys
   */
  sessions: {
    all: ['sessions'] as const,
    lists: () => ['sessions', 'list'] as const,
    list: (params?: FetchSessionsParams) =>
      ['sessions', params || {}] as const,
    detail: (id: string) => ['sessions', id] as const,
  },

  /**
   * Attendance query keys
   */
  attendance: {
    all: ['attendance'] as const,
    daily: (params: { startDate: string; endDate: string }) =>
      ['attendance', 'daily', params] as const,
    lists: () => ['attendance', 'list'] as const,
    detail: (id: string) => ['attendance', id] as const,
  },
} as const;

/**
 * Helper to invalidate all queries for a resource
 * Usage: queryClient.invalidateQueries({ queryKey: queryKeys.customers.all })
 */
export type QueryKeys = typeof queryKeys;

