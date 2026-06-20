import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';

import type { Camera } from '../../../entities/camera/model/types';
import type { Intersection } from '../../../entities/intersection/model/types';
import {
  deleteAdminIntersection,
  getAdminIntersectionCameras,
  getAdminIntersections,
} from '../../../entities/intersection/api/adminIntersectionsApi';

function isAbortError(error: unknown) {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return true;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    return (
      error.name === 'AbortError' ||
      message.includes('aborted') ||
      message.includes('abort')
    );
  }

  return false;
}

function getIntersectionStatusLabel(status: string) {
  if (status === 'active') return 'Активный';
  if (status === 'inactive') return 'Неактивный';
  if (status === 'planned') return 'Запланирован';

  return status;
}

function getIntersectionStatusClassName(status: string) {
  if (status === 'active') {
    return 'bg-green-500/10 text-green-600 ring-green-500/20';
  }

  if (status === 'inactive') {
    return 'bg-red-500/10 text-red-600 ring-red-500/20';
  }

  if (status === 'planned') {
    return 'bg-blue-500/10 text-blue-600 ring-blue-500/20';
  }

  return 'bg-zinc-500/10 text-zinc-500 ring-zinc-500/20';
}

function getCameraStatusLabel(status: Camera['status']) {
  if (status === 'online') return 'Онлайн';
  if (status === 'offline') return 'Офлайн';
  if (status === 'maintenance') return 'Обслуживание';
  if (status === 'planned') return 'Запланирована';

  return status;
}

function getCameraStatusClassName(status: Camera['status']) {
  if (status === 'online') {
    return 'bg-green-500/10 text-green-600 ring-green-500/20';
  }

  if (status === 'offline') {
    return 'bg-red-500/10 text-red-600 ring-red-500/20';
  }

  if (status === 'maintenance') {
    return 'bg-yellow-500/10 text-yellow-600 ring-yellow-500/20';
  }

  return 'bg-blue-500/10 text-blue-600 ring-blue-500/20';
}

