import { API_CONFIG, createApiUrl } from '../../../shared/config/api';
import type { Camera } from '../model/types';
import { mapCameraFromApi, type ApiCamera } from './cameraMapper';

export type CamerasBboxParams = {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
};

export type CamerasLookingAtParams = {
  lat: number;
  lng: number;
};

export type CamerasListQueryParams = {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  city?: string;
  category?: string;
};

export type CamerasListMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type CamerasListResponse = {
  data: Camera[];
  meta: CamerasListMeta;
};

async function getApiErrorMessage(response: Response) {
  try {
    const data = (await response.json()) as {
      message?: string | string[];
      error?: string;
    };

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

export async function getCamerasByBbox(
  params: CamerasBboxParams,
  signal?: AbortSignal,
): Promise<Camera[]> {
  const searchParams = new URLSearchParams();

  searchParams.set('minLng', String(params.minLng));
  searchParams.set('minLat', String(params.minLat));
  searchParams.set('maxLng', String(params.maxLng));
  searchParams.set('maxLat', String(params.maxLat));

  const response = await fetch(
    createApiUrl(
      API_CONFIG.apiBaseUrl,
      `/cameras/bbox?${searchParams.toString()}`,
    ),
    {
      method: 'GET',
      signal,
      headers: {
        Accept: 'application/json',
      },
    },
  );

  if (!response.ok) {
    const message = await getApiErrorMessage(response);
    throw new Error(message);
  }

  const data = (await response.json()) as ApiCamera[];

  return data.map(mapCameraFromApi);
}

export async function getCameraById(
  cameraId: string,
  signal?: AbortSignal,
): Promise<Camera> {
  const response = await fetch(
    createApiUrl(API_CONFIG.apiBaseUrl, `/cameras/${cameraId}`),
    {
      method: 'GET',
      signal,
      headers: {
        Accept: 'application/json',
      },
    },
  );

  if (!response.ok) {
    const message = await getApiErrorMessage(response);
    throw new Error(message);
  }

  const data = (await response.json()) as ApiCamera;

  return mapCameraFromApi(data);
}

export async function getCamerasLookingAt(
  params: CamerasLookingAtParams,
  signal?: AbortSignal,
): Promise<Camera[]> {
  const searchParams = new URLSearchParams();

  searchParams.set('lat', String(params.lat));
  searchParams.set('lng', String(params.lng));

  const response = await fetch(
    createApiUrl(
      API_CONFIG.apiBaseUrl,
      `/cameras/looking-at?${searchParams.toString()}`,
    ),
    {
      method: 'GET',
      signal,
      headers: {
        Accept: 'application/json',
      },
    },
  );

  if (!response.ok) {
    const message = await getApiErrorMessage(response);
    throw new Error(message);
  }

  const data = (await response.json()) as ApiCamera[];

  return data.map(mapCameraFromApi);
}

export async function getCamerasList(
  params: CamerasListQueryParams,
  signal?: AbortSignal,
): Promise<CamerasListResponse> {
  const searchParams = new URLSearchParams();

  searchParams.set('page', String(params.page));
  searchParams.set('limit', String(params.limit));

  if (params.search?.trim()) {
    searchParams.set('search', params.search.trim());
  }

  if (params.status?.trim()) {
    searchParams.set('status', params.status.trim());
  }

  if (params.city?.trim()) {
    searchParams.set('city', params.city.trim());
  }

  if (params.category?.trim()) {
    searchParams.set('category', params.category.trim());
  }

  const response = await fetch(
    createApiUrl(API_CONFIG.apiBaseUrl, `/cameras?${searchParams.toString()}`),
    {
      method: 'GET',
      signal,
      headers: {
        Accept: 'application/json',
      },
    },
  );

  if (!response.ok) {
    const message = await getApiErrorMessage(response);
    throw new Error(message);
  }

  const data = (await response.json()) as {
    data: ApiCamera[];
    meta: CamerasListMeta;
  };

  return {
    data: data.data.map(mapCameraFromApi),
    meta: data.meta,
  };
}