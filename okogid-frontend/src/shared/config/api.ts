export const API_CONFIG = {
  geoApiBaseUrl: import.meta.env.VITE_GEO_API_BASE_URL,
} as const;

export function createApiUrl(baseUrl: string, path: string) {
  if (!baseUrl) {
    throw new Error('API base url is not defined');
  }

  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${normalizedBaseUrl}${normalizedPath}`;
}