import type { GeoLocation } from '../../../entities/location/model/types';

function isValidCoordinate(latitude: number, longitude: number) {
  const isValidLatitude = latitude >= -90 && latitude <= 90;
  const isValidLongitude = longitude >= -180 && longitude <= 180;
  const isZeroOceanPoint = latitude === 0 && longitude === 0;

  return isValidLatitude && isValidLongitude && !isZeroOceanPoint;
}

export function getBrowserGeoLocation(): Promise<GeoLocation> {
  if (!navigator.geolocation) {
    return Promise.reject(new Error('Browser geolocation is not supported'));
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        if (!isValidCoordinate(latitude, longitude)) {
          reject(new Error('Invalid browser geolocation coordinates'));
          return;
        }

        resolve({
          latitude,
          longitude,
          accuracy,
          source: 'browser',
        });
      },
      reject,
      {
        enableHighAccuracy: true,
        timeout: 15_000,
        maximumAge: 0,
      },
    );
  });
}