import type { Camera, CameraStatus } from '../model/types';

export type ApiCamera = {
  id: string;
  title: string;
  slug: string;
  description: string;
  city: string;
  address: string;
  category: string;
  status: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  path: string;
  enabled: boolean;
  streamEndpoint: string;
};

function mapCameraStatus(apiCamera: ApiCamera): CameraStatus {
  if (!apiCamera.enabled) {
    return 'offline';
  }

  if (apiCamera.status === 'active') {
    return 'online';
  }

  if (apiCamera.status === 'maintenance') {
    return 'maintenance';
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
    status: mapCameraStatus(apiCamera),
    latitude: apiCamera.coordinates.lat,
    longitude: apiCamera.coordinates.lng,
    path: apiCamera.path,
    enabled: apiCamera.enabled,
    streamEndpoint: apiCamera.streamEndpoint,
  };
}