import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Initialize MSW for local development (if enabled)
if (import.meta.env.VITE_ENABLE_DEV_MOCKS === 'true') {
  import('./mocks/browser');
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


