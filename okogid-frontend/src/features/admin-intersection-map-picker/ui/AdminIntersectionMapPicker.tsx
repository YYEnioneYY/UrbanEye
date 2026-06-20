import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import {
  getCurrentMapStyle,
} from '../../../shared/config/map';

export type AdminIntersectionMapMode =
  | 'intersection'
  | 'camera'
  | 'direction';

type AdminIntersectionMapPickerProps = {
  mode: AdminIntersectionMapMode;
  intersectionLatitude: number;
  intersectionLongitude: number;
  cameraLatitude: number;
  cameraLongitude: number;
  directionDeg: number;
  rangeMeters: number;
  onIntersectionChange: (coords: { latitude: number; longitude: number }) => void;
  onCameraChange: (coords: { latitude: number; longitude: number }) => void;
  onDirectionChange: (directionDeg: number) => void;
};

const DIRECTION_SOURCE_ID = 'admin-intersection-camera-direction-source';
const DIRECTION_LAYER_ID = 'admin-intersection-camera-direction-layer';

function createMarkerElement(label: string, color: string) {
  const element = document.createElement('div');

  element.style.width = '42px';
  element.style.height = '42px';
  element.style.borderRadius = '16px';
  element.style.display = 'flex';
  element.style.alignItems = 'center';
  element.style.justifyContent = 'center';
  element.style.background = color;
  element.style.color = '#0F1318';
  element.style.fontFamily = 'Inter, sans-serif';
  element.style.fontSize = '12px';
  element.style.fontWeight = '900';
  element.style.boxShadow =
    '0 18px 38px rgba(0,0,0,0.32), 0 0 0 8px rgba(255,210,30,0.18)';
  element.style.border = '2px solid rgba(15,19,24,0.12)';
  element.style.cursor = 'grab';

  element.textContent = label;

  return element;
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function toDegrees(value: number) {
  return (value * 180) / Math.PI;
}

function calculateBearing(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);
  const deltaLng = toRadians(to.lng - from.lng);

  const y = Math.sin(deltaLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);

  return Math.round((toDegrees(Math.atan2(y, x)) + 360) % 360);
}

function getDestinationPoint(
  latitude: number,
  longitude: number,
  bearingDeg: number,
  distanceMeters: number,
) {
  const earthRadius = 6371000;
  const bearing = toRadians(bearingDeg);
  const distanceRatio = distanceMeters / earthRadius;

  const lat1 = toRadians(latitude);
  const lng1 = toRadians(longitude);

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(distanceRatio) +
      Math.cos(lat1) * Math.sin(distanceRatio) * Math.cos(bearing),
  );

  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(distanceRatio) * Math.cos(lat1),
      Math.cos(distanceRatio) - Math.sin(lat1) * Math.sin(lat2),
    );

  return {
    latitude: toDegrees(lat2),
    longitude: toDegrees(lng2),
  };
}

function createDirectionLineGeoJson(
  cameraLatitude: number,
  cameraLongitude: number,
  directionDeg: number,
  rangeMeters: number,
): GeoJSON.FeatureCollection {
  const end = getDestinationPoint(
    cameraLatitude,
    cameraLongitude,
    directionDeg,
    rangeMeters,
  );

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: [
            [cameraLongitude, cameraLatitude],
            [end.longitude, end.latitude],
          ],
        },
      },
    ],
  };
}

function ensureDirectionLayer(map: maplibregl.Map) {
  if (!map.getSource(DIRECTION_SOURCE_ID)) {
    map.addSource(DIRECTION_SOURCE_ID, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
    });
  }

  if (!map.getLayer(DIRECTION_LAYER_ID)) {
    map.addLayer({
      id: DIRECTION_LAYER_ID,
      type: 'line',
      source: DIRECTION_SOURCE_ID,
      paint: {
        'line-color': '#FFD21E',
        'line-width': 4,
        'line-opacity': 0.9,
        'line-dasharray': [2, 1],
      },
    });
  }
}

