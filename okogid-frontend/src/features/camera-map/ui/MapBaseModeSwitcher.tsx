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

function CubeIcon() {
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
      <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
      <path d="M12 12 4 7.5" />
      <path d="m12 12 8-4.5" />
      <path d="M12 12v9" />
    </svg>
  );
}

function FlatIcon() {
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
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </svg>
  );
}

export function MapBaseModeSwitcher({
  value,
  viewMode,
  onChange,
  onViewModeChange,
}: MapBaseModeSwitcherProps) {
  const nextViewMode: MapViewMode = viewMode === '2d' ? '3d' : '2d';
  const nextViewModeLabel = viewMode === '2d' ? '3D' : '2D';
  const nextViewModeTitle =
    viewMode === '2d' ? 'Переключить в 3D вид' : 'Переключить в 2D вид';

  return (
    <div className="absolute bottom-8 right-4 z-20 flex flex-col items-end gap-3">
      <Link
        to="/cameras"
        className="inline-flex h-11 items-center justify-center gap-2 rounded-[20px] border border-[var(--color-border)] bg-[var(--navbar-bg)] px-4 font-inter text-xs font-extrabold text-[var(--color-text-primary)] shadow-xl shadow-[var(--color-shadow)] backdrop-blur-2xl transition hover:scale-[1.02] hover:text-[var(--color-primary)]"
      >
        <CameraListIcon />
        Посмотреть все камеры
      </Link>

      <button
        type="button"
        onClick={() => onViewModeChange(nextViewMode)}
        title={nextViewModeTitle}
        aria-label={nextViewModeTitle}
        className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-[var(--color-border)] bg-[var(--navbar-bg)] text-[var(--color-text-primary)] shadow-xl shadow-[var(--color-shadow)] backdrop-blur-2xl transition hover:scale-105 hover:bg-[var(--color-primary)] hover:text-[var(--color-secondary-text)]"
      >
        <span className="flex flex-col items-center justify-center leading-none">
          {viewMode === '2d' ? <CubeIcon /> : <FlatIcon />}

          <span className="mt-0.5 font-inter text-[10px] font-black">
            {nextViewModeLabel}
          </span>
        </span>
      </button>

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