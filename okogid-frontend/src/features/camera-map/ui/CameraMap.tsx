import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import type { Camera } from '../../../entities/camera/model/types';
import {
  getCameraById,
  getCameras,
} from '../../../entities/camera/api/camerasApi';

import {
  MAP_CONFIG,
  MAP_STYLES,
  getCurrentMapStyle,
} from '../../../shared/config/map';
import { MAP_EVENTS } from '../../../shared/config/mapEvents';

import { getMyGeoLocation } from '../api/getMyGeoLocation';
import { createCameraMarkerElement } from '../lib/createCameraMarkerElement';
import { createUserLocationMarkerElement } from '../lib/createUserLocationMarkerElement';
import { getBrowserGeoLocation } from '../lib/getBrowserGeoLocation';

import { CameraDetailsPanel } from './CameraDetailsPanel';

export function CameraMap() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const cameraMarkersRef = useRef<maplibregl.Marker[]>([]);
  const userLocationMarkerRef = useRef<maplibregl.Marker | null>(null);

  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [isCamerasLoading, setIsCamerasLoading] = useState(true);
  const [camerasError, setCamerasError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    let isActive = true;
    const abortController = new AbortController();

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: getCurrentMapStyle(),
      center: MAP_CONFIG.fallbackCenter,
      zoom: MAP_CONFIG.fallbackZoom,
      attributionControl: false,
    });

    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl(), 'bottom-left');

    function clearCameraMarkers() {
      cameraMarkersRef.current.forEach((marker) => marker.remove());
      cameraMarkersRef.current = [];
    }

    async function handleCameraClick(camera: Camera) {
      setSelectedCamera(camera);

      map.easeTo({
        center: [camera.longitude, camera.latitude],
        zoom: Math.max(map.getZoom(), 14),
        duration: 700,
        offset: [-220, 0],
      });

      try {
        const freshCamera = await getCameraById(
          camera.id,
          abortController.signal,
        );

        if (!isActive) {
          return;
        }

        setSelectedCamera(freshCamera);
      } catch (error) {
        console.warn('Failed to load camera details:', error);
      }
    }

    function renderCameraMarkers(cameras: Camera[]) {
      clearCameraMarkers();

      const markers = cameras.map((camera) => {
        const element = createCameraMarkerElement(camera);

        const button = element.querySelector<HTMLButtonElement>(
          '.camera-marker__button',
        );

        button?.addEventListener('click', () => {
          handleCameraClick(camera);
        });

        return new maplibregl.Marker({
          element,
          anchor: 'center',
        })
          .setLngLat([camera.longitude, camera.latitude])
          .addTo(map);
      });

      cameraMarkersRef.current = markers;
    }

    async function handleFindMe() {
      window.dispatchEvent(new Event(MAP_EVENTS.findMeStart));

      try {
        const geo = await getBrowserGeoLocation();

        userLocationMarkerRef.current?.remove();

        userLocationMarkerRef.current = new maplibregl.Marker({
          element: createUserLocationMarkerElement(),
          anchor: 'center',
        })
          .setLngLat([geo.longitude, geo.latitude])
          .addTo(map);

        map.easeTo({
          center: [geo.longitude, geo.latitude],
          zoom: Math.max(map.getZoom(), 15),
          duration: 900,
        });

        window.dispatchEvent(
          new CustomEvent(MAP_EVENTS.findMeSuccess, {
            detail: {
              geo,
            },
          }),
        );
      } catch (error) {
        console.warn('Browser geolocation failed:', error);

        window.dispatchEvent(new Event(MAP_EVENTS.findMeError));

        alert(
          'Не удалось получить точную геолокацию. Разреши доступ к местоположению в браузере.',
        );
      }
    }

    const handleThemeChange = (event: Event) => {
      const themeEvent = event as CustomEvent<{
        mode: 'light' | 'dark' | 'auto';
        resolvedTheme: 'light' | 'dark';
      }>;

      map.setStyle(MAP_STYLES[themeEvent.detail.resolvedTheme]);
    };

    window.addEventListener(MAP_EVENTS.findMe, handleFindMe);
    window.addEventListener('okogid-theme-change', handleThemeChange);

    map.on('load', async () => {
      try {
        const geo = await getMyGeoLocation(abortController.signal);

        if (isActive) {
          map.easeTo({
            center: [geo.longitude, geo.latitude],
            zoom: MAP_CONFIG.cityZoom,
            duration: 900,
          });
        }
      } catch (error) {
        console.warn(
          'Failed to load geo location. Fallback to Saint Petersburg:',
          error,
        );

        map.easeTo({
          center: MAP_CONFIG.fallbackCenter,
          zoom: MAP_CONFIG.fallbackZoom,
          duration: 500,
        });
      }

      try {
        setIsCamerasLoading(true);
        setCamerasError(null);

        const cameras = await getCameras(abortController.signal);

        if (!isActive) {
          return;
        }

        renderCameraMarkers(cameras);
      } catch (error) {
        if (!isActive) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : 'Не удалось загрузить камеры';

        setCamerasError(message);
      } finally {
        if (isActive) {
          setIsCamerasLoading(false);
        }
      }
    });

    return () => {
      isActive = false;
      abortController.abort();

      window.removeEventListener(MAP_EVENTS.findMe, handleFindMe);
      window.removeEventListener('okogid-theme-change', handleThemeChange);

      userLocationMarkerRef.current?.remove();
      userLocationMarkerRef.current = null;

      clearCameraMarkers();

      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div ref={mapContainerRef} className="h-full w-full" />

      {isCamerasLoading && (
        <div className="pointer-events-none absolute bottom-6 left-1/2 z-20 -translate-x-1/2 rounded-full border border-[var(--color-border)] bg-[var(--navbar-bg)] px-5 py-3 text-sm font-bold text-[var(--color-text-primary)] shadow-xl shadow-[var(--color-shadow)] backdrop-blur-2xl">
          Загружаем камеры...
        </div>
      )}

      {camerasError && (
        <div className="absolute bottom-6 left-1/2 z-20 w-[calc(100%-32px)] max-w-md -translate-x-1/2 rounded-[24px] border border-red-500/20 bg-red-500/10 px-5 py-4 text-center font-inter text-sm font-semibold text-red-600 shadow-xl backdrop-blur-2xl">
          {camerasError}
        </div>
      )}

      <CameraDetailsPanel
        camera={selectedCamera}
        onClose={() => setSelectedCamera(null)}
      />
    </div>
  );
}