import { Link } from 'react-router';

import type { MapBaseMode, MapViewMode } from '../../../shared/config/map';

type MapBaseModeSwitcherProps = {
  value: MapBaseMode;
  viewMode: MapViewMode;
  onChange: (value: MapBaseMode) => void;
  onViewModeChange: (value: MapViewMode) => void;
};

const mapBaseModes: {
  value: MapBaseMode;
  label: string;
}[] = [
  {
    value: 'default',
    label: 'Карта',
  },
  {
    value: 'satellite',
    label: 'Спутник',
  },
];

const mapViewModes: {
  value: MapViewMode;
  label: string;
}[] = [
  {
    value: '2d',
    label: '2D вид',
  },
  {
    value: '3d',
    label: '3D вид',
  },
];

function CameraListIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 8h10a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z" />
      <path d="m17 12 5-3v10l-5-3" />
      <path d="M7 8l1.5-3h4L14 8" />
    </svg>
  );
}

export function MapBaseModeSwitcher({
  value,
  viewMode,
  onChange,
  onViewModeChange,
}: MapBaseModeSwitcherProps) {
  return (
    <div className="absolute bottom-8 right-4 z-20 flex flex-col items-end gap-3">
      <Link
        to="/cameras"
        className="inline-flex h-11 items-center justify-center gap-2 rounded-[20px] border border-[var(--color-border)] bg-[var(--navbar-bg)] px-4 font-inter text-xs font-extrabold text-[var(--color-text-primary)] shadow-xl shadow-[var(--color-shadow)] backdrop-blur-2xl transition hover:scale-[1.02] hover:text-[var(--color-primary)]"
      >
        <CameraListIcon />
        Посмотреть все камеры
      </Link>

      <div className="rounded-[22px] border border-[var(--color-border)] bg-[var(--navbar-bg)] p-1 shadow-xl shadow-[var(--color-shadow)] backdrop-blur-2xl">
        <div className="flex items-center gap-1">
          {mapViewModes.map((mode) => {
            const isActive = viewMode === mode.value;

            return (
              <button
                key={mode.value}
                type="button"
                onClick={() => onViewModeChange(mode.value)}
                className={[
                  'h-10 rounded-[18px] px-4 font-inter text-xs font-bold transition',
                  isActive
                    ? 'bg-[var(--color-primary)] text-[var(--color-secondary-text)]'
                    : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-soft)] hover:text-[var(--color-primary)]',
                ].join(' ')}
              >
                {mode.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-[22px] border border-[var(--color-border)] bg-[var(--navbar-bg)] p-1 shadow-xl shadow-[var(--color-shadow)] backdrop-blur-2xl">
        <div className="flex items-center gap-1">
          {mapBaseModes.map((mode) => {
            const isActive = value === mode.value;

            return (
              <button
                key={mode.value}
                type="button"
                onClick={() => onChange(mode.value)}
                className={[
                  'h-10 rounded-[18px] px-4 font-inter text-xs font-bold transition',
                  isActive
                    ? 'bg-[var(--color-primary)] text-[var(--color-secondary-text)]'
                    : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-soft)] hover:text-[var(--color-primary)]',
                ].join(' ')}
              >
                {mode.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}