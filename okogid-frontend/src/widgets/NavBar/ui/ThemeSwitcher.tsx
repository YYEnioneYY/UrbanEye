import { useEffect, useState } from 'react';

import {
  isThemeMode,
  resolveThemeMode,
  THEME_STORAGE_KEY,
  themeOptions,
  type ThemeMode,
} from '../../../shared/model/theme';

function getInitialThemeMode(): ThemeMode {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);

  if (isThemeMode(savedTheme)) {
    return savedTheme;
  }

  return 'auto';
}

export function ThemeSwitcher() {
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialThemeMode);

  useEffect(() => {
    const applyTheme = () => {
      const resolvedTheme = resolveThemeMode(themeMode);
    
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
    };
  
    applyTheme();
  
    if (themeMode !== 'auto') {
      return;
    }
  
    const intervalId = window.setInterval(applyTheme, 60_000);
  
    return () => {
      window.clearInterval(intervalId);
    };
  }, [themeMode]);

  return (
    <div className="flex rounded-full border border-[var(--color-border)] bg-[var(--color-bg-soft)] py-1 px-3 gap-2">
      {themeOptions.map((option) => {
        const isActive = themeMode === option.value;
        const Icon = option.Icon;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setThemeMode(option.value)}
            title={option.label}
            className={[
              'flex h-9 w-9 items-center justify-center rounded-full transition',
              isActive
                ? 'bg-[var(--color-surface-solid)] text-[var(--color-primary-text)] shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-solid)] hover:text-[var(--color-text-primary)]',
            ].join(' ')}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}