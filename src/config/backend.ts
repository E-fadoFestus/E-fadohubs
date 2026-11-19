export const NEW_BACKEND_URL =
  (import.meta.env.VITE_BACKEND_URL || '').trim().replace(/\/$/, '');
export const NEW_PROJECT_ID = 'efado-market-hubs-8leju';

/**
 * Resolves backend API endpoints.
 * Defaults to same-origin relative `/api/...` routes so Vercel serverless functions
 * (`www.e-fado.com/api/*`) and the local/Cloud Run Express server handle all payment,
 * webhook, wallet, and bank-verification requests using the deployment's environment secrets.
 */
export const getBackendUrl = (endpoint: string): string => {
  const clean = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const normalized = clean.startsWith('/api/') || clean === '/api' ? clean : `/api${clean}`;
  return NEW_BACKEND_URL ? `${NEW_BACKEND_URL}${normalized}` : normalized;
};
