import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  type ReactNode,
} from 'react';

import {
  isThemeMode,
  resolveThemeMode,
  THEME_STORAGE_KEY,
  type ThemeMode,
} from '../../shared/model/theme';

type ThemeContextValue = {
  themeMode: ThemeMode;
  setThemeMode: (themeMode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getInitialThemeMode(): ThemeMode {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);

  if (isThemeMode(savedTheme)) {
    return savedTheme;
  }

  return 'auto';
}

function disableThemeTransitionsTemporarily() {
  const root = document.documentElement;

  root.classList.add('theme-changing');

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      root.classList.remove('theme-changing');
    });
  });
}

function applyTheme(themeMode: ThemeMode) {
  const resolvedTheme = resolveThemeMode(themeMode);

  disableThemeTransitionsTemporarily();

  localStorage.setItem(THEME_STORAGE_KEY, themeMode);

  document.documentElement.classList.toggle(
    'dark',
    resolvedTheme === 'dark',
  );

  document.documentElement.dataset.theme = resolvedTheme;

  window.dispatchEvent(
    new CustomEvent('okogid-theme-change', {
      detail: {
        mode: themeMode,
        resolvedTheme,
      },
    }),
  );
}

type ThemeProviderProps = {
  children: ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialThemeMode);

  useLayoutEffect(() => {
    applyTheme(themeMode);
  }, [themeMode]);

  useEffect(() => {
    if (themeMode !== 'auto') {
      return;
    }

    const intervalId = window.setInterval(() => {
      applyTheme(themeMode);
    }, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [themeMode]);

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }

  return context;
}