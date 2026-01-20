/**
 * Central export for all Zustand stores
 * Call clear() on all stores during logout
 */

import { useDashboardStore } from './dashboardStore';
import { useCustomerStore } from './customerStore';
import { useTrainerStore } from './trainerStore';
import { usePackageStore } from './packageStore';
import { useEquipmentStore } from './equipmentStore';
import { useFinanceStore } from './financeStore';
import { useSessionStore } from './sessionStore';

/**
 * Clear all stores (called on logout)
 */
export const clearAllStores = () => {
  useDashboardStore.getState().clear();
  useCustomerStore.getState().clear();
  useTrainerStore.getState().clear();
  usePackageStore.getState().clear();
  useEquipmentStore.getState().clear();
  useFinanceStore.getState().clear();
  useSessionStore.getState().clear();
};

export {
  useDashboardStore,
  useCustomerStore,
  useTrainerStore,
  usePackageStore,
  useEquipmentStore,
  useFinanceStore,
  useSessionStore,
};


