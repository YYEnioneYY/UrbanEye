import type { MapBaseMode } from '../../../shared/config/map';

type MapBaseModeSwitcherProps = {
  value: MapBaseMode;
  onChange: (value: MapBaseMode) => void;
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

export function MapBaseModeSwitcher({
  value,
  onChange,
}: MapBaseModeSwitcherProps) {
  return (
    <div className="absolute bottom-8 right-4 z-20 rounded-[22px] border border-[var(--color-border)] bg-[var(--navbar-bg)] p-1 shadow-xl shadow-[var(--color-shadow)] backdrop-blur-2xl">
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
  );
}