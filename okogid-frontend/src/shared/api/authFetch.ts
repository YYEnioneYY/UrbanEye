import { useAuthStore } from '../../features/auth/model/authStore';

type AuthFetchOptions = RequestInit & {
  withAuth?: boolean;
};

export async function authFetch(input: RequestInfo | URL, options: AuthFetchOptions = {}) {
  const { withAuth = true, headers, ...restOptions } = options;

  const accessToken = useAuthStore.getState().accessToken;

  const requestHeaders = new Headers(headers);

  if (!requestHeaders.has('Accept')) {
    requestHeaders.set('Accept', 'application/json');
  }

  if (withAuth && accessToken) {
    requestHeaders.set('Authorization', `Bearer ${accessToken}`);
  }

  return fetch(input, {
    ...restOptions,
    headers: requestHeaders,
  });
}