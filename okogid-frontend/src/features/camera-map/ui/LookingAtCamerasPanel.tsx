import { Link } from 'react-router';

import type { Camera } from '../../../entities/camera/model/types';

type LookingAtCamerasPanelProps = {
  isOpen: boolean;
  cameras: Camera[];
  isLoading: boolean;
  error: string | null;
  target: {
    lat: number;
    lng: number;
  } | null;
  onClose: () => void;
  onCameraClick: (camera: Camera) => void;
};

function getStatusLabel(status: Camera['status']) {
  if (status === 'online') return 'Онлайн';
  if (status === 'offline') return 'Офлайн';
  return 'Обслуживание';
}

function getStatusClassName(status: Camera['status']) {
  if (status === 'online') {
    return 'bg-green-500/10 text-green-700 ring-green-500/20';
  }

  if (status === 'offline') {
    return 'bg-red-500/10 text-red-700 ring-red-500/20';
  }

  return 'bg-yellow-500/10 text-yellow-700 ring-yellow-500/20';
}

function formatMeters(value?: number) {
  if (typeof value !== 'number') {
    return '—';
  }

  if (value < 1000) {
    return `${Math.round(value)} м`;
  }

  return `${(value / 1000).toFixed(1)} км`;
}

export function LookingAtCamerasPanel({
  isOpen,
  cameras,
  isLoading,
  error,
  target,
  onClose,
  onCameraClick,
}: LookingAtCamerasPanelProps) {
  return (
    <aside
      className={[
        'absolute right-4 top-12 z-30 w-[calc(100%-32px)] max-w-[420px] md:top-8',
        'max-h-[calc(100vh-32px)] overflow-hidden rounded-[32px]',
        'border border-[var(--color-border)] bg-[var(--panel-bg)] shadow-2xl shadow-[var(--color-shadow)] backdrop-blur-2xl',
        'transition-all duration-300 ease-out',
        isOpen
          ? 'translate-x-0 scale-100 opacity-100'
          : 'pointer-events-none translate-x-8 scale-95 opacity-0',
      ].join(' ')}
    >
      <div className="flex max-h-[calc(100vh-32px)] flex-col">
        <div className="flex items-start justify-between border-b border-[var(--color-border)] px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
              Камеры по направлению
            </p>

            <h2 className="mt-1 text-xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
              Смотрят в эту точку
            </h2>

            {target && (
              <p className="mt-1 font-inter text-xs text-[var(--color-text-secondary)]">
                {target.lat.toFixed(5)}, {target.lng.toFixed(5)}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-solid)] text-xl text-[var(--color-text-secondary)] shadow-sm transition hover:scale-105 hover:text-[var(--color-text-primary)]"
            aria-label="Закрыть список камер"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {isLoading && (
            <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-5 font-inter text-sm font-semibold text-[var(--color-text-secondary)]">
              Ищем камеры, которые смотрят в выбранную точку...
            </div>
          )}

          {error && !isLoading && (
            <div className="rounded-[24px] border border-red-500/20 bg-red-500/10 p-5 font-inter text-sm font-semibold text-red-600">
              {error}
            </div>
          )}

          {!isLoading && !error && cameras.length === 0 && (
            <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-5 text-center">
              <p className="text-lg font-extrabold text-[var(--color-text-primary)]">
                Камеры не найдены
              </p>

              <p className="mt-2 font-inter text-sm leading-6 text-[var(--color-text-secondary)]">
                В эту точку пока не смотрит ни одна камера из текущей базы.
              </p>
            </div>
          )}

          {!isLoading && !error && cameras.length > 0 && (
            <div className="space-y-3">
              {cameras.map((camera) => (
                <article
                  key={camera.id}
                  className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface-solid)] p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => onCameraClick(camera)}
                      className="min-w-0 text-left"
                    >
                      <h3 className="line-clamp-2 text-base font-extrabold text-[var(--color-text-primary)] transition hover:text-[var(--color-primary)]">
                        {camera.title}
                      </h3>

                      <p className="mt-1 line-clamp-2 font-inter text-xs leading-5 text-[var(--color-text-secondary)]">
                        {camera.description}
                      </p>
                    </button>

                    <span
                      className={[
                        'shrink-0 rounded-full px-2.5 py-1 font-inter text-[10px] font-bold ring-1',
                        getStatusClassName(camera.status),
                      ].join(' ')}
                    >
                      {getStatusLabel(camera.status)}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="rounded-2xl bg-[var(--color-bg-soft)] px-3 py-2">
                      <p className="font-inter text-[10px] font-bold uppercase text-[var(--color-text-muted)]">
                        Дистанция
                      </p>
                      <p className="mt-1 text-sm font-extrabold text-[var(--color-text-primary)]">
                        {formatMeters(camera.viewMatch?.distanceMeters)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[var(--color-bg-soft)] px-3 py-2">
                      <p className="font-inter text-[10px] font-bold uppercase text-[var(--color-text-muted)]">
                        Азимут
                      </p>
                      <p className="mt-1 text-sm font-extrabold text-[var(--color-text-primary)]">
                        {camera.viewMatch?.bearingDeg ?? '—'}°
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[var(--color-bg-soft)] px-3 py-2">
                      <p className="font-inter text-[10px] font-bold uppercase text-[var(--color-text-muted)]">
                        Угол
                      </p>
                      <p className="mt-1 text-sm font-extrabold text-[var(--color-text-primary)]">
                        {camera.viewMatch?.angleDiffDeg ?? '—'}°
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => onCameraClick(camera)}
                      className="flex h-10 flex-1 items-center justify-center rounded-[16px] border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-4 text-xs font-bold text-[var(--color-text-primary)] transition hover:text-[var(--color-primary)]"
                    >
                      Открыть карточку
                    </button>

                    <Link
                      to={`/cameras/${camera.id}`}
                      className="flex h-10 flex-1 items-center justify-center rounded-[16px] bg-[var(--color-primary)] px-4 text-xs font-bold text-[var(--color-secondary-text)] transition hover:scale-[1.01]"
                    >
                      Смотреть
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}