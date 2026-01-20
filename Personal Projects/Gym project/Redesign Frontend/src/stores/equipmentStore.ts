import { create } from 'zustand';
import { Equipment, CreateEquipmentDto, UpdateEquipmentDto } from '@/types/equipment';
import * as equipmentApi from '@/services/api/equipment';
import type { FetchEquipmentParams } from '@/services/api/equipment';

interface EquipmentState {
  data: Equipment[];
  total: number;
  loading: boolean;
  error: string | null;
  fetchData: (params?: FetchEquipmentParams) => Promise<void>;
  create: (payload: CreateEquipmentDto) => Promise<Equipment>;
  update: (id: string, payload: UpdateEquipmentDto) => Promise<Equipment>;
  remove: (id: string) => Promise<void>;
  prefetch: (params?: FetchEquipmentParams) => Promise<void>;
  clear: () => void;
}

export const useEquipmentStore = create<EquipmentState>((set, get) => ({
  data: [],
  total: 0,
  loading: false,
  error: null,
  async fetchData(params = { page: 1, size: 20 }) {
    set({ loading: true, error: null });
    try {
      const result = await equipmentApi.fetchEquipment(params);
      set({ data: result.items, total: result.total, loading: false });
    } catch (error: any) {
      set({ error: error?.message || 'Failed to fetch equipment', loading: false });
      throw error;
    }
  },
  async create(payload) {
    const newEquipment = await equipmentApi.createEquipment(payload);
    set((state) => ({ data: [...state.data, newEquipment], total: state.total + 1 }));
    return newEquipment;
  },
  async update(id, payload) {
    const updatedEquipment = await equipmentApi.updateEquipment(id, payload);
    set((state) => ({
      data: state.data.map((e) => (e._id === id || e.equipmentId === id ? updatedEquipment : e)),
    }));
    return updatedEquipment;
  },
  async remove(id) {
    await equipmentApi.deleteEquipment(id);
    set((state) => ({
      data: state.data.filter((e) => e._id !== id && e.equipmentId !== id),
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
 * Prefetch function for equipment data
 */
export async function prefetch(params: FetchEquipmentParams = {}) {
  const state = useEquipmentStore.getState();
  return state.prefetch(params);
}


