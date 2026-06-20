import type { Camera } from '../../camera/model/types';
import { mapCameraFromApi } from '../../camera/api/cameraMapper';
import { API_CONFIG, createApiUrl } from '../../../shared/config/api';
import { authFetch } from '../../../shared/api/authFetch';
import type { Intersection } from '../model/types';

type ApiAdminIntersection = {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: string;
  city: string;
  address: string;
  category: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  camerasCount: number;
  onlineCamerasCount: number;
  createdAt: string;
  updatedAt: string;
};

type ApiAdminIntersectionCamera = Parameters<typeof mapCameraFromApi>[0];

export type CreateAdminIntersectionPayload = {
  title: string;
  slug: string;
  description: string;
  city: string;
  address: string;
  category: string;
  latitude: number;
  longitude: number;
};

export type CreateAdminIntersectionCameraPayload = {
  title: string;
  slug: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  directionDeg: number;
  fovDeg: number;
  rangeMeters: number;
  connection: {
    rtspUrl: string;
    username: string;
    password: string;
  };
};

export type DeleteAdminIntersectionResponse = {
  id: string;
  deleted: boolean;
};

function mapIntersectionFromApi(
  apiIntersection: ApiAdminIntersection,
): Intersection {
  return {
    id: apiIntersection.id,
    title: apiIntersection.title,
    slug: apiIntersection.slug,
    description: apiIntersection.description,
    status: apiIntersection.status,
    city: apiIntersection.city,
    address: apiIntersection.address,
    category: apiIntersection.category,
    latitude: apiIntersection.coordinates.lat,
    longitude: apiIntersection.coordinates.lng,
    camerasCount: apiIntersection.camerasCount,
    onlineCamerasCount: apiIntersection.onlineCamerasCount,
    createdAt: apiIntersection.createdAt,
    updatedAt: apiIntersection.updatedAt,
  };
}

async function getApiErrorMessage(response: Response) {
  try {
    const data = await response.json();

    if (typeof data?.message === 'string') {
      return data.message;
    }

    if (typeof data?.error === 'string') {
      return data.error;
    }

    return 'Ошибка запроса';
  } catch {
    return 'Ошибка запроса';
  }
}

export async function getAdminIntersections(
  signal?: AbortSignal,
): Promise<Intersection[]> {
  const response = await authFetch(
    createApiUrl(API_CONFIG.apiBaseUrl, '/admin/intersections'),
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

  const data = (await response.json()) as ApiAdminIntersection[];

  return data.map(mapIntersectionFromApi);
}

export async function createAdminIntersection(
  payload: CreateAdminIntersectionPayload,
  signal?: AbortSignal,
): Promise<Intersection> {
  const response = await authFetch(
    createApiUrl(API_CONFIG.apiBaseUrl, '/admin/intersections'),
    {
      method: 'POST',
      signal,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const message = await getApiErrorMessage(response);
    throw new Error(message);
  }

  const data = (await response.json()) as ApiAdminIntersection;

  return mapIntersectionFromApi(data);
}

export async function getAdminIntersectionCameras(
  intersectionId: string,
  signal?: AbortSignal,
): Promise<Camera[]> {
  const response = await authFetch(
    createApiUrl(
      API_CONFIG.apiBaseUrl,
      `/admin/intersections/${intersectionId}/cameras`,
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

  const data = (await response.json()) as ApiAdminIntersectionCamera[];

  return data.map(mapCameraFromApi);
}

export async function createAdminIntersectionCamera(
  intersectionId: string,
  payload: CreateAdminIntersectionCameraPayload,
  signal?: AbortSignal,
): Promise<Camera> {
  const response = await authFetch(
    createApiUrl(
      API_CONFIG.apiBaseUrl,
      `/admin/intersections/${intersectionId}/cameras`,
    ),
    {
      method: 'POST',
      signal,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const message = await getApiErrorMessage(response);
    throw new Error(message);
  }

  const data = (await response.json()) as ApiAdminIntersectionCamera;

  return mapCameraFromApi(data);
}

export async function deleteAdminIntersection(
  intersectionId: string,
  signal?: AbortSignal,
): Promise<DeleteAdminIntersectionResponse> {
  const response = await authFetch(
    createApiUrl(
      API_CONFIG.apiBaseUrl,
      `/admin/intersections/${intersectionId}`,
    ),
    {
      method: 'DELETE',
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

  return (await response.json()) as DeleteAdminIntersectionResponse;
}