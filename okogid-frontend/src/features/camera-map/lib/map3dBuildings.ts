import maplibregl from 'maplibre-gl';

export const BUILDINGS_3D_LAYER_ID = 'okogid-3d-buildings';

type VectorLayerWithSource = maplibregl.LayerSpecification & {
  source?: string;
  'source-layer'?: string;
};

function getFirstSymbolLayerId(map: maplibregl.Map) {
  const layers = map.getStyle().layers ?? [];

  return layers.find((layer) => layer.type === 'symbol')?.id;
}

function getBuildingSourceInfo(map: maplibregl.Map) {
  const style = map.getStyle();
  const layers = style.layers ?? [];

  const buildingLayer = layers.find((layer) => {
    const vectorLayer = layer as VectorLayerWithSource;
    const sourceLayer = vectorLayer['source-layer'];

    return Boolean(
      vectorLayer.source &&
        sourceLayer &&
        sourceLayer.toLowerCase().includes('building'),
    );
  }) as VectorLayerWithSource | undefined;

  if (buildingLayer?.source && buildingLayer['source-layer']) {
    return {
      sourceId: buildingLayer.source,
      sourceLayer: buildingLayer['source-layer'],
    };
  }

  const vectorSourceIds = Object.entries(style.sources ?? {})
    .filter(([, source]) => source.type === 'vector')
    .map(([sourceId]) => sourceId);

  const preferredSourceId =
    vectorSourceIds.find((sourceId) =>
      ['openmaptiles', 'osm', 'vector'].some((name) =>
        sourceId.toLowerCase().includes(name),
      ),
    ) ?? vectorSourceIds[0];

  if (!preferredSourceId) {
    return null;
  }

  return {
    sourceId: preferredSourceId,
    sourceLayer: 'building',
  };
}

export function ensureBuildings3dLayer(map: maplibregl.Map) {
  if (map.getLayer(BUILDINGS_3D_LAYER_ID)) {
    return true;
  }

  const sourceInfo = getBuildingSourceInfo(map);

  if (!sourceInfo) {
    return false;
  }

  const beforeLayerId = getFirstSymbolLayerId(map);

  const buildingLayer = {
    id: BUILDINGS_3D_LAYER_ID,
    type: 'fill-extrusion',
    source: sourceInfo.sourceId,
    'source-layer': sourceInfo.sourceLayer,
    minzoom: 14,
    layout: {
      visibility: 'visible',
    },
    paint: {
      'fill-extrusion-color': [
        'interpolate',
        ['linear'],
        ['zoom'],
        14,
        '#FFE27A',
        16,
        '#FFD21E',
      ],
      'fill-extrusion-height': [
        'interpolate',
        ['linear'],
        ['zoom'],
        14,
        0,
        15,
        [
          'coalesce',
          ['to-number', ['get', 'render_height']],
          ['to-number', ['get', 'height']],
          18,
        ],
      ],
      'fill-extrusion-base': [
        'coalesce',
        ['to-number', ['get', 'render_min_height']],
        ['to-number', ['get', 'min_height']],
        0,
      ],
      'fill-extrusion-opacity': 0.32,
      'fill-extrusion-vertical-gradient': true,
    },
  } as maplibregl.LayerSpecification;

  if (beforeLayerId) {
    map.addLayer(buildingLayer, beforeLayerId);
  } else {
    map.addLayer(buildingLayer);
  }

  return true;
}

export function setBuildings3dVisibility(
  map: maplibregl.Map,
  isVisible: boolean,
) {
  if (!map.getLayer(BUILDINGS_3D_LAYER_ID)) {
    return;
  }

  map.setLayoutProperty(
    BUILDINGS_3D_LAYER_ID,
    'visibility',
    isVisible ? 'visible' : 'none',
  );
}