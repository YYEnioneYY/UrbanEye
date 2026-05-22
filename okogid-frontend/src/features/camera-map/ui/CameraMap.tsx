import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import type { Camera } from '../../../entities/camera/model/types';
import { mockCameras } from '../../../entities/camera/model/mockCameras';
import { MAP_CONFIG, getCurrentMapStyle, MAP_STYLES  } from '../../../shared/config/map';
import { createCameraMarkerElement } from '../lib/createCameraMarkerElement';
import { CameraDetailsPanel } from './CameraDetailsPanel';

import { getMyGeoLocation } from '../api/getMyGeoLocation';

import { MAP_EVENTS } from '../../../shared/config/mapEvents';
import { getBrowserGeoLocation } from '../lib/getBrowserGeoLocation';
import { createUserLocationMarkerElement } from '../lib/createUserLocationMarkerElement';

export function CameraMap() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const userLocationMarkerRef = useRef<maplibregl.Marker | null>(null);

  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    const abortController = new AbortController();

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: getCurrentMapStyle(),
      center: MAP_CONFIG.fallbackCenter,
      zoom: MAP_CONFIG.fallbackZoom,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl(), 'bottom-right');

    const handleThemeChange = (event: Event) => {
      const themeEvent = event as CustomEvent<{
        mode: 'light' | 'dark' | 'auto';
        resolvedTheme: 'light' | 'dark';
      }>;
    
      const nextStyle = MAP_STYLES[themeEvent.detail.resolvedTheme];
    
      map.setStyle(nextStyle);
    };

    const handleFindMe = async () => {
      window.dispatchEvent(new Event(MAP_EVENTS.findMeStart));

      try {
        const geo = await getBrowserGeoLocation();

        console.log('Browser location:', {
          latitude: geo.latitude,
          longitude: geo.longitude,
          accuracy: geo.accuracy,
          source: geo.source,
        });
      
        userLocationMarkerRef.current?.remove();
      
        userLocationMarkerRef.current = new maplibregl.Marker({
          element: createUserLocationMarkerElement(),
          anchor: 'center',
        })
          .setLngLat([geo.longitude, geo.latitude])
          .addTo(map);
      
        map.easeTo({
          center: [geo.longitude, geo.latitude],
          zoom: Math.max(map.getZoom(), 14),
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
        console.warn('Failed to find user location:', error);
      
        window.dispatchEvent(new Event(MAP_EVENTS.findMeError));
      }
    };

    window.addEventListener(MAP_EVENTS.findMe, handleFindMe);

    window.addEventListener('okogid-theme-change', handleThemeChange);

    map.on('load', async () => {
      try {
        const geo = await getMyGeoLocation(abortController.signal);
          
        map.easeTo({
          center: [geo.longitude, geo.latitude],
          zoom: MAP_CONFIG.cityZoom,
          duration: 900,
        });
      } catch (error) {
        console.warn('Failed to load geo location:', error);
      }

      const markers = mockCameras.map((camera) => {
        const element = createCameraMarkerElement(camera);

        const button = element.querySelector<HTMLButtonElement>(
          '.camera-marker__button',
        );

        button?.addEventListener('click', () => {
          setSelectedCamera(camera);

          map.easeTo({
            center: [camera.longitude, camera.latitude],
            zoom: Math.max(map.getZoom(), 14),
            duration: 700,

            // Сдвигаем камеру левее, чтобы метка не пряталась под правой карточкой
            offset: [-220, 0],
          });
        });

        return new maplibregl.Marker({
          element,
          anchor: 'center',
        })
          .setLngLat([camera.longitude, camera.latitude])
          .addTo(map);
      });

      markersRef.current = markers;
    });

    mapRef.current = map;

    return () => {
      abortController.abort();

      window.removeEventListener(MAP_EVENTS.findMe, handleFindMe);
      window.removeEventListener('okogid-theme-change', handleThemeChange);

      userLocationMarkerRef.current?.remove();
      userLocationMarkerRef.current = null;

      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div ref={mapContainerRef} className="h-full w-full" />

      <CameraDetailsPanel
        camera={selectedCamera}
        onClose={() => setSelectedCamera(null)}
      />
    </div>
  );
}