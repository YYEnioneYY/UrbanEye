import type { GeoLocation } from '../../../entities/location/model/types';
import { API_CONFIG, createApiUrl } from '../../../shared/config/api';

type RawGeoLocationResponse = {
  ip?: string;
  country?: string;
  region?: string;
  city?: string;

  latitude?: number;
  longitude?: number;

  lat?: number;
  lon?: number;
  lng?: number;
};

function isValidCoordinate(latitude: number, longitude: number) {
  const isValidLatitude = latitude >= -90 && latitude <= 90;
  const isValidLongitude = longitude >= -180 && longitude <= 180;

  const isZeroOceanPoint = latitude === 0 && longitude === 0;

  return isValidLatitude && isValidLongitude && !isZeroOceanPoint;
}

function normalizeGeoLocation(data: RawGeoLocationResponse): GeoLocation {
  const latitude = data.latitude ?? data.lat;
  const longitude = data.longitude ?? data.lon ?? data.lng;

  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    throw new Error('Invalid geo location response');
  }

  if (!isValidCoordinate(latitude, longitude)) {
    throw new Error('Invalid geo location coordinates');
  }

  return {
    ip: data.ip,
    country: data.country,
    region: data.region,
    city: data.city,
    latitude,
    longitude,
    source: 'ip',
  };
}

export async function getMyGeoLocation(
  signal?: AbortSignal,
): Promise<GeoLocation> {
  const response = await fetch(createApiUrl(API_CONFIG.apiBaseUrl, '/geo/me'), {
    method: 'GET',
    signal,
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Geo API request failed: ${response.status}`);
  }

  const data = (await response.json()) as RawGeoLocationResponse;

  return normalizeGeoLocation(data);
}