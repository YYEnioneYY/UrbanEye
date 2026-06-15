import type { CameraCoverage, CameraStatus } from './types';

export type AdminCameraConnection = {
  rtspUrl: string;
  username: string;
  password: string;
};

export type AdminCameraHealthStatus =
  | 'online'
  | 'offline'
  | 'unknown'
  | 'checking'
  | 'error';

export type AdminCameraHealth = {
  status: AdminCameraHealthStatus | string;
  videoCodec: string | null;
  audioCodec: string | null;
  transcodingRequired: boolean;
  lastCheckedAt: string | null;
  lastOnlineAt: string | null;
  lastOfflineAt: string | null;
  error: string | null;
};

export type AdminCamera = {
  id: string;
  title: string;
  slug: string;
  description: string;

  status: CameraStatus;

  city: string;
  address: string;
  category: string;

  latitude: number;
  longitude: number;

  coverage?: CameraCoverage;

  viewsCount: number;

  previewUrl?: string | null;

  health?: AdminCameraHealth | null;

  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;

  connection?: AdminCameraConnection;
};

export type AdminCamerasMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type AdminCamerasResponse = {
  data: AdminCamera[];
  meta: AdminCamerasMeta;
};