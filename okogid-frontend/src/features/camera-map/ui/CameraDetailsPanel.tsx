import type { Camera } from '../../../entities/camera/model/types';
import { Link } from 'react-router';

type CameraDetailsPanelProps = {
  camera: Camera | null;
  onClose: () => void;
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

export function CameraDetailsPanel({
  camera,
  onClose,
}: CameraDetailsPanelProps) {
  const isOpen = Boolean(camera);

  return (
    <aside
      className={[
        'absolute right-4 top-12 z-30 w-[calc(100%-32px)] max-w-[390px] md:top-8',
        'max-h-[calc(100vh-32px)] overflow-hidden rounded-[32px]',
        'border border-[var(--color-border)] bg-[var(--panel-bg)] shadow-2xl shadow-[var(--color-shadow)] backdrop-blur-2xl',
        'transition-all duration-300 ease-out',
        isOpen
          ? 'translate-x-0 scale-100 opacity-100'
          : 'pointer-events-none translate-x-8 scale-95 opacity-0',
      ].join(' ')}
    >
      {camera && (
        <div className="flex max-h-[calc(100vh-32px)] flex-col">
          <div className="flex items-start justify-between border-b border-[var(--color-border)] px-5 py-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                Камера
              </p>

              <h2 className="mt-1 line-clamp-2 text-xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
                {camera.title}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-solid)] text-xl text-[var(--color-text-secondary)] shadow-sm transition hover:scale-105 hover:text-[var(--color-text-primary)]"
              aria-label="Закрыть карточку камеры"
            >
              ×
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5">
            <div className="overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-[var(--color-bg-soft)]">
              {camera.previewUrl ? (
                <img
                  src={camera.previewUrl}
                  alt={camera.title}
                  className="h-44 w-full object-cover"
                />
              ) : (
                <div className="flex h-44 w-full items-center justify-center bg-gradient-to-br from-[var(--color-bg-soft)] to-[var(--color-bg)]">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--button-primary-bg)] shadow-lg">
                    <div className="h-7 w-7 rounded-full bg-[var(--color-primary-text)] shadow-inner" />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span
                className={[
                  'inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1',
                  getStatusClassName(camera.status),
                ].join(' ')}
              >
                {getStatusLabel(camera.status)}
              </span>

              <span className="rounded-full bg-[var(--color-bg-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-text-secondary)]">
                {camera.latitude.toFixed(4)}, {camera.longitude.toFixed(4)}
              </span>
            </div>

            <div className="mt-5">
              <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                Описание
              </h3>

              <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                {camera.description ||
                  'Описание камеры пока не добавлено. Позже здесь будет информация о месте, ракурсе камеры и доступных онлайн-экскурсиях.'}
              </p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-solid)] p-3 shadow-sm">
                <p className="text-[11px] font-semibold uppercase text-[var(--color-text-muted)]">
                  Тип
                </p>
                <p className="mt-1 text-sm font-bold text-[var(--color-text-primary)]">
                  IP-камера
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-solid)] p-3 shadow-sm">
                <p className="text-[11px] font-semibold uppercase text-[var(--color-text-muted)]">
                  Поток
                </p>
                <p className="mt-1 text-sm font-bold text-[var(--color-text-primary)]">
                  {camera.streamUrl ? 'Доступен' : 'Скоро'}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-[var(--color-border)] bg-[var(--panel-bg)] px-5 py-4">
            {camera.status === 'online' ? (
              <Link
                to={`/cameras/${camera.id}`}
                className="flex w-full items-center justify-center rounded-2xl bg-[var(--color-primary)] px-5 py-3.5 text-sm font-extrabold text-[var(--color-secondary-text)] shadow-sm transition hover:scale-[1.01]"
              >
                Смотреть камеру
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="w-full rounded-2xl bg-gray-200 px-5 py-3.5 text-sm font-extrabold text-gray-400 disabled:cursor-not-allowed"
              >
                Камера недоступна
              </button>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}