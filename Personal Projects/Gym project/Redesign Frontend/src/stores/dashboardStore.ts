import { create } from 'zustand';
import { DashboardData } from '@/types/dashboard';
import { fetchDashboard } from '@/services/api/dashboard';

interface DashboardState {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  fetchData: () => Promise<void>;
  clear: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  data: null,
  loading: false,
  error: null,
  fetchData: async () => {
    set({ loading: true, error: null });
    try {
      const data = await fetchDashboard();
      set({ data, loading: false });
    } catch (error: any) {
      set({ error: error?.message || 'Failed to fetch dashboard data', loading: false });
    }
  },
  clear: () => {
    set({ data: null, loading: false, error: null });
  },
}));

/**
 * Prefetch function for dashboard data
 * Can be called by router or pages to warm cache
 */
export async function prefetch(_params = {}) {
  const state = useDashboardStore.getState();
  if (state.fetchData) {
    return state.fetchData();
  }
  // Fallback: call API directly
  return fetchDashboard().then((data) => {
    useDashboardStore.setState({ data });
    return data;
  });
}


