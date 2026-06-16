import { authFetch } from '../../../shared/api/authFetch';
import { API_CONFIG, createApiUrl } from '../../../shared/config/api';
import type {
  AdminCamera,
  AdminCamerasResponse,
} from '../model/adminCameraTypes';
import type { CameraStatus } from '../model/types';

export type AdminCamerasQueryParams = {
  page: number;
  limit: number;
  search?: string;
  includeDeleted: boolean;
};

export type UpdateAdminCameraPayload = CreateAdminCameraPayload;

export type DeleteAdminCameraResponse = {
  cameraId: string;
  deletedAt: string;
};

export type CreateAdminCameraPayload = {
  title: string;
  slug: string;
  description: string;
  city: string;
  address: string;
  category: string;
  directionDeg: number;
  fovDeg: number;
  rangeMeters: number;
  latitude: number;
  longitude: number;
  connection: {
    rtspUrl: string;
    username: string;
    password: string;
  };
};

type ApiAdminCamera = {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: string;
  city: string;
  address: string;
  category: string;
  previewUrl?: string | null;
  coordinates: {
    lat: number;
    lng: number;
  };
  coverage?: {
    directionDeg: number;
    fovDeg: number;
    rangeMeters: number;
  };
  viewsCount: number;
  health?: {
    status: string;
    videoCodec: string | null;
    audioCodec: string | null;
    transcodingRequired: boolean;
    lastCheckedAt: string | null;
    lastOnlineAt: string | null;
    lastOfflineAt: string | null;
    error: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  connection?: {
    rtspUrl: string;
    username: string;
    password: string;
  };
};

type ApiAdminCamerasResponse = {
  data: ApiAdminCamera[];
  meta: AdminCamerasResponse['meta'];
};

type ApiErrorResponse = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
};

function mapCameraStatus(status: string): CameraStatus {
  if (status === 'online' || status === 'active') {
    return 'online';
  }

  if (status === 'maintenance') {
    return 'maintenance';
  }

  return 'offline';
}

function mapAdminCameraFromApi(apiCamera: ApiAdminCamera): AdminCamera {
  return {
    id: apiCamera.id,
    title: apiCamera.title,
    slug: apiCamera.slug,
    description: apiCamera.description,

    status: mapCameraStatus(apiCamera.status),

    city: apiCamera.city,
    address: apiCamera.address,
    category: apiCamera.category,

    previewUrl: apiCamera.previewUrl ?? null,

    latitude: apiCamera.coordinates.lat,
    longitude: apiCamera.coordinates.lng,

    coverage: apiCamera.coverage,

    viewsCount: apiCamera.viewsCount,

    health: apiCamera.health ?? null,

    createdAt: apiCamera.createdAt,
    updatedAt: apiCamera.updatedAt,
    deletedAt: apiCamera.deletedAt ?? null,

    connection: apiCamera.connection,
  };
}

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

export async function getAdminCameras(
  params: AdminCamerasQueryParams,
  signal?: AbortSignal,
): Promise<AdminCamerasResponse> {
  const searchParams = new URLSearchParams();

  searchParams.set('page', String(params.page));
  searchParams.set('limit', String(params.limit));
  searchParams.set('includeDeleted', String(params.includeDeleted));

  if (params.search?.trim()) {
    searchParams.set('search', params.search.trim());
  }

  const response = await authFetch(
    createApiUrl(
      API_CONFIG.apiBaseUrl,
      `/admin/cameras?${searchParams.toString()}`,
    ),
    {
      method: 'GET',
      signal,
    },
  );

  if (!response.ok) {
    const message = await getApiErrorMessage(response);
    throw new Error(message);
  }

  const data = (await response.json()) as ApiAdminCamerasResponse;

  return {
    data: data.data.map(mapAdminCameraFromApi),
    meta: data.meta,
  };
}

export async function createAdminCamera(
  payload: CreateAdminCameraPayload,
  signal?: AbortSignal,
): Promise<AdminCamera> {
  const response = await authFetch(
    createApiUrl(API_CONFIG.apiBaseUrl, '/admin/cameras'),
    {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const message = await getApiErrorMessage(response);
    throw new Error(message);
  }

  const data = (await response.json()) as ApiAdminCamera;

  return mapAdminCameraFromApi(data);
}

export async function updateAdminCamera(
  cameraId: string,
  payload: UpdateAdminCameraPayload,
  signal?: AbortSignal,
): Promise<AdminCamera> {
  const response = await authFetch(
    createApiUrl(API_CONFIG.apiBaseUrl, `/admin/cameras/${cameraId}`),
    {
      method: 'PATCH',
      signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const message = await getApiErrorMessage(response);
    throw new Error(message);
  }

  const data = (await response.json()) as ApiAdminCamera;

  return mapAdminCameraFromApi(data);
}

export async function deleteAdminCamera(
  cameraId: string,
  signal?: AbortSignal,
): Promise<DeleteAdminCameraResponse> {
  const response = await authFetch(
    createApiUrl(API_CONFIG.apiBaseUrl, `/admin/cameras/${cameraId}`),
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

  return response.json() as Promise<DeleteAdminCameraResponse>;
}

export async function uploadAdminCameraPreview(
  cameraId: string,
  file: File,
  signal?: AbortSignal,
): Promise<AdminCamera> {
  const formData = new FormData();

  formData.append('file', file);

  const response = await authFetch(
    createApiUrl(API_CONFIG.apiBaseUrl, `/admin/cameras/${cameraId}/preview`),
    {
      method: 'POST',
      signal,
      headers: {
        Accept: 'application/json',
      },
      body: formData,
    },
  );

  if (!response.ok) {
    const message = await getApiErrorMessage(response);
    throw new Error(message);
  }

  const data = (await response.json()) as ApiAdminCamera;

  return mapAdminCameraFromApi(data);
}