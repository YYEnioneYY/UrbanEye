export type GeoLocationSource = 'browser' | 'ip';

export type GeoLocation = {
  ip?: string;
  country?: string;
  region?: string;
  city?: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  source?: GeoLocationSource;
};