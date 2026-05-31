import { authFetch } from '../../../shared/api/authFetch';
import { API_CONFIG, createApiUrl } from '../../../shared/config/api';
import type { User } from '../model/types';

export type AdminUsersQueryParams = {
  page: number;
  limit: number;
  search?: string;
  includeDeleted: boolean;
};

export type AdminUsersMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type AdminUsersResponse = {
  data: User[];
  meta: AdminUsersMeta;
};

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

export async function getAdminUsers(
  params: AdminUsersQueryParams,
  signal?: AbortSignal,
): Promise<AdminUsersResponse> {
  const searchParams = new URLSearchParams();

  searchParams.set('page', String(params.page));
  searchParams.set('limit', String(params.limit));
  searchParams.set('includeDeleted', String(params.includeDeleted));

  if (params.search?.trim()) {
    searchParams.set('search', params.search.trim());
  }

  const response = await authFetch(
    createApiUrl(API_CONFIG.apiBaseUrl, `/admin/users?${searchParams.toString()}`),
    {
      method: 'GET',
      signal,
    },
  );

  if (!response.ok) {
    const message = await getApiErrorMessage(response);
    throw new Error(message);
  }

  return response.json() as Promise<AdminUsersResponse>;
}