export function AdminIntersectionMapPicker({
  mode,
  intersectionLatitude,
  intersectionLongitude,
  cameraLatitude,
  cameraLongitude,
  directionDeg,
  rangeMeters,
  onIntersectionChange,
  onCameraChange,
  onDirectionChange,
}: AdminIntersectionMapPickerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const intersectionMarkerRef = useRef<maplibregl.Marker | null>(null);
  const cameraMarkerRef = useRef<maplibregl.Marker | null>(null);

  const propsRef = useRef({
    mode,
    intersectionLatitude,
    intersectionLongitude,
    cameraLatitude,
    cameraLongitude,
    directionDeg,
    rangeMeters,
    onIntersectionChange,
    onCameraChange,
    onDirectionChange,
  });

  propsRef.current = {
    mode,
    intersectionLatitude,
    intersectionLongitude,
    cameraLatitude,
    cameraLongitude,
    directionDeg,
    rangeMeters,
    onIntersectionChange,
    onCameraChange,
    onDirectionChange,
  };

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: getCurrentMapStyle('default'),
      center: [intersectionLongitude, intersectionLatitude],
      zoom: 15,
      attributionControl: false,
    });

    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl(), 'bottom-right');

    const intersectionMarker = new maplibregl.Marker({
      element: createMarkerElement('X', '#FFD21E'),
      draggable: true,
      anchor: 'center',
    })
      .setLngLat([intersectionLongitude, intersectionLatitude])
      .addTo(map);

    const cameraMarker = new maplibregl.Marker({
      element: createMarkerElement('CAM', '#FFFFFF'),
      draggable: true,
      anchor: 'center',
    })
      .setLngLat([cameraLongitude, cameraLatitude])
      .addTo(map);

    intersectionMarkerRef.current = intersectionMarker;
    cameraMarkerRef.current = cameraMarker;

    intersectionMarker.on('dragend', () => {
      const lngLat = intersectionMarker.getLngLat();

      propsRef.current.onIntersectionChange({
        latitude: lngLat.lat,
        longitude: lngLat.lng,
      });
    });

    cameraMarker.on('dragend', () => {
      const lngLat = cameraMarker.getLngLat();

      propsRef.current.onCameraChange({
        latitude: lngLat.lat,
        longitude: lngLat.lng,
      });
    });

    map.on('load', () => {
      ensureDirectionLayer(map);

      const source = map.getSource(
        DIRECTION_SOURCE_ID,
      ) as maplibregl.GeoJSONSource | undefined;

      source?.setData(
        createDirectionLineGeoJson(
          propsRef.current.cameraLatitude,
          propsRef.current.cameraLongitude,
          propsRef.current.directionDeg,
          propsRef.current.rangeMeters,
        ),
      );
    });

    map.on('click', (event) => {
      const current = propsRef.current;

      if (current.mode === 'intersection') {
        current.onIntersectionChange({
          latitude: event.lngLat.lat,
          longitude: event.lngLat.lng,
        });

        return;
      }

      if (current.mode === 'camera') {
        current.onCameraChange({
          latitude: event.lngLat.lat,
          longitude: event.lngLat.lng,
        });

        return;
      }

      if (current.mode === 'direction') {
        const bearing = calculateBearing(
          {
            lat: current.cameraLatitude,
            lng: current.cameraLongitude,
          },
          {
            lat: event.lngLat.lat,
            lng: event.lngLat.lng,
          },
        );

        current.onDirectionChange(bearing);
      }
    });

    return () => {
      intersectionMarker.remove();
      cameraMarker.remove();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    intersectionMarkerRef.current?.setLngLat([
      intersectionLongitude,
      intersectionLatitude,
    ]);

    cameraMarkerRef.current?.setLngLat([cameraLongitude, cameraLatitude]);

    const map = mapRef.current;

    if (!map || !map.isStyleLoaded()) {
      return;
    }

    ensureDirectionLayer(map);

    const source = map.getSource(
      DIRECTION_SOURCE_ID,
    ) as maplibregl.GeoJSONSource | undefined;

    source?.setData(
      createDirectionLineGeoJson(
        cameraLatitude,
        cameraLongitude,
        directionDeg,
        rangeMeters,
      ),
    );
  }, [
    intersectionLatitude,
    intersectionLongitude,
    cameraLatitude,
    cameraLongitude,
    directionDeg,
    rangeMeters,
  ]);

  return (
    <div className="overflow-hidden rounded-[32px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl shadow-[var(--color-shadow)]">
      <div className="border-b border-[var(--color-border)] bg-[var(--color-bg-soft)] px-5 py-4">
        <p className="font-inter text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
          Карта выбора координат
        </p>

        <p className="mt-1 font-inter text-sm text-[var(--color-text-secondary)]">
          {mode === 'intersection' &&
            'Клик по карте ставит точку перекрёстка.'}
          {mode === 'camera' && 'Клик по карте ставит точку камеры.'}
          {mode === 'direction' &&
            'Клик по карте задаёт направление обзора камеры.'}
        </p>
      </div>

      <div ref={containerRef} className="h-[520px] w-full" />
    </div>
  );
}