import { create } from 'zustand';
import { PTSession, FetchSessionsParams, CreateSessionDto, CreateExtraSessionDto } from '@/types/session';
import * as sessionsApi from '@/services/api/sessions';

interface SessionState {
  data: PTSession[];
  total: number;
  loading: boolean;
  error: string | null;
  fetchData: (params?: FetchSessionsParams) => Promise<void>;
  create: (payload: CreateSessionDto) => Promise<PTSession>;
  createExtra: (payload: CreateExtraSessionDto) => Promise<PTSession>;
  update: (id: string, payload: Partial<PTSession>) => Promise<PTSession>;
  remove: (id: string) => Promise<void>;
  markAttendance: (id: string, attendance: 'attended' | 'missed' | 'cancelled') => Promise<PTSession>;
  prefetch: (params?: FetchSessionsParams) => Promise<void>;
  clear: () => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  data: [],
  total: 0,
  loading: false,
  error: null,
  async fetchData(params = {}) {
    set({ loading: true, error: null });
    try {
      const result = await sessionsApi.fetchSessions(params);
      set({ data: result.items, total: result.total, loading: false });
    } catch (error: any) {
      set({ error: error?.message || 'Failed to fetch sessions', loading: false });
      throw error;
    }
  },
  async create(payload) {
    const newSession = await sessionsApi.createSession(payload);
    set((state) => ({ data: [...state.data, newSession], total: state.total + 1 }));
    return newSession;
  },
  async createExtra(payload) {
    const newSession = await sessionsApi.createExtraSession(payload);
    set((state) => ({ data: [...state.data, newSession], total: state.total + 1 }));
    return newSession;
  },
  async update(id, payload) {
    const updatedSession = await sessionsApi.updateSession(id, payload);
    set((state) => ({
      data: state.data.map((s) => (s._id === id ? updatedSession : s)),
    }));
    return updatedSession;
  },
  async remove(_id) {
    // Delete functionality removed - this is now a no-op
    // The session will remain in the store
  },
  async markAttendance(id, _attendance) {
    // Note: API doesn't accept attendance parameter, only trainerId and customerId
    // The attendance parameter is kept in the store interface for future use
    const updatedSession = await sessionsApi.markAttendance(id, {});
    set((state) => ({
      data: state.data.map((s) => (s._id === id ? updatedSession : s)),
    }));
    return updatedSession;
  },
  async prefetch(params = {}) {
    return get().fetchData(params);
  },
  clear: () => {
    set({ data: [], total: 0, loading: false, error: null });
  },
}));

/**
 * Prefetch function for sessions data
 */
export async function prefetch(params: FetchSessionsParams = {}) {
  const state = useSessionStore.getState();
  return state.prefetch(params);
}


