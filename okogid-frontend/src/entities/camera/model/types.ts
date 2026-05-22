export type CameraStatus = 'online' | 'offline' | 'maintenance';

export type Camera = {
  id: string;
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  status: CameraStatus;
  categoryId?: string;
  previewUrl?: string;
  streamUrl?: string;
};