export type CameraStatus = 'online' | 'offline' | 'maintenance' | 'planned';

export type CameraCoverage = {
  directionDeg: number;
  fovDeg: number;
  rangeMeters: number;
};

export type CameraViewMatch = {
  distanceMeters: number;
  bearingDeg: number;
  angleDiffDeg: number;
};

export type Camera = {
  id: string;
  title: string;
  slug: string;
  description: string;

  city: string;
  address: string;
  category: string;

  status: CameraStatus;

  latitude: number;
  longitude: number;

  coverage?: CameraCoverage;
  viewMatch?: CameraViewMatch;

  viewsCount?: number;
  createdAt?: string;
  updatedAt?: string;

  path?: string;
  enabled?: boolean;
  streamEndpoint?: string;

  previewUrl?: string;
  streamUrl?: string;
};