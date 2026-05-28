export type CameraStatus = 'online' | 'offline' | 'maintenance';

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
  path: string;
  enabled: boolean;
  streamEndpoint: string;
  previewUrl?: string;
  streamUrl?: string;
};