import { API_CONFIG, createApiUrl } from '../../../shared/config/api';
import { getApiErrorMessage } from '../lib/getApiErrorMessage';
import type { AuthCredentials, AuthResponse } from '../model/types';

let refreshSessionPromise: Promise<AuthResponse> | null = null;

async function authRequest(
  path: '/auth/login' | '/auth/register',
  credentials: AuthCredentials,
): Promise<AuthResponse> {
  const response = await fetch(createApiUrl(API_CONFIG.apiBaseUrl, path), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const message = await getApiErrorMessage(response);
    throw new Error(message);
  }

  return response.json() as Promise<AuthResponse>;
}

export function login(credentials: AuthCredentials) {
  return authRequest('/auth/login', credentials);
}

export function register(credentials: AuthCredentials) {
  return authRequest('/auth/register', credentials);
}

export async function refreshSession(): Promise<AuthResponse> {
  const response = await fetch(
    createApiUrl(API_CONFIG.apiBaseUrl, '/auth/refresh'),
    {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
    },
  );

  if (!response.ok) {
    const message = await getApiErrorMessage(response);
    throw new Error(message);
  }

  return response.json() as Promise<AuthResponse>;
}

export function refreshSessionOnce(): Promise<AuthResponse> {
  if (!refreshSessionPromise) {
    refreshSessionPromise = refreshSession().finally(() => {
      refreshSessionPromise = null;
    });
  }

  return refreshSessionPromise;
}

export async function logoutSession(accessToken?: string | null) {
  const headers = new Headers({
    Accept: 'application/json',
  });

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(
    createApiUrl(API_CONFIG.apiBaseUrl, '/auth/logout'),
    {
      method: 'POST',
      credentials: 'include',
      headers,
    },
  );

  if (!response.ok) {
    const message = await getApiErrorMessage(response);
    throw new Error(message);
  }
}