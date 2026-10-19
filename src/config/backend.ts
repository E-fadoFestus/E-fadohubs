export const NEW_BACKEND_URL = "https://us-central1-efado-market-hubs-8leju.cloudfunctions.net/api";
export const NEW_PROJECT_ID = "efado-market-hubs-8leju";

/**
 * Builds the complete Cloud Functions URL targeting the new backend.
 * Automatically normalizes /api endpoints so there are no duplicated path segments.
 * e.g., getBackendUrl('/api/opay/initialize') -> 'https://us-central1-efado-market-hubs-8leju.cloudfunctions.net/api/opay/initialize'
 */
export const getBackendUrl = (endpoint: string): string => {
  const clean = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (clean.startsWith('/api/')) {
    return `${NEW_BACKEND_URL}${clean.substring(4)}`;
  }
  if (clean === '/api') {
    return NEW_BACKEND_URL;
  }
  return `${NEW_BACKEND_URL}${clean}`;
};
