export type CameraStatus = 'active' | 'inactive' | 'maintenance';

export type CameraCategory =
  | 'landmark'
  | 'history'
  | 'modern'
  | 'road'
  | 'park';

export type CameraCoordinates = {
  lat: number;
  lng: number;
};

export type CameraConfig = {
  id: string;
  title: string;
  slug: string;
  description: string;
  city: string;
  address: string;
  category: CameraCategory;
  status: CameraStatus;
  coordinates: CameraCoordinates;
  path: string;
  rtspUrl: string;
  enabled?: boolean;
};

export type PublicCamera = Omit<CameraConfig, 'rtspUrl'> & {
  streamEndpoint: string;
};