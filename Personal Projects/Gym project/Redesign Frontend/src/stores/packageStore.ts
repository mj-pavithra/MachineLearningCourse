import { create } from 'zustand';
import { Package } from '@/types/package';
import * as packagesApi from '@/services/api/packages';

interface PackageState {
  data: Package[];
  loading: boolean;
  error: string | null;
  fetchData: () => Promise<void>;
  create: (payload: Partial<Package>) => Promise<Package>;
  update: (id: string, payload: Partial<Package>) => Promise<Package>;
  remove: (id: string) => Promise<void>;
  prefetch: () => Promise<void>;
  clear: () => void;
}

export const usePackageStore = create<PackageState>((set, get) => ({
  data: [],
  loading: false,
  error: null,
  async fetchData() {
    set({ loading: true, error: null });
    try {
      const packages = await packagesApi.fetchPackages();
      set({ data: packages, loading: false });
    } catch (error: any) {
      set({ error: error?.message || 'Failed to fetch packages', loading: false });
      throw error;
    }
  },
  async create(payload) {
    const newPackage = await packagesApi.createPackage(payload);
    set((state) => ({ data: [...state.data, newPackage] }));
    return newPackage;
  },
  async update(id, payload) {
    const updatedPackage = await packagesApi.updatePackage(id, payload);
    set((state) => ({
      data: state.data.map((p) => (p.packageId === id ? updatedPackage : p)),
    }));
    return updatedPackage;
  },
  async remove(id) {
    await packagesApi.deletePackage(id);
    set((state) => ({
      data: state.data.filter((p) => p.packageId !== id),
    }));
  },
  async prefetch() {
    return get().fetchData();
  },
  clear: () => {
    set({ data: [], loading: false, error: null });
  },
}));

/**
 * Prefetch function for packages data
 */
export async function prefetch(_params = {}) {
  const state = usePackageStore.getState();
  return state.prefetch();
}


