import { create } from 'zustand';
import { Payment, TrainerSalary } from '@/types/finance';
import * as financesApi from '@/services/api/finances';
import type {
  FetchClientPaymentsParams,
  FetchTrainerSalariesParams,
  CreatePaymentDto,
  GenerateSalaryDto,
} from '@/services/api/finances';

interface FinanceState {
  clientPayments: Payment[];
  paymentsTotal: number;
  trainerSalaries: TrainerSalary[];
  salariesTotal: number;
  loading: boolean;
  error: string | null;
  fetchClientPayments: (params?: FetchClientPaymentsParams) => Promise<void>;
  fetchTrainerSalaries: (params?: FetchTrainerSalariesParams) => Promise<void>;
  createPayment: (payload: CreatePaymentDto) => Promise<Payment>;
  generateSalary: (payload: GenerateSalaryDto) => Promise<TrainerSalary>;
  prefetchPayments: (params?: FetchClientPaymentsParams) => Promise<void>;
  prefetchSalaries: (params?: FetchTrainerSalariesParams) => Promise<void>;
  clear: () => void;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  clientPayments: [],
  paymentsTotal: 0,
  trainerSalaries: [],
  salariesTotal: 0,
  loading: false,
  error: null,
  async fetchClientPayments(params = { page: 1, size: 20 }) {
    set({ loading: true, error: null });
    try {
      const result = await financesApi.fetchClientPayments(params);
      set({ clientPayments: result.items, paymentsTotal: result.total, loading: false });
    } catch (error: any) {
      set({ error: error?.message || 'Failed to fetch client payments', loading: false });
      throw error;
    }
  },
  async fetchTrainerSalaries(params = { page: 1, size: 20 }) {
    set({ loading: true, error: null });
    try {
      const result = await financesApi.fetchTrainerSalaries(params);
      set({ trainerSalaries: result.items, salariesTotal: result.total, loading: false });
    } catch (error: any) {
      set({ error: error?.message || 'Failed to fetch trainer salaries', loading: false });
      throw error;
    }
  },
  async createPayment(payload) {
    const newPayment = await financesApi.createClientPayment(payload);
    set((state) => ({
      clientPayments: [...state.clientPayments, newPayment],
      paymentsTotal: state.paymentsTotal + 1,
    }));
    return newPayment;
  },
  async generateSalary(payload) {
    const newSalary = await financesApi.generateTrainerSalary(payload);
    set((state) => ({
      trainerSalaries: [...state.trainerSalaries, newSalary],
      salariesTotal: state.salariesTotal + 1,
    }));
    return newSalary;
  },
  async prefetchPayments(params = { page: 1, size: 20 }) {
    return get().fetchClientPayments(params);
  },
  async prefetchSalaries(params = { page: 1, size: 20 }) {
    return get().fetchTrainerSalaries(params);
  },
  clear: () => {
    set({
      clientPayments: [],
      paymentsTotal: 0,
      trainerSalaries: [],
      salariesTotal: 0,
      loading: false,
      error: null,
    });
  },
}));

/**
 * Prefetch function for finance data
 */
export async function prefetch(params: FetchClientPaymentsParams | FetchTrainerSalariesParams = {}) {
  const state = useFinanceStore.getState();
  // Default to payments prefetch
  return state.prefetchPayments(params as FetchClientPaymentsParams);
}


