import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import { MAP_CONFIG, getCurrentMapStyle } from '../../../shared/config/map';

type PickerMode = 'location' | 'direction';

type AdminCameraMapPickerProps = {
  latitude: number;
  longitude: number;
  directionDeg: number;
  fovDeg: number;
  rangeMeters: number;
  onLocationChange: (coords: { latitude: number; longitude: number }) => void;
  onDirectionChange: (directionDeg: number) => void;
};

const COVERAGE_SOURCE_ID = 'admin-camera-coverage';
const COVERAGE_OUTLINE_SOURCE_ID = 'admin-camera-coverage-outline';
const COVERAGE_RAY_SOURCE_ID = 'admin-camera-coverage-ray';

const COVERAGE_FILL_LAYER_ID = 'admin-camera-coverage-fill';
const COVERAGE_GLOW_LAYER_ID = 'admin-camera-coverage-glow';
const COVERAGE_OUTLINE_LAYER_ID = 'admin-camera-coverage-outline';
const COVERAGE_RAY_LAYER_ID = 'admin-camera-coverage-ray';

const EARTH_RADIUS_METERS = 6371000;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function toDegrees(value: number) {
  return (value * 180) / Math.PI;
}

function normalizeBearing(value: number) {
  return Math.round(((value % 360) + 360) % 360);
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

function calculateBearingDeg(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
) {
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const deltaLng = toRadians(to.longitude - from.longitude);

  const y = Math.sin(deltaLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);

  return normalizeBearing(toDegrees(Math.atan2(y, x)));
}

function createCameraMarkerElement() {
  const element = document.createElement('div');

  element.innerHTML = `
    <div class="camera-marker camera-marker--online">
      <button class="camera-marker__button" type="button" aria-label="Позиция камеры">
        <span class="camera-marker__pulse"></span>
        <span class="camera-marker__body">
          <span class="camera-marker__lens"></span>
          <span class="camera-marker__dot"></span>
        </span>
      </button>
    </div>
  `;

  return element;
}

function createCoverageGeoJson({
  latitude,
  longitude,
  directionDeg,
  fovDeg,
  rangeMeters,
}: {
  latitude: number;
  longitude: number;
  directionDeg: number;
  fovDeg: number;
  rangeMeters: number;
}) {
  const center: [number, number] = [longitude, latitude];

  const direction = normalizeBearing(directionDeg);
  const fov = Math.min(Math.max(fovDeg, 1), 360);
  const range = Math.max(rangeMeters, 1);

  const startBearing = direction - fov / 2;
  const steps = Math.max(12, Math.ceil(fov / 4));

  const arcPoints: [number, number][] = [];

  for (let index = 0; index <= steps; index += 1) {
    const bearing = startBearing + (fov * index) / steps;

    arcPoints.push(destinationPoint(latitude, longitude, bearing, range));
  }

  const directionPoint = destinationPoint(
    latitude,
    longitude,
    direction,
    range,
  );

  return {
    area: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [[center, ...arcPoints, center]],
          },
        },
      ],
    },
    outline: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [center, ...arcPoints, center],
          },
        },
      ],
    },
    ray: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [center, directionPoint],
          },
        },
      ],
    },
  };
}

function ensureCoverageLayers(map: maplibregl.Map) {
  const emptyData = {
    type: 'FeatureCollection',
    features: [],
  } as GeoJSON.FeatureCollection;

  if (!map.getSource(COVERAGE_SOURCE_ID)) {
    map.addSource(COVERAGE_SOURCE_ID, {
      type: 'geojson',
      data: emptyData,
    });
  }

  if (!map.getSource(COVERAGE_OUTLINE_SOURCE_ID)) {
    map.addSource(COVERAGE_OUTLINE_SOURCE_ID, {
      type: 'geojson',
      data: emptyData,
    });
  }

  if (!map.getSource(COVERAGE_RAY_SOURCE_ID)) {
    map.addSource(COVERAGE_RAY_SOURCE_ID, {
      type: 'geojson',
      data: emptyData,
    });
  }

  if (!map.getLayer(COVERAGE_FILL_LAYER_ID)) {
    map.addLayer({
      id: COVERAGE_FILL_LAYER_ID,
      type: 'fill',
      source: COVERAGE_SOURCE_ID,
      paint: {
        'fill-color': '#FFD21E',
        'fill-opacity': 0.22,
      },
    });
  }

  if (!map.getLayer(COVERAGE_GLOW_LAYER_ID)) {
    map.addLayer({
      id: COVERAGE_GLOW_LAYER_ID,
      type: 'line',
      source: COVERAGE_OUTLINE_SOURCE_ID,
      paint: {
        'line-color': '#FFD21E',
        'line-width': 8,
        'line-opacity': 0.22,
        'line-blur': 6,
      },
    });
  }

  if (!map.getLayer(COVERAGE_OUTLINE_LAYER_ID)) {
    map.addLayer({
      id: COVERAGE_OUTLINE_LAYER_ID,
      type: 'line',
      source: COVERAGE_OUTLINE_SOURCE_ID,
      paint: {
        'line-color': '#FFD21E',
        'line-width': 2.5,
        'line-opacity': 0.9,
      },
    });
  }

  if (!map.getLayer(COVERAGE_RAY_LAYER_ID)) {
    map.addLayer({
      id: COVERAGE_RAY_LAYER_ID,
      type: 'line',
      source: COVERAGE_RAY_SOURCE_ID,
      paint: {
        'line-color': '#FFD21E',
        'line-width': 2,
        'line-opacity': 0.8,
        'line-dasharray': [2, 2],
      },
    });
  }
}

