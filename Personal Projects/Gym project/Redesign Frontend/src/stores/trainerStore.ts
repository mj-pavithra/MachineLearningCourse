import { create } from 'zustand';
import { Trainer } from '@/types/trainer';
import * as trainersApi from '@/services/api/trainers';
import type { FetchTrainersParams } from '@/services/api/trainers';

interface TrainerState {
  data: Trainer[];
  total: number;
  loading: boolean;
  error: string | null;
  fetchData: (params?: FetchTrainersParams) => Promise<void>;
  create: (payload: Partial<Trainer>) => Promise<Trainer>;
  update: (id: string, payload: Partial<Trainer>) => Promise<Trainer>;
  remove: (id: string) => Promise<void>;
  prefetch: (params?: FetchTrainersParams) => Promise<void>;
  clear: () => void;
}

export const useTrainerStore = create<TrainerState>((set, get) => ({
  data: [],
  total: 0,
  loading: false,
  error: null,
  async fetchData(params = { page: 1, size: 20 }) {
    set({ loading: true, error: null });
    try {
      const result = await trainersApi.fetchTrainers(params);
      set({ data: result.items, total: result.total, loading: false });
    } catch (error: any) {
      set({ error: error?.message || 'Failed to fetch trainers', loading: false });
      throw error;
    }
  },
  async create(payload) {
    const newTrainer = await trainersApi.createTrainer(payload);
    set((state) => ({ data: [...state.data, newTrainer], total: state.total + 1 }));
    return newTrainer;
  },
  async update(id, payload) {
    const updatedTrainer = await trainersApi.updateTrainer(id, payload);
    set((state) => ({
      data: state.data.map((t) => (t._id === id ? updatedTrainer : t)),
    }));
    return updatedTrainer;
  },
  async remove(id) {
    await trainersApi.deleteTrainer(id);
    set((state) => ({
      data: state.data.filter((t) => t._id !== id),
      total: state.total - 1,
    }));
  },
  async prefetch(params = { page: 1, size: 20 }) {
    return get().fetchData(params);
  },
  clear: () => {
    set({ data: [], total: 0, loading: false, error: null });
  },
}));

/**
 * Prefetch function for trainers data
 */
export async function prefetch(params: FetchTrainersParams = {}) {
  const state = useTrainerStore.getState();
  return state.prefetch(params);
}


