import { authFetch } from '../../../shared/api/authFetch';
import { API_CONFIG, createApiUrl } from '../../../shared/config/api';
import type { ServiceStatus } from '../model/types';

export type AdminServiceStatusConfig = {
  id: string;
  title: string;
  description: string;
  endpoint: string;
};

export const adminServiceStatusConfigs: AdminServiceStatusConfig[] = [
  {
    id: 'auth',
    title: 'Auth Service',
    description: 'Авторизация, регистрация, refresh/logout и роли пользователей.',
    endpoint: '/admin/services/auth/status',
  },
];

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

export async function getAdminServiceStatus(
  config: AdminServiceStatusConfig,
  signal?: AbortSignal,
): Promise<ServiceStatus> {
  const response = await authFetch(createApiUrl(API_CONFIG.apiBaseUrl, config.endpoint), {
    method: 'GET',
    signal,
  });

  if (!response.ok) {
    const message = await getApiErrorMessage(response);
    throw new Error(message);
  }

  return response.json() as Promise<ServiceStatus>;
}