export function AdminCameraMapPicker({
  latitude,
  longitude,
  directionDeg,
  fovDeg,
  rangeMeters,
  onLocationChange,
  onDirectionChange,
}: AdminCameraMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);

  const valuesRef = useRef({
    latitude,
    longitude,
    directionDeg,
    fovDeg,
    rangeMeters,
  });

  const [mode, setMode] = useState<PickerMode>('location');

  useEffect(() => {
    valuesRef.current = {
      latitude,
      longitude,
      directionDeg,
      fovDeg,
      rangeMeters,
    };
  }, [latitude, longitude, directionDeg, fovDeg, rangeMeters]);

  const updateCoverage = () => {
    const map = mapRef.current;

    if (!map || !map.isStyleLoaded()) {
      return;
    }

    const values = valuesRef.current;

    if (
      !Number.isFinite(values.latitude) ||
      !Number.isFinite(values.longitude)
    ) {
      return;
    }

    ensureCoverageLayers(map);

    const geoJson = createCoverageGeoJson(values);

    const areaSource = map.getSource(
      COVERAGE_SOURCE_ID,
    ) as maplibregl.GeoJSONSource | undefined;

    const outlineSource = map.getSource(
      COVERAGE_OUTLINE_SOURCE_ID,
    ) as maplibregl.GeoJSONSource | undefined;

    const raySource = map.getSource(
      COVERAGE_RAY_SOURCE_ID,
    ) as maplibregl.GeoJSONSource | undefined;

    areaSource?.setData(geoJson.area as GeoJSON.FeatureCollection);
    outlineSource?.setData(geoJson.outline as GeoJSON.FeatureCollection);
    raySource?.setData(geoJson.ray as GeoJSON.FeatureCollection);
  };

  const updateMarker = () => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    if (!markerRef.current) {
      markerRef.current = new maplibregl.Marker({
        element: createCameraMarkerElement(),
        anchor: 'center',
        draggable: true,
      })
        .setLngLat([longitude, latitude])
        .addTo(map);

      markerRef.current.on('dragend', () => {
        const lngLat = markerRef.current?.getLngLat();

        if (!lngLat) {
          return;
        }

        onLocationChange({
          latitude: Number(lngLat.lat.toFixed(6)),
          longitude: Number(lngLat.lng.toFixed(6)),
        });
      });

      return;
    }

    markerRef.current.setLngLat([longitude, latitude]);
  };

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: getCurrentMapStyle('default'),
      center: [longitude || MAP_CONFIG.fallbackCenter[0], latitude || MAP_CONFIG.fallbackCenter[1]],
      zoom: 13,
      attributionControl: false,
    });

    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl(), 'bottom-right');

    map.once('load', () => {
      updateMarker();
      updateCoverage();
    });

    map.on('click', (event) => {
      const currentValues = valuesRef.current;

      if (mode === 'location') {
        onLocationChange({
          latitude: Number(event.lngLat.lat.toFixed(6)),
          longitude: Number(event.lngLat.lng.toFixed(6)),
        });

        return;
      }

      const nextDirection = calculateBearingDeg(
        {
          latitude: currentValues.latitude,
          longitude: currentValues.longitude,
        },
        {
          latitude: event.lngLat.lat,
          longitude: event.lngLat.lng,
        },
      );

      onDirectionChange(nextDirection);
    });

    return () => {
      markerRef.current?.remove();
      markerRef.current = null;

      map.remove();
      mapRef.current = null;
    };
  }, [mode, onDirectionChange, onLocationChange, latitude, longitude]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    updateMarker();
    updateCoverage();

    map.easeTo({
      center: [longitude, latitude],
      duration: 350,
    });
  }, [latitude, longitude, directionDeg, fovDeg, rangeMeters]);

  return (
    <div className="overflow-hidden rounded-[30px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl shadow-[var(--color-shadow)]">
      <div className="flex flex-col gap-3 border-b border-[var(--color-border)] p-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h3 className="text-lg font-extrabold text-[var(--color-text-primary)]">
            Позиция камеры на карте
          </h3>

          <p className="mt-1 font-inter text-xs text-[var(--color-text-secondary)]">
            Поставьте камеру и укажите направление обзора.
          </p>
        </div>

        <div className="flex rounded-[18px] border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-1">
          <button
            type="button"
            onClick={() => setMode('location')}
            className={[
              'h-9 rounded-[14px] px-3 font-inter text-xs font-bold transition',
              mode === 'location'
                ? 'bg-[var(--color-primary)] text-[var(--color-secondary-text)]'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]',
            ].join(' ')}
          >
            Поставить
          </button>

          <button
            type="button"
            onClick={() => setMode('direction')}
            className={[
              'h-9 rounded-[14px] px-3 font-inter text-xs font-bold transition',
              mode === 'direction'
                ? 'bg-[var(--color-primary)] text-[var(--color-secondary-text)]'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]',
            ].join(' ')}
          >
            Направить
          </button>
        </div>
      </div>

      <div className="relative h-[420px]">
        <div ref={mapContainerRef} className="h-full w-full" />

        <div className="pointer-events-none absolute left-4 top-4 rounded-[18px] border border-[var(--color-border)] bg-[var(--navbar-bg)] px-4 py-3 shadow-xl shadow-[var(--color-shadow)] backdrop-blur-2xl">
          <p className="font-inter text-xs font-bold text-[var(--color-text-primary)]">
            {mode === 'location'
              ? 'Клик по карте поставит камеру'
              : 'Клик по карте задаст направление'}
          </p>

          <p className="mt-1 font-inter text-[11px] text-[var(--color-text-secondary)]">
            Маркер камеры можно перетаскивать
          </p>
        </div>
      </div>
    </div>
  );
}