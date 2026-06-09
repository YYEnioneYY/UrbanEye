export type PublicCamera = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  status: 'online' | 'offline' | 'maintenance' | 'planned';
  city: string | null;
  address: string | null;
  category: string | null;
  coordinates: {
    lat: number;
    lng: number;
  };
  coverage: {
    directionDeg: number | null;
    fovDeg: number;
    rangeMeters: number;
  };
  createdAt: Date;
  updatedAt: Date;
};