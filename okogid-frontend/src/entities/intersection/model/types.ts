export type IntersectionStatus = 'active' | 'inactive' | 'planned' | string;

export type Intersection = {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: IntersectionStatus;
  city: string;
  address: string;
  category: string;
  latitude: number;
  longitude: number;
  camerasCount: number;
  onlineCamerasCount: number;
  createdAt: string;
  updatedAt: string;
};