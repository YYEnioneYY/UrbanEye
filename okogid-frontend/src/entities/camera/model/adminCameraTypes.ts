import type { CameraCoverage, CameraStatus } from './types';

export type AdminCameraConnection = {
  rtspUrl: string;
  username: string;
  password: string;
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