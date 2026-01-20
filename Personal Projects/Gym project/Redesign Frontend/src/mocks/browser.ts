/**
 * MSW browser setup
 * This file sets up MSW for browser environment (local development)
 */

import { setupWorker } from 'msw/browser';
import { handlers } from '../../mocks/handlers';

// Only enable MSW if VITE_ENABLE_DEV_MOCKS is true
if (import.meta.env.VITE_ENABLE_DEV_MOCKS === 'true') {
  const worker = setupWorker(...handlers);

  worker.start({
    onUnhandledRequest: 'warn',
  });

  console.log('[MSW] Mock Service Worker enabled for local development');
}

export {};

