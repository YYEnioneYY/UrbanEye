import { themeOptions } from '../../../shared/model/theme';
import { useTheme } from '../../../app/providers/ThemeProvider';

export function ThemeSwitcher() {
  const { themeMode, setThemeMode } = useTheme();

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