import type { User } from '../model/types';
import { API_CONFIG, createApiUrl } from '../../../shared/config/api';
import { authFetch } from '../../../shared/api/authFetch';

type ApiErrorResponse = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
};

async function getApiErrorMessage(response: Response) {
  try {
    const data = (await response.json()) as ApiErrorResponse;

    if (Array.isArray(data.message)) {
      return data.message.join(', ');
    }

    if (typeof data.message === 'string') {
      return data.message;
    }

    if (typeof data.error === 'string') {
      return data.error;
    }

    return `Ошибка запроса: ${response.status}`;
  } catch {
    return `Ошибка запроса: ${response.status}`;
  }
}

export async function getCurrentUser(): Promise<User> {
  const response = await authFetch(
    createApiUrl(API_CONFIG.apiBaseUrl, '/users/me'),
    {
      method: 'GET',
    },
  );

  if (!response.ok) {
    const message = await getApiErrorMessage(response);
    throw new Error(message);
  }

  return response.json() as Promise<User>;
}