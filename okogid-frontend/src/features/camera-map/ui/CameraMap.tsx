import { useCallback, useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import type { Camera } from '../../../entities/camera/model/types';
import {
  ensureBuildings3dLayer,
  setBuildings3dVisibility,
} from '../lib/map3dBuildings';
import {
  getCameraById,
  getCamerasByBbox,
  getCamerasLookingAt,
} from '../../../entities/camera/api/camerasApi';

import {
  MAP_CONFIG,
  MAP_STYLES,
  getCurrentMapStyle,
  type MapBaseMode,
  type MapViewMode,
} from '../../../shared/config/map';
import { MAP_EVENTS } from '../../../shared/config/mapEvents';

import { getMyGeoLocation } from '../api/getMyGeoLocation';
import { createCameraMarkerElement } from '../lib/createCameraMarkerElement';
import { createUserLocationMarkerElement } from '../lib/createUserLocationMarkerElement';
import { getBrowserGeoLocation } from '../lib/getBrowserGeoLocation';
import { createCameraCoverageGeoJson } from '../lib/createCameraCoverageGeoJson';

import { CameraDetailsPanel } from './CameraDetailsPanel';
import { LookingAtCamerasPanel } from './LookingAtCamerasPanel';
import { MapBaseModeSwitcher } from './MapBaseModeSwitcher';
import { MapContextMenu } from './MapContextMenu';

type MapContextMenuState = {
  x: number;
  y: number;
  lat: number;
  lng: number;
};

type LookingAtPanelState = {
  isOpen: boolean;
  target: {
    lat: number;
    lng: number;
  } | null;
  cameras: Camera[];
  isLoading: boolean;
  error: string | null;
};

const INITIAL_LOOKING_AT_PANEL_STATE: LookingAtPanelState = {
  isOpen: false,
  target: null,
  cameras: [],
  isLoading: false,
  error: null,
};

const CAMERA_COVERAGE_AREA_SOURCE_ID = 'camera-coverage-areas';
const CAMERA_COVERAGE_OUTLINE_SOURCE_ID = 'camera-coverage-outlines';
const CAMERA_COVERAGE_RAY_SOURCE_ID = 'camera-coverage-rays';

const CAMERA_COVERAGE_FILL_LAYER_ID = 'camera-coverage-fill';
const CAMERA_COVERAGE_OUTLINE_GLOW_LAYER_ID = 'camera-coverage-outline-glow';
const CAMERA_COVERAGE_OUTLINE_LAYER_ID = 'camera-coverage-outline';
const CAMERA_COVERAGE_RAY_LAYER_ID = 'camera-coverage-ray';

function getMapBbox(map: maplibregl.Map) {
  const bounds = map.getBounds();

  const southWest = bounds.getSouthWest();
  const northEast = bounds.getNorthEast();

  return {
    minLng: southWest.lng,
    minLat: southWest.lat,
    maxLng: northEast.lng,
    maxLat: northEast.lat,
  };
}

function ensureCameraCoverageLayers(map: maplibregl.Map) {
  const emptyCoverage = createCameraCoverageGeoJson([], null);

  if (!map.getSource(CAMERA_COVERAGE_AREA_SOURCE_ID)) {
    map.addSource(CAMERA_COVERAGE_AREA_SOURCE_ID, {
      type: 'geojson',
      data: emptyCoverage.areas,
    });
  }

  if (!map.getSource(CAMERA_COVERAGE_OUTLINE_SOURCE_ID)) {
    map.addSource(CAMERA_COVERAGE_OUTLINE_SOURCE_ID, {
      type: 'geojson',
      data: emptyCoverage.outlines,
    });
  }

  if (!map.getSource(CAMERA_COVERAGE_RAY_SOURCE_ID)) {
    map.addSource(CAMERA_COVERAGE_RAY_SOURCE_ID, {
      type: 'geojson',
      data: emptyCoverage.rays,
    });
  }

  if (!map.getLayer(CAMERA_COVERAGE_FILL_LAYER_ID)) {
    map.addLayer({
      id: CAMERA_COVERAGE_FILL_LAYER_ID,
      type: 'fill',
      source: CAMERA_COVERAGE_AREA_SOURCE_ID,
      paint: {
        'fill-color': '#FFD21E',
        'fill-opacity': [
          'case',
          ['==', ['get', 'selected'], true],
          0.3,
          0.11,
        ],
      },
    });
  }

  if (!map.getLayer(CAMERA_COVERAGE_OUTLINE_GLOW_LAYER_ID)) {
    map.addLayer({
      id: CAMERA_COVERAGE_OUTLINE_GLOW_LAYER_ID,
      type: 'line',
      source: CAMERA_COVERAGE_OUTLINE_SOURCE_ID,
      paint: {
        'line-color': '#FFD21E',
        'line-width': [
          'case',
          ['==', ['get', 'selected'], true],
          8,
          5,
        ],
        'line-opacity': [
          'case',
          ['==', ['get', 'selected'], true],
          0.25,
          0.1,
        ],
        'line-blur': 5,
      },
    });
  }

  if (!map.getLayer(CAMERA_COVERAGE_OUTLINE_LAYER_ID)) {
    map.addLayer({
      id: CAMERA_COVERAGE_OUTLINE_LAYER_ID,
      type: 'line',
      source: CAMERA_COVERAGE_OUTLINE_SOURCE_ID,
      paint: {
        'line-color': '#FFD21E',
        'line-width': [
          'case',
          ['==', ['get', 'selected'], true],
          2.5,
          1.4,
        ],
        'line-opacity': [
          'case',
          ['==', ['get', 'selected'], true],
          0.9,
          0.35,
        ],
      },
    });
  }

  if (!map.getLayer(CAMERA_COVERAGE_RAY_LAYER_ID)) {
    map.addLayer({
      id: CAMERA_COVERAGE_RAY_LAYER_ID,
      type: 'line',
      source: CAMERA_COVERAGE_RAY_SOURCE_ID,
      paint: {
        'line-color': '#FFD21E',
        'line-width': [
          'case',
          ['==', ['get', 'selected'], true],
          2,
          1,
        ],
        'line-opacity': [
          'case',
          ['==', ['get', 'selected'], true],
          0.75,
          0.25,
        ],
        'line-dasharray': [2, 2],
      },
    });
  }
}

export function CameraMap() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const cameraMarkersRef = useRef<maplibregl.Marker[]>([]);
  const userLocationMarkerRef = useRef<maplibregl.Marker | null>(null);

  const mapBaseModeRef = useRef<MapBaseMode>('default');
  const mapViewModeRef = useRef<MapViewMode>('2d');

  const detailsAbortControllerRef = useRef<AbortController | null>(null);
  const lookingAtAbortControllerRef = useRef<AbortController | null>(null);

  const visibleCamerasRef = useRef<Camera[]>([]);
  const selectedCameraIdRef = useRef<string | null>(null);

  const [mapBaseMode, setMapBaseMode] = useState<MapBaseMode>('default');
  const [mapViewMode, setMapViewMode] = useState<MapViewMode>('2d');

  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [isCameraDetailsLoading, setIsCameraDetailsLoading] = useState(false);

  const [isCamerasLoading, setIsCamerasLoading] = useState(true);
  const [camerasError, setCamerasError] = useState<string | null>(null);

  const [contextMenu, setContextMenu] =
    useState<MapContextMenuState | null>(null);

  const [lookingAtPanel, setLookingAtPanel] =
    useState<LookingAtPanelState>(INITIAL_LOOKING_AT_PANEL_STATE);

  const updateCameraCoverageLayers = () => {
    const map = mapRef.current;

    if (!map || !map.isStyleLoaded()) {
      return;
    }

    ensureCameraCoverageLayers(map);

    const coverageGeoJson = createCameraCoverageGeoJson(
      visibleCamerasRef.current,
      selectedCameraIdRef.current,
    );

    const areaSource = map.getSource(
      CAMERA_COVERAGE_AREA_SOURCE_ID,
    ) as maplibregl.GeoJSONSource | undefined;

    const outlineSource = map.getSource(
      CAMERA_COVERAGE_OUTLINE_SOURCE_ID,
    ) as maplibregl.GeoJSONSource | undefined;

    const raySource = map.getSource(
      CAMERA_COVERAGE_RAY_SOURCE_ID,
    ) as maplibregl.GeoJSONSource | undefined;

    areaSource?.setData(coverageGeoJson.areas);
    outlineSource?.setData(coverageGeoJson.outlines);
    raySource?.setData(coverageGeoJson.rays);
  };

  const restoreCustomMapLayers = () => {
    const map = mapRef.current;

    if (!map || !map.isStyleLoaded()) {
      return;
    }

    updateCameraCoverageLayers();

    if (mapViewModeRef.current === '3d') {
      ensureBuildings3dLayer(map);
      setBuildings3dVisibility(map, true);
    }
  };

  const applyMapViewMode = (nextMode: MapViewMode) => {
    const map = mapRef.current;

    mapViewModeRef.current = nextMode;
    setMapViewMode(nextMode);

    if (!map) {
      return;
    }

    if (nextMode === '3d') {
      if (mapBaseModeRef.current === 'satellite') {
        mapBaseModeRef.current = 'default';
        setMapBaseMode('default');

        map.setStyle(getCurrentMapStyle('default'));

        map.once('idle', () => {
          restoreCustomMapLayers();

          map.easeTo({
            pitch: 62,
            bearing: -20,
            zoom: Math.max(map.getZoom(), 15.4),
            duration: 900,
          });
        });

        return;
      }

      ensureBuildings3dLayer(map);
      setBuildings3dVisibility(map, true);

      map.easeTo({
        pitch: 62,
        bearing: -20,
        zoom: Math.max(map.getZoom(), 15.4),
        duration: 900,
      });

      return;
    }

    setBuildings3dVisibility(map, false);

    map.easeTo({
      pitch: 0,
      bearing: 0,
      duration: 800,
    });
  };

  const selectCamera = useCallback(async (camera: Camera) => {
    selectedCameraIdRef.current = camera.id;
    updateCameraCoverageLayers();

    setLookingAtPanel((prev) => ({
      ...prev,
      isOpen: false,
    }));

    setSelectedCamera(camera);

    const map = mapRef.current;

    if (map) {
      map.easeTo({
        center: [camera.longitude, camera.latitude],
        zoom: Math.max(map.getZoom(), 14),
        duration: 700,
        offset: [-220, 0],
      });
    }

    detailsAbortControllerRef.current?.abort();

    const abortController = new AbortController();
    detailsAbortControllerRef.current = abortController;

    try {
      setIsCameraDetailsLoading(true);

      const freshCamera = await getCameraById(
        camera.id,
        abortController.signal,
      );

      if (abortController.signal.aborted) {
        return;
      }

      setSelectedCamera(freshCamera);

      visibleCamerasRef.current = visibleCamerasRef.current.map((item) =>
        item.id === freshCamera.id ? freshCamera : item,
      );

      updateCameraCoverageLayers();
    } catch (error) {
      if (!abortController.signal.aborted) {
        console.warn('Failed to load camera details:', error);
      }
    } finally {
      if (!abortController.signal.aborted) {
        setIsCameraDetailsLoading(false);
      }
    }
  }, []);

  const handleMapBaseModeChange = (nextMode: MapBaseMode) => {
    if (mapBaseModeRef.current === nextMode) {
      return;
    }

    setMapBaseMode(nextMode);
    mapBaseModeRef.current = nextMode;

    const map = mapRef.current;

    if (!map) {
      return;
    }

    if (nextMode === 'satellite' && mapViewModeRef.current === '3d') {
      mapViewModeRef.current = '2d';
      setMapViewMode('2d');

      map.easeTo({
        pitch: 0,
        bearing: 0,
        duration: 500,
      });
    }

    if (nextMode === 'satellite') {
      map.setStyle(MAP_STYLES.satellite);

      map.once('idle', () => {
        updateCameraCoverageLayers();
      });

      return;
    }

    map.setStyle(getCurrentMapStyle('default'));

    map.once('idle', () => {
      restoreCustomMapLayers();
    });
  };

  const handleCloseCameraDetails = () => {
    selectedCameraIdRef.current = null;
    setSelectedCamera(null);
    updateCameraCoverageLayers();
  };

  const handleFindLookingAt = async () => {
    if (!contextMenu) {
      return;
    }

    const target = {
      lat: contextMenu.lat,
      lng: contextMenu.lng,
    };

    setContextMenu(null);
    setSelectedCamera(null);

    lookingAtAbortControllerRef.current?.abort();

    const abortController = new AbortController();
    lookingAtAbortControllerRef.current = abortController;

    setLookingAtPanel({
      isOpen: true,
      target,
      cameras: [],
      isLoading: true,
      error: null,
    });

    try {
      const cameras = await getCamerasLookingAt(
        {
          lat: target.lat,
          lng: target.lng,
        },
        abortController.signal,
      );

      if (abortController.signal.aborted) {
        return;
      }

      setLookingAtPanel({
        isOpen: true,
        target,
        cameras,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      if (abortController.signal.aborted) {
        return;
      }

      const message =
        error instanceof Error
          ? error.message
          : 'Не удалось найти камеры, которые смотрят в эту точку';

      setLookingAtPanel({
        isOpen: true,
        target,
        cameras: [],
        isLoading: false,
        error: message,
      });
    }
  };

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    let isActive = true;
    let camerasAbortController: AbortController | null = null;

    const pageAbortController = new AbortController();

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: getCurrentMapStyle('default'),
      center: MAP_CONFIG.fallbackCenter,
      zoom: MAP_CONFIG.fallbackZoom,
      pitch: 0,
      bearing: 0,
      maxPitch: 70,
      attributionControl: false,
    });

    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl(), 'bottom-left');

    function clearCameraMarkers() {
      cameraMarkersRef.current.forEach((marker) => marker.remove());
      cameraMarkersRef.current = [];
    }

    function renderCameraMarkers(cameras: Camera[]) {
      clearCameraMarkers();

      const markers = cameras.map((camera) => {
        const element = createCameraMarkerElement(camera);

        const button = element.querySelector<HTMLButtonElement>(
          '.camera-marker__button',
        );

        button?.addEventListener('click', () => {
          selectCamera(camera);
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

    async function loadCamerasByCurrentBbox() {
      camerasAbortController?.abort();

      const currentAbortController = new AbortController();
      camerasAbortController = currentAbortController;

      try {
        setIsCamerasLoading(true);
        setCamerasError(null);

        const bbox = getMapBbox(map);

        const cameras = await getCamerasByBbox(
          {
            minLng: bbox.minLng,
            minLat: bbox.minLat,
            maxLng: bbox.maxLng,
            maxLat: bbox.maxLat,
          },
          currentAbortController.signal,
        );

        if (!isActive || currentAbortController.signal.aborted) {
          return;
        }

        visibleCamerasRef.current = cameras;

        renderCameraMarkers(cameras);
        updateCameraCoverageLayers();
      } catch (error) {
        if (!isActive || currentAbortController.signal.aborted) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : 'Не удалось загрузить камеры';

        setCamerasError(message);
      } finally {
        if (isActive && !currentAbortController.signal.aborted) {
          setIsCamerasLoading(false);
        }
      }
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

    const handleMapContextMenu = (event: maplibregl.MapMouseEvent) => {
      event.originalEvent.preventDefault();

      setContextMenu({
        x: event.point.x,
        y: event.point.y,
        lat: event.lngLat.lat,
        lng: event.lngLat.lng,
      });
    };

    const handleMapClick = () => {
      setContextMenu(null);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setContextMenu(null);
      }
    };

    const handleThemeChange = (event: Event) => {
      const themeEvent = event as CustomEvent<{
        mode: 'light' | 'dark' | 'auto';
        resolvedTheme: 'light' | 'dark';
      }>;

      if (mapBaseModeRef.current === 'satellite') {
        return;
      }

      map.setStyle(MAP_STYLES[themeEvent.detail.resolvedTheme]);

      map.once('idle', () => {
        restoreCustomMapLayers();
      });
    };

    window.addEventListener(MAP_EVENTS.findMe, handleFindMe);
    window.addEventListener('okogid-theme-change', handleThemeChange);
    window.addEventListener('keydown', handleEscape);

    map.on('contextmenu', handleMapContextMenu);
    map.on('click', handleMapClick);

    map.once('load', async () => {
      try {
        const geo = await getMyGeoLocation(pageAbortController.signal);

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

      await loadCamerasByCurrentBbox();
    });

    map.on('moveend', loadCamerasByCurrentBbox);

    return () => {
      isActive = false;

      pageAbortController.abort();
      camerasAbortController?.abort();
      detailsAbortControllerRef.current?.abort();
      lookingAtAbortControllerRef.current?.abort();

      map.off('moveend', loadCamerasByCurrentBbox);
      map.off('contextmenu', handleMapContextMenu);
      map.off('click', handleMapClick);

      window.removeEventListener(MAP_EVENTS.findMe, handleFindMe);
      window.removeEventListener('okogid-theme-change', handleThemeChange);
      window.removeEventListener('keydown', handleEscape);

      userLocationMarkerRef.current?.remove();
      userLocationMarkerRef.current = null;

      clearCameraMarkers();

      map.remove();
      mapRef.current = null;
    };
  }, [selectCamera]);

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

      {contextMenu && (
        <MapContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onFindLookingAt={handleFindLookingAt}
        />
      )}

      <MapBaseModeSwitcher
        value={mapBaseMode}
        viewMode={mapViewMode}
        onChange={handleMapBaseModeChange}
        onViewModeChange={applyMapViewMode}
      />

      <LookingAtCamerasPanel
        isOpen={lookingAtPanel.isOpen}
        target={lookingAtPanel.target}
        cameras={lookingAtPanel.cameras}
        isLoading={lookingAtPanel.isLoading}
        error={lookingAtPanel.error}
        onClose={() => setLookingAtPanel(INITIAL_LOOKING_AT_PANEL_STATE)}
        onCameraClick={selectCamera}
      />

      <CameraDetailsPanel
        camera={selectedCamera}
        isLoading={isCameraDetailsLoading}
        onClose={handleCloseCameraDetails}
      />
    </div>
  );
}