function formatDate(value?: string) {
  if (!value) {
    return '—';
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatCoordinates(intersection: Intersection) {
  return `${intersection.latitude.toFixed(5)}, ${intersection.longitude.toFixed(5)}`;
}

function getOnlinePercent(intersection: Intersection) {
  if (intersection.camerasCount <= 0) {
    return 0;
  }

  return Math.round(
    (intersection.onlineCamerasCount / intersection.camerasCount) * 100,
  );
}

export function AdminIntersectionsPage() {
  const [intersections, setIntersections] = useState<Intersection[]>([]);
  const [selectedIntersection, setSelectedIntersection] =
    useState<Intersection | null>(null);

  const [intersectionCameras, setIntersectionCameras] = useState<Camera[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isCamerasLoading, setIsCamerasLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [camerasError, setCamerasError] = useState<string | null>(null);

  const [deletingIntersectionId, setDeletingIntersectionId] = useState<
    string | null
  >(null);
  
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const totalCameras = useMemo(() => {
    return intersections.reduce(
      (sum, intersection) => sum + intersection.camerasCount,
      0,
    );
  }, [intersections]);

  const totalOnlineCameras = useMemo(() => {
    return intersections.reduce(
      (sum, intersection) => sum + intersection.onlineCamerasCount,
      0,
    );
  }, [intersections]);

  const loadIntersections = async (signal?: AbortSignal) => {
    try {
      setIsLoading(true);
      setError(null);
  
      const data = await getAdminIntersections(signal);
  
      if (signal?.aborted) {
        return;
      }
  
      setIntersections(data);
    } catch (error) {
      if (signal?.aborted || isAbortError(error)) {
        return;
      }
  
      const message =
        error instanceof Error
          ? error.message
          : 'Не удалось загрузить перекрёстки';
  
      setError(message);
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  };

  const loadIntersectionCameras = async (intersection: Intersection) => {
    const abortController = new AbortController();
  
    setSelectedIntersection(intersection);
    setIntersectionCameras([]);
    setCamerasError(null);
  
    try {
      setIsCamerasLoading(true);
  
      const cameras = await getAdminIntersectionCameras(
        intersection.id,
        abortController.signal,
      );
  
      if (abortController.signal.aborted) {
        return;
      }
  
      setIntersectionCameras(cameras);
    } catch (error) {
      if (abortController.signal.aborted || isAbortError(error)) {
        return;
      }
  
      const message =
        error instanceof Error
          ? error.message
          : 'Не удалось загрузить камеры перекрёстка';
  
      setCamerasError(message);
    } finally {
      if (!abortController.signal.aborted) {
        setIsCamerasLoading(false);
      }
    }
  };

  const handleDeleteIntersection = async (intersection: Intersection) => {
    const isConfirmed = window.confirm(
      `Удалить перекрёсток "${intersection.title}"?\n\nЭто действие нельзя будет отменить.`,
    );
  
    if (!isConfirmed) {
      return;
    }
  
    const abortController = new AbortController();
  
    try {
      setDeletingIntersectionId(intersection.id);
      setActionError(null);
      setActionSuccess(null);
  
      const result = await deleteAdminIntersection(
        intersection.id,
        abortController.signal,
      );
  
      if (!result.deleted) {
        throw new Error('Сервер не подтвердил удаление перекрёстка');
      }
  
      setIntersections((prev) =>
        prev.filter((item) => item.id !== intersection.id),
      );
  
      if (selectedIntersection?.id === intersection.id) {
        setSelectedIntersection(null);
        setIntersectionCameras([]);
        setCamerasError(null);
      }
  
      setActionSuccess(`Перекрёсток "${intersection.title}" удалён`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Не удалось удалить перекрёсток';
  
      setActionError(message);
    } finally {
      setDeletingIntersectionId(null);
    }
  };

  useEffect(() => {
    const abortController = new AbortController();

    void loadIntersections(abortController.signal);

    return () => {
      abortController.abort();
    };
  }, []);

  return (
    <section className="min-h-full">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-inter text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
            Admin / Intersections
          </p>

          <h1 className="mt-2 text-4xl font-black text-[var(--color-text-primary)]">
            Перекрёстки
          </h1>

          <p className="mt-2 max-w-2xl font-inter text-sm leading-6 text-[var(--color-text-secondary)]">
            Управление и просмотр перекрёстков, связанных камер и их текущего
            состояния.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadIntersections()}
          disabled={isLoading}
          className="h-11 rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 font-inter text-sm font-bold text-[var(--color-text-primary)] transition hover:text-[var(--color-primary)] disabled:cursor-wait disabled:opacity-60"
        >
          {isLoading ? 'Обновляем...' : 'Обновить'}
        </button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <StatCard label="Перекрёстков" value={intersections.length} />
        <StatCard label="Всего камер" value={totalCameras} />
        <StatCard
          label="Онлайн камер"
          value={totalOnlineCameras}
          accent={totalOnlineCameras > 0}
        />
      </div>

      {error && (
        <div className="mb-5 rounded-[24px] border border-red-500/20 bg-red-500/10 px-5 py-4 font-inter text-sm font-semibold text-red-600">
          {error}
        </div>
      )}

      {actionSuccess && (
        <div className="mb-5 rounded-[24px] border border-green-500/20 bg-green-500/10 px-5 py-4 font-inter text-sm font-semibold text-green-600">
            {actionSuccess}
          </div>
        )}

        {actionError && (
          <div className="mb-5 rounded-[24px] border border-red-500/20 bg-red-500/10 px-5 py-4 font-inter text-sm font-semibold text-red-600">
            {actionError}
          </div>
        )}
  
      <div className="overflow-hidden rounded-[32px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl shadow-[var(--color-shadow)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1250px] border-collapse">
            <thead className="bg-[var(--color-bg-soft)]">
              <tr className="text-left">
                <th className="px-5 py-4 font-inter text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                  Перекрёсток
                </th>

                <th className="px-5 py-4 font-inter text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                  Статус
                </th>

                <th className="px-5 py-4 font-inter text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                  Камеры
                </th>

                <th className="px-5 py-4 font-inter text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                  Локация
                </th>

                <th className="px-5 py-4 font-inter text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                  Координаты
                </th>

                <th className="px-5 py-4 font-inter text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                  Обновлено
                </th>

                <th className="px-5 py-4 font-inter text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                  Действия
                </th>
              </tr>
            </thead>

            <tbody>
              {isLoading && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center font-inter text-sm font-semibold text-[var(--color-text-secondary)]"
                  >
                    Загружаем перекрёстки...
                  </td>
                </tr>
              )}

              {!isLoading && intersections.length === 0 && !error && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center font-inter text-sm font-semibold text-[var(--color-text-secondary)]"
                  >
                    Перекрёстки пока не добавлены
                  </td>
                </tr>
              )}

              {!isLoading &&
                intersections.map((intersection) => {
                  const onlinePercent = getOnlinePercent(intersection);

                  return (
                    <tr
                      key={intersection.id}
                      className="border-t border-[var(--color-border)] transition hover:bg-[var(--color-bg-soft)]"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-[var(--color-primary)] text-[var(--color-secondary-text)] shadow-lg shadow-[var(--color-shadow)]">
                            <IntersectionIcon />
                          </div>

                          <div className="min-w-0">
                            <p className="line-clamp-1 text-base font-extrabold text-[var(--color-text-primary)]">
                              {intersection.title}
                            </p>

                            <p className="mt-1 line-clamp-1 font-inter text-xs text-[var(--color-text-secondary)]">
                              {intersection.description}
                            </p>

                            <p className="mt-1 font-inter text-[11px] font-bold text-[var(--color-text-muted)]">
                              slug: {intersection.slug}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={[
                            'inline-flex rounded-full px-3 py-1 font-inter text-xs font-bold ring-1',
                            getIntersectionStatusClassName(intersection.status),
                          ].join(' ')}
                        >
                          {getIntersectionStatusLabel(intersection.status)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="space-y-2">
                          <div className="flex items-end gap-2">
                            <span className="text-xl font-black text-[var(--color-text-primary)]">
                              {intersection.onlineCamerasCount}
                            </span>

                            <span className="pb-0.5 font-inter text-xs font-bold text-[var(--color-text-muted)]">
                              из {intersection.camerasCount} онлайн
                            </span>
                          </div>

                          <div className="h-2 w-36 overflow-hidden rounded-full bg-[var(--color-bg-soft)]">
                            <div
                              className="h-full rounded-full bg-[var(--color-primary)]"
                              style={{
                                width: `${onlinePercent}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="max-w-[260px]">
                          <p className="font-inter text-sm font-extrabold text-[var(--color-text-primary)]">
                            {intersection.city}
                          </p>

                          <p className="mt-1 line-clamp-2 font-inter text-xs leading-5 text-[var(--color-text-secondary)]">
                            {intersection.address}
                          </p>

                          <p className="mt-1 font-inter text-[11px] font-bold text-[var(--color-text-muted)]">
                            {intersection.category}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-inter text-xs font-bold text-[var(--color-text-secondary)]">
                          {formatCoordinates(intersection)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-inter text-xs font-semibold text-[var(--color-text-secondary)]">
                          {formatDate(intersection.updatedAt)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              void loadIntersectionCameras(intersection)
                            }
                            className="h-10 rounded-[16px] bg-[var(--button-third-bg)] px-4 font-inter text-xs font-extrabold text-[var(--button-third-text)] transition hover:scale-[1.02] hover:bg-[var(--button-third-hover)]"
                          >
                            Камеры
                          </button>

                          <Link
                            to={`/intersections/${intersection.id}`}
                            className="flex h-10 items-center justify-center rounded-[16px] border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-4 font-inter text-xs font-bold text-[var(--color-text-primary)] transition hover:text-[var(--color-primary)]"
                          >
                            Открыть
                          </Link>

                          <button
                            type="button"
                            onClick={() => void handleDeleteIntersection(intersection)}
                            disabled={deletingIntersectionId === intersection.id}
                            className="h-10 rounded-[16px] border border-red-500/20 bg-red-500/10 px-4 font-inter text-xs font-extrabold text-red-600 transition hover:bg-red-500 hover:text-white disabled:cursor-wait disabled:opacity-60"
                          >
                            {deletingIntersectionId === intersection.id ? 'Удаляем...' : 'Удалить'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      <IntersectionCamerasPanel
        intersection={selectedIntersection}
        cameras={intersectionCameras}
        isLoading={isCamerasLoading}
        error={camerasError}
        onClose={() => {
          setSelectedIntersection(null);
          setIntersectionCameras([]);
          setCamerasError(null);
        }}
      />
    </section>
  );
}

function IntersectionCamerasPanel({
  intersection,
  cameras,
  isLoading,
  error,
  onClose,
}: {
  intersection: Intersection | null;
  cameras: Camera[];
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
}) {
  if (!intersection) {
    return null;
  }

  return (
    <aside className="fixed bottom-0 right-0 top-0 z-[1000] flex w-full max-w-[520px] flex-col border-l border-[var(--color-border)] bg-[var(--navbar-bg)] shadow-2xl shadow-black/30 backdrop-blur-2xl">
      <div className="shrink-0 border-b border-[var(--color-border)] p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-inter text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              Камеры перекрёстка
            </p>

            <h2 className="mt-2 line-clamp-2 text-2xl font-black text-[var(--color-text-primary)]">
              {intersection.title}
            </h2>

            <p className="mt-2 line-clamp-2 font-inter text-sm leading-6 text-[var(--color-text-secondary)]">
              {intersection.address}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-xl font-bold text-[var(--color-text-secondary)] transition hover:text-red-500"
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <MiniStat label="Всего" value={intersection.camerasCount} />
          <MiniStat
            label="Онлайн"
            value={intersection.onlineCamerasCount}
            accent={intersection.onlineCamerasCount > 0}
          />
          <MiniStat label="В списке" value={cameras.length} />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {isLoading && (
          <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-5 font-inter text-sm font-semibold text-[var(--color-text-secondary)]">
            Загружаем камеры...
          </div>
        )}

        {error && !isLoading && (
          <div className="rounded-[24px] border border-red-500/20 bg-red-500/10 p-5 font-inter text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

        {!isLoading && !error && cameras.length === 0 && (
          <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-5 text-center">
            <p className="text-lg font-black text-[var(--color-text-primary)]">
              Камер нет
            </p>

            <p className="mt-2 font-inter text-sm leading-6 text-[var(--color-text-secondary)]">
              К этому перекрёстку пока не привязана ни одна камера.
            </p>
          </div>
        )}

        {!isLoading && !error && cameras.length > 0 && (
          <div className="space-y-4">
            {cameras.map((camera) => (
              <CameraCard key={camera.id} camera={camera} />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

function CameraCard({ camera }: { camera: Camera }) {
  return (
    <article className="overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
      <div className="relative h-36 bg-[#0F1318]">
        {camera.previewUrl ? (
          <img
            src={camera.previewUrl}
            alt={camera.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-white/70">
            <CameraIcon />
          </div>
        )}

        <div className="absolute left-3 top-3">
          <span
            className={[
              'rounded-full px-3 py-1 font-inter text-xs font-bold ring-1 backdrop-blur-xl',
              getCameraStatusClassName(camera.status),
            ].join(' ')}
          >
            {getCameraStatusLabel(camera.status)}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="line-clamp-2 text-lg font-black leading-tight text-[var(--color-text-primary)]">
          {camera.title}
        </h3>

        <p className="mt-2 line-clamp-2 font-inter text-sm leading-6 text-[var(--color-text-secondary)]">
          {camera.description}
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <SmallStat
            label="Напр."
            value={
              typeof camera.coverage?.directionDeg === 'number'
                ? `${camera.coverage.directionDeg}°`
                : '—'
            }
          />

          <SmallStat
            label="Угол"
            value={
              typeof camera.coverage?.fovDeg === 'number'
                ? `${camera.coverage.fovDeg}°`
                : '—'
            }
          />

          <SmallStat
            label="Дальн."
            value={
              typeof camera.coverage?.rangeMeters === 'number'
                ? `${camera.coverage.rangeMeters} м`
                : '—'
            }
          />
        </div>

        <div className="mt-4 flex gap-2">
          <Link
            to={`/cameras/${camera.id}`}
            className="flex h-10 flex-1 items-center justify-center rounded-[16px] bg-[var(--color-primary)] px-4 font-inter text-xs font-extrabold text-[var(--color-secondary-text)] transition hover:scale-[1.01]"
          >
            Открыть камеру
          </Link>
        </div>
      </div>
    </article>
  );
}

function StatCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-xl shadow-[var(--color-shadow)]">
      <p className="font-inter text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
        {label}
      </p>

      <p
        className={[
          'mt-2 text-3xl font-black',
          accent ? 'text-green-600' : 'text-[var(--color-text-primary)]',
        ].join(' ')}
      >
        {value}
      </p>
    </div>
  );
}

function MiniStat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-[20px] bg-[var(--color-bg-soft)] p-4">
      <p className="font-inter text-[10px] font-bold uppercase text-[var(--color-text-muted)]">
        {label}
      </p>

      <p
        className={[
          'mt-1 text-xl font-black',
          accent ? 'text-green-600' : 'text-[var(--color-text-primary)]',
        ].join(' ')}
      >
        {value}
      </p>
    </div>
  );
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] bg-[var(--color-bg-soft)] px-3 py-2">
      <p className="font-inter text-[10px] font-bold uppercase text-[var(--color-text-muted)]">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-extrabold text-[var(--color-text-primary)]">
        {value}
      </p>
    </div>
  );
}

function IntersectionIcon() {
  return (
    <svg
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3v18" />
      <path d="M3 12h18" />
      <path d="m8 7 4-4 4 4" />
      <path d="m17 8 4 4-4 4" />
      <path d="m16 17-4 4-4-4" />
      <path d="m7 16-4-4 4-4" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg
      className="h-9 w-9"
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