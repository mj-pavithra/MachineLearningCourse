import { QueryClient } from '@tanstack/react-query';
import { fetchDashboard } from '@/services/api/dashboard';
import { fetchCustomersList } from '@/services/api/customers';
import { fetchTrainers } from '@/services/api/trainers';
import { fetchPackages } from '@/services/api/packages';
import { fetchEquipment } from '@/services/api/equipment';
import { fetchClientPayments, fetchTrainerSalaries } from '@/services/api/finances';
import { fetchSessions } from '@/services/api/sessions';
import { queryKeys } from '@/services/api/queryKeys';

/**
 * Route prefetch helpers
 * These functions prefetch data for routes to improve perceived performance
 */

export async function prefetchDashboard(qc: QueryClient) {
  try {
    await qc.prefetchQuery({
      queryKey: queryKeys.dashboard.all,
      queryFn: fetchDashboard,
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  } catch (e) {
    console.warn('prefetchDashboard failed', e);
  }
}

export async function prefetchCustomers(qc: QueryClient) {
  try {
    await qc.prefetchQuery({
      queryKey: ['customers', { page: 1 }],
      queryFn: () => fetchCustomersList({ page: 1 }),
      staleTime: 1000 * 60 * 10, // 10 minutes
    });
  } catch (e) {
    console.warn('prefetchCustomers failed', e);
  }
}

export async function prefetchTrainers(qc: QueryClient) {
  try {
    await qc.prefetchQuery({
      queryKey: ['trainers', { page: 1, size: 20 }],
      queryFn: () => fetchTrainers({ page: 1, size: 20 }),
      staleTime: 1000 * 60 * 10,
    });
  } catch (e) {
    console.warn('prefetchTrainers failed', e);
  }
}

export async function prefetchPackages(qc: QueryClient) {
  try {
    await qc.prefetchQuery({
      queryKey: ['packages'],
      queryFn: fetchPackages,
      staleTime: 1000 * 60 * 10,
    });
  } catch (e) {
    console.warn('prefetchPackages failed', e);
  }
}

export async function prefetchEquipment(qc: QueryClient) {
  try {
    await qc.prefetchQuery({
      queryKey: ['equipment', { page: 1, size: 20 }],
      queryFn: () => fetchEquipment({ page: 1, size: 20 }),
      staleTime: 1000 * 60 * 10,
    });
  } catch (e) {
    console.warn('prefetchEquipment failed', e);
  }
}

export async function prefetchClientPayments(qc: QueryClient) {
  try {
    await qc.prefetchQuery({
      queryKey: ['client-payments', { page: 1, size: 20 }],
      queryFn: () => fetchClientPayments({ page: 1, size: 20 }),
      staleTime: 1000 * 60 * 5,
    });
  } catch (e) {
    console.warn('prefetchClientPayments failed', e);
  }
}

export async function prefetchTrainerSalaries(qc: QueryClient) {
  try {
    await qc.prefetchQuery({
      queryKey: ['trainer-salaries', { page: 1, size: 20 }],
      queryFn: () => fetchTrainerSalaries({ page: 1, size: 20 }),
      staleTime: 1000 * 60 * 5,
    });
  } catch (e) {
    console.warn('prefetchTrainerSalaries failed', e);
  }
}

export async function prefetchSessions(qc: QueryClient) {
  try {
    await qc.prefetchQuery({
      queryKey: ['sessions', {}],
      queryFn: () => fetchSessions({}),
      staleTime: 1000 * 60 * 5,
    });
  } catch (e) {
    console.warn('prefetchSessions failed', e);
  }
}

