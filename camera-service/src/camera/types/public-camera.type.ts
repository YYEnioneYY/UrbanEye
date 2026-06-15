export type PublicCamera = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  status: 'online' | 'offline' | 'maintenance' | 'planned';
  city: string | null;
  address: string | null;
  category: string | null;
  previewUrl: string | null;
  coordinates: {
    lat: number;
    lng: number;
  };
  coverage: {
    directionDeg: number | null;
    fovDeg: number;
    rangeMeters: number;
  };
  viewsCount: number;
  health: {
    status: 'unknown' | 'online' | 'offline' | 'unstable';
    videoCodec: string | null;
    audioCodec: string | null;
    transcodingRequired: boolean;
    lastCheckedAt: Date | null;
    lastOnlineAt: Date | null;
    lastOfflineAt: Date | null;
    error: string | null;
  };
  createdAt: Date;
  updatedAt: Date;
};