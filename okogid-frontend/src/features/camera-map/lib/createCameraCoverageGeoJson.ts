import type {
  Feature,
  FeatureCollection,
  LineString,
  Polygon,
} from 'geojson';

import type { Camera } from '../../../entities/camera/model/types';

type CameraCoverageProperties = {
  cameraId: string;
  title: string;
  status: Camera['status'];
  selected: boolean;
};

export type CameraCoverageGeoJson = {
  areas: FeatureCollection<Polygon, CameraCoverageProperties>;
  outlines: FeatureCollection<LineString, CameraCoverageProperties>;
  rays: FeatureCollection<LineString, CameraCoverageProperties>;
};

const EARTH_RADIUS_METERS = 6371000;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function toDegrees(value: number) {
  return (value * 180) / Math.PI;
}

function normalizeBearing(value: number) {
  return ((value % 360) + 360) % 360;
}

function destinationPoint(
  lat: number,
  lng: number,
  bearingDeg: number,
  distanceMeters: number,
): [number, number] {
  const angularDistance = distanceMeters / EARTH_RADIUS_METERS;

  const bearing = toRadians(bearingDeg);
  const lat1 = toRadians(lat);
  const lng1 = toRadians(lng);

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angularDistance) +
      Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing),
  );

  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1),
      Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2),
    );

  return [toDegrees(lng2), toDegrees(lat2)];
}

export function createCameraCoverageGeoJson(
  cameras: Camera[],
  selectedCameraId: string | null,
): CameraCoverageGeoJson {
  const areaFeatures: Feature<Polygon, CameraCoverageProperties>[] = [];
  const outlineFeatures: Feature<LineString, CameraCoverageProperties>[] = [];
  const rayFeatures: Feature<LineString, CameraCoverageProperties>[] = [];

  cameras.forEach((camera) => {
    if (!camera.coverage) {
      return;
    }

    const { directionDeg, fovDeg, rangeMeters } = camera.coverage;

    if (
      !Number.isFinite(directionDeg) ||
      !Number.isFinite(fovDeg) ||
      !Number.isFinite(rangeMeters) ||
      rangeMeters <= 0
    ) {
      return;
    }

    const center: [number, number] = [camera.longitude, camera.latitude];

    const direction = normalizeBearing(directionDeg);
    const fov = Math.min(Math.max(fovDeg, 1), 360);
    const range = Math.max(rangeMeters, 1);

    const startBearing = direction - fov / 2;
    const steps = Math.max(10, Math.ceil(fov / 5));

    const arcPoints: [number, number][] = [];

    for (let index = 0; index <= steps; index += 1) {
      const bearing = startBearing + (fov * index) / steps;

      arcPoints.push(
        destinationPoint(camera.latitude, camera.longitude, bearing, range),
      );
    }

    const areaCoordinates: [number, number][] = [
      center,
      ...arcPoints,
      center,
    ];

    const outlineCoordinates: [number, number][] = [
      center,
      ...arcPoints,
      center,
    ];

    const directionPoint = destinationPoint(
      camera.latitude,
      camera.longitude,
      direction,
      range,
    );

    const properties: CameraCoverageProperties = {
      cameraId: camera.id,
      title: camera.title,
      status: camera.status,
      selected: selectedCameraId === camera.id,
    };

    areaFeatures.push({
      type: 'Feature',
      properties,
      geometry: {
        type: 'Polygon',
        coordinates: [areaCoordinates],
      },
    });

    outlineFeatures.push({
      type: 'Feature',
      properties,
      geometry: {
        type: 'LineString',
        coordinates: outlineCoordinates,
      },
    });

    rayFeatures.push({
      type: 'Feature',
      properties,
      geometry: {
        type: 'LineString',
        coordinates: [center, directionPoint],
      },
    });
  });

  return {
    areas: {
      type: 'FeatureCollection',
      features: areaFeatures,
    },
    outlines: {
      type: 'FeatureCollection',
      features: outlineFeatures,
    },
    rays: {
      type: 'FeatureCollection',
      features: rayFeatures,
    },
  };
}