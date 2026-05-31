import {
  isThemeMode,
  resolveThemeMode,
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type ThemeMode,
} from '../model/theme';

export const MAP_STYLES = {
  light: '/map/styles/okogid-light.json',
  dark: '/map/styles/okogid-dark.json',
  satellite: '/map/styles/okogid-satellite.json',
} as const;

export type MapBaseMode = 'default' | 'satellite';

export const DEFAULT_MAP_LOCATION = {
  city: 'Санкт-Петербург',
  center: [30.3159, 59.9391] as [number, number],
  zoom: 11,
};

export const MAP_CONFIG = {
  fallbackCenter: DEFAULT_MAP_LOCATION.center,
  fallbackZoom: DEFAULT_MAP_LOCATION.zoom,
  cityZoom: 11,
};

function getSavedThemeMode(): ThemeMode {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);

  if (isThemeMode(savedTheme)) {
    return savedTheme;
  }

  return 'auto';
}

export function getCurrentMapTheme(): ResolvedTheme {
  return resolveThemeMode(getSavedThemeMode());
}

export function getCurrentMapStyle(baseMode: MapBaseMode = 'default') {
  if (baseMode === 'satellite') {
    return MAP_STYLES.satellite;
  }

  return MAP_STYLES[getCurrentMapTheme()];
}