import type { Camera } from '../../camera/model/types';
import { mapCameraFromApi } from '../../camera/api/cameraMapper';
import { API_CONFIG, createApiUrl } from '../../../shared/config/api';
import type { Intersection } from '../model/types';

type ApiIntersection = {
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

type ApiIntersectionStreamItem = {
  camera: Parameters<typeof mapCameraFromApi>[0];
  stream: IntersectionCameraStream | null;
  available: boolean;
  error: string | null;
};

type ApiIntersectionStreamsResponse = {
  intersection: ApiIntersection;
  streams: ApiIntersectionStreamItem[];
};

export type IntersectionsBboxParams = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

export type IntersectionCameraStream = {
  id?: string;
  cameraId?: string;
  playerUrl?: string;
  streamUrl?: string;
  hlsUrl?: string;
  embedUrl?: string;
  url?: string;
  [key: string]: unknown;
};

export type IntersectionStreamItem = {
  camera: Camera;
  stream: IntersectionCameraStream | null;
  available: boolean;
  error: string | null;
};

export type IntersectionStreamsResponse = {
  intersection: Intersection;
  streams: IntersectionStreamItem[];
};

function mapIntersectionFromApi(
  apiIntersection: ApiIntersection,
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

export async function getIntersectionsByBbox(
  params: IntersectionsBboxParams,
  signal?: AbortSignal,
): Promise<Intersection[]> {
  const searchParams = new URLSearchParams();

  searchParams.set('minLat', String(params.minLat));
  searchParams.set('maxLat', String(params.maxLat));
  searchParams.set('minLng', String(params.minLng));
  searchParams.set('maxLng', String(params.maxLng));

  const response = await fetch(
    createApiUrl(
      API_CONFIG.apiBaseUrl,
      `/intersections/bbox?${searchParams.toString()}`,
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

  const data = (await response.json()) as ApiIntersection[];

  return data.map(mapIntersectionFromApi);
}

export async function getIntersectionById(
  intersectionId: string,
  signal?: AbortSignal,
): Promise<Intersection> {
  const response = await fetch(
    createApiUrl(API_CONFIG.apiBaseUrl, `/intersections/${intersectionId}`),
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

  const data = (await response.json()) as ApiIntersection;

  return mapIntersectionFromApi(data);
}

export async function getIntersectionStreamsById(
  intersectionId: string,
  signal?: AbortSignal,
): Promise<IntersectionStreamsResponse> {
  const response = await fetch(
    createApiUrl(
      API_CONFIG.apiBaseUrl,
      `/intersections/${intersectionId}/streams`,
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

  const data = (await response.json()) as ApiIntersectionStreamsResponse;

  return {
    intersection: mapIntersectionFromApi(data.intersection),
    streams: data.streams.map((item) => ({
      camera: mapCameraFromApi(item.camera),
      stream: item.stream,
      available: item.available,
      error: item.error,
    })),
  };
}