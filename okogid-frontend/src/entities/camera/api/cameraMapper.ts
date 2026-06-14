import type { Camera, CameraStatus } from '../model/types';

export type ApiCamera = {
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

  viewsCount?: number;
  createdAt?: string;
  updatedAt?: string;

  viewMatch?: {
    distanceMeters: number;
    bearingDeg: number;
    angleDiffDeg: number;
  };

  path?: string;
  enabled?: boolean;
  streamEndpoint?: string;
};

function mapCameraStatus(apiCamera: ApiCamera): CameraStatus {
  if (apiCamera.enabled === false) {
    return 'offline';
  }

  if (apiCamera.status === 'active' || apiCamera.status === 'online') {
    return 'online';
  }

  if (apiCamera.status === 'maintenance') {
    return 'maintenance';
  }

  if (apiCamera.status === 'planned') {
    return 'planned';
  }

  return 'offline';
}

export function mapCameraFromApi(apiCamera: ApiCamera): Camera {
  return {
    id: apiCamera.id,
    title: apiCamera.title,
    slug: apiCamera.slug,
    description: apiCamera.description,

    city: apiCamera.city,
    address: apiCamera.address,
    category: apiCamera.category,

    previewUrl: apiCamera.previewUrl ?? null,

    status: mapCameraStatus(apiCamera),

    latitude: apiCamera.coordinates.lat,
    longitude: apiCamera.coordinates.lng,

    coverage: apiCamera.coverage,
    viewMatch: apiCamera.viewMatch,

    viewsCount: apiCamera.viewsCount,
    createdAt: apiCamera.createdAt,
    updatedAt: apiCamera.updatedAt,

    path: apiCamera.path,
    enabled: apiCamera.enabled,
    streamEndpoint: apiCamera.streamEndpoint,
  };
}