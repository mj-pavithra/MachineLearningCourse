import { create } from 'zustand';
import { Customer, IndividualCustomer, FetchedCustomer, FetchedGroupCustomer } from '@/types/customer';
import { fetchCustomersList, fetchIndividualCustomers, fetchGroupCustomers } from '@/services/api/customers';

interface CustomerState {
  customers: (Customer | IndividualCustomer)[];
  individualCustomers: FetchedCustomer[];
  groupCustomers: FetchedGroupCustomer[];
  loading: boolean;
  error: string | null;
  fetchCustomers: () => Promise<void>;
  fetchIndividualCustomers: () => Promise<void>;
  fetchGroupCustomers: () => Promise<void>;
  clear: () => void;
}

export const useCustomerStore = create<CustomerState>((set) => ({
  customers: [],
  individualCustomers: [],
  groupCustomers: [],
  loading: false,
  error: null,
  fetchCustomers: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetchCustomersList({ page: 1 });
      set({ customers: response.customers, loading: false });
    } catch (error: any) {
      set({ error: error?.message || 'Failed to fetch customers', loading: false });
    }
  },
  fetchIndividualCustomers: async () => {
    set({ loading: true, error: null });
    try {
      const data = await fetchIndividualCustomers({ page: 1 });
      set({ individualCustomers: data, loading: false });
    } catch (error: any) {
      set({ error: error?.message || 'Failed to fetch individual customers', loading: false });
    }
  },
  fetchGroupCustomers: async () => {
    set({ loading: true, error: null });
    try {
      const data = await fetchGroupCustomers({ page: 1 });
      set({ groupCustomers: data, loading: false });
    } catch (error: any) {
      set({ error: error?.message || 'Failed to fetch group customers', loading: false });
    }
  },
  clear: () => {
    set({ customers: [], individualCustomers: [], groupCustomers: [], loading: false, error: null });
  },
}));

/**
 * Prefetch function for customers data
 */
export async function prefetch(_params = {}) {
  const state = useCustomerStore.getState();
  if (state.fetchCustomers) {
    return state.fetchCustomers();
  }
  // Fallback: call API directly
  return fetchCustomersList({ page: 1 }).then((response) => {
    useCustomerStore.setState({ customers: response.customers });
    return response;
  });
}


