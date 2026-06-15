import { useEffect, useMemo, useState } from 'react';

import {
  deleteAdminCamera,
  getAdminCameras,
} from '../../../entities/camera/api/adminCamerasApi';
import { AdminCameraEditModal } from './AdminCameraEditModal';

import type {
  AdminCamera,
  AdminCamerasMeta,
} from '../../../entities/camera/model/adminCameraTypes';

const DEFAULT_META: AdminCamerasMeta = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function getStatusLabel(status: AdminCamera['status']) {
  if (status === 'online') return 'Онлайн';
  if (status === 'offline') return 'Офлайн';
  return 'Обслуживание';
}

function getStatusClassName(status: AdminCamera['status']) {
  if (status === 'online') {
    return 'bg-green-500/10 text-green-600 ring-green-500/20';
  }

  if (status === 'offline') {
    return 'bg-red-500/10 text-red-600 ring-red-500/20';
  }

  return 'bg-yellow-500/10 text-yellow-600 ring-yellow-500/20';
}

function getCategoryLabel(category: string) {
  const categories: Record<string, string> = {
    landmark: 'Достопримечательность',
    history: 'История',
    modern: 'Современное место',
  };

  return categories[category] ?? category;
}

function formatMeters(value?: number) {
  if (typeof value !== 'number') return '—';

  if (value < 1000) {
    return `${Math.round(value)} м`;
  }

  return `${(value / 1000).toFixed(1)} км`;
}

function formatOptionalDate(value?: string | null) {
  if (!value) return '—';

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function SearchIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg
      className="h-7 w-7"
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

function EmptyState() {
  return (
    <div className="rounded-[30px] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center shadow-xl shadow-[var(--color-shadow)] backdrop-blur-2xl">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-[var(--color-primary-text)]">
        <CameraIcon />
      </div>

      <h2 className="mt-5 text-2xl font-extrabold text-[var(--color-text-primary)]">
        Камеры не найдены
      </h2>

      <p className="mx-auto mt-3 max-w-md font-inter text-sm leading-6 text-[var(--color-text-secondary)]">
        Попробуйте изменить поисковый запрос или включить отображение удалённых
        камер.
      </p>
    </div>
  );
}

export function AdminCamerasPage() {
  const [cameras, setCameras] = useState<AdminCamera[]>([]);
  const [meta, setMeta] = useState<AdminCamerasMeta>(DEFAULT_META);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [includeDeleted, setIncludeDeleted] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCameraForEdit, setSelectedCameraForEdit] =
  useState<AdminCamera | null>(null);

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [deletingCameraId, setDeletingCameraId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const camerasCountLabel = useMemo(() => {
    if (meta.total === 0) return 'Нет камер';

    return `${meta.total} камер`;
  }, [meta.total]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 450);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [search]);

  useEffect(() => {
    const abortController = new AbortController();

    async function loadCameras() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await getAdminCameras(
          {
            page,
            limit,
            search: debouncedSearch,
            includeDeleted,
          },
          abortController.signal,
        );

        setCameras(response.data);
        setMeta(response.meta);
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : 'Не удалось загрузить камеры';

        setError(message);
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadCameras();

    return () => {
      abortController.abort();
    };
  }, [page, limit, debouncedSearch, includeDeleted, reloadKey]);

  const handleLimitChange = (nextLimit: number) => {
    setLimit(nextLimit);
    setPage(1);
  };

  const handleIncludeDeletedChange = (checked: boolean) => {
    setIncludeDeleted(checked);
    setPage(1);
  };

  const handleDeleteCamera = async (camera: AdminCamera) => {
    const isConfirmed = window.confirm(
      `Удалить камеру "${camera.title}"? Это действие пометит камеру как удалённую.`,
    );

    if (!isConfirmed) {
      return;
    }

    const abortController = new AbortController();

    try {
      setActionError(null);
      setActionSuccess(null);
      setDeletingCameraId(camera.id);

      const response = await deleteAdminCamera(camera.id, abortController.signal);

      setActionSuccess(
        `Камера удалена. deletedAt: ${new Date(
          response.deletedAt,
        ).toLocaleString('ru-RU')}`,
      );

      setReloadKey((prev) => prev + 1);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Не удалось удалить камеру';

      setActionError(message);
    } finally {
      setDeletingCameraId(null);
    }
  };

  return (
    <section>
      <div className="mb-8">

        <div className="mt-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl">
              Камеры
            </h1>

            <p className="mt-4 max-w-2xl font-inter text-base leading-7 text-[var(--color-text-secondary)]">
              Список всех камер проекта: координаты, зона видимости, RTSP
              подключение, просмотры и статус.
            </p>
          </div>

          <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 shadow-xl shadow-[var(--color-shadow)] backdrop-blur-2xl">
            <p className="font-inter text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
              Всего
            </p>

            <p className="mt-1 text-2xl font-extrabold text-[var(--color-primary)]">
              {camerasCountLabel}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-5 rounded-[32px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-xl shadow-[var(--color-shadow)] backdrop-blur-2xl">
        <div className="grid gap-3 xl:grid-cols-[1fr_auto_auto] xl:items-center">
          <label className="flex h-12 items-center gap-3 rounded-[18px] border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-4 text-[var(--color-text-secondary)] transition focus-within:border-[var(--color-primary)]">
            <SearchIcon />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Поиск по названию, городу или адресу..."
              className="w-full border-none bg-transparent font-inter text-sm font-semibold text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-secondary)]"
            />
          </label>

          <label className="flex h-12 cursor-pointer items-center justify-between gap-3 rounded-[18px] border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-4 font-inter text-sm font-semibold text-[var(--color-text-primary)]">
            <span>Показывать удалённые</span>

            <input
              type="checkbox"
              checked={includeDeleted}
              onChange={(event) =>
                handleIncludeDeletedChange(event.target.checked)
              }
              className="h-4 w-4 accent-[var(--color-primary)]"
            />
          </label>

          <select
            value={limit}
            onChange={(event) => handleLimitChange(Number(event.target.value))}
            className="h-12 rounded-[18px] border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-4 font-inter text-sm font-semibold text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-primary)]"
          >
            <option value={10}>10 на странице</option>
            <option value={20}>20 на странице</option>
            <option value={50}>50 на странице</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-[24px] border border-red-500/20 bg-red-500/10 px-5 py-4 font-inter text-sm font-semibold text-red-600">
          {error}
        </div>
      )}

      {actionError && (
        <div className="mb-5 rounded-[24px] border border-red-500/20 bg-red-500/10 px-5 py-4 font-inter text-sm font-semibold text-red-600">
          {actionError}
        </div>
      )}

      {actionSuccess && (
        <div className="mb-5 rounded-[24px] border border-green-500/20 bg-green-500/10 px-5 py-4 font-inter text-sm font-semibold text-green-600">
          {actionSuccess}
        </div>
      )}

      <div className="overflow-hidden rounded-[32px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl shadow-[var(--color-shadow)] backdrop-blur-2xl">
        <div className="border-b border-[var(--color-border)] px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-[var(--color-text-primary)]">
                Список камер
              </h2>

              <p className="mt-1 font-inter text-sm text-[var(--color-text-secondary)]">
                Страница {meta.page} из {meta.totalPages || 1}
              </p>
            </div>

            {isLoading && (
              <span className="rounded-full bg-[var(--color-bg-soft)] px-3 py-1 font-inter text-xs font-bold text-[var(--color-text-secondary)]">
                Загрузка...
              </span>
            )}
          </div>
        </div>

        {cameras.length === 0 && !isLoading ? (
          <div className="p-5">
            <EmptyState />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1650px] border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-soft)] text-left">
                  <th className="px-5 py-4 font-inter text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                    Камера
                  </th>

                  <th className="px-5 py-4 font-inter text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                    Статус
                  </th>

                  <th className="px-5 py-4 font-inter text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                    Health
                  </th>

                  <th className="px-5 py-4 font-inter text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                    Локация
                  </th>

                  <th className="px-5 py-4 font-inter text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                    Обзор
                  </th>

                  <th className="px-5 py-4 font-inter text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                    RTSP
                  </th>

                  <th className="px-5 py-4 font-inter text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                    Просмотры
                  </th>

                  <th className="px-5 py-4 font-inter text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                    Обновлено
                  </th>

                  <th className="px-5 py-4 font-inter text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                    Состояние
                  </th>

                  <th className="px-5 py-4 font-inter text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                    Действия
                  </th>
                </tr>
              </thead>

              <tbody>
                {cameras.map((camera) => {
                  const isDeleted = Boolean(camera.deletedAt);

                  return (
                    <tr
                      key={camera.id}
                      className="border-b border-[var(--color-border)] transition last:border-b-0 hover:bg-[var(--color-bg-soft)]"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-16 shrink-0 overflow-hidden rounded-[16px] border border-[var(--color-border)] bg-[var(--color-bg-soft)]">
                            {camera.previewUrl ? (
                              <img
                                src={camera.previewUrl}
                                alt={camera.title}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-[var(--color-primary)] text-[var(--color-secondary-text)]">
                                <CameraIcon />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="max-w-[260px] truncate font-inter text-sm font-bold text-[var(--color-text-primary)]">
                              {camera.title}
                            </p>

                            <p className="mt-1 max-w-[260px] truncate font-inter text-xs text-[var(--color-text-secondary)]">
                              {camera.slug}
                            </p>

                            <p className="mt-1 max-w-[300px] truncate font-inter text-xs text-[var(--color-text-muted)]">
                              {camera.description}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={[
                            'inline-flex rounded-full px-3 py-1 font-inter text-xs font-bold ring-1',
                            getStatusClassName(camera.status),
                          ].join(' ')}
                        >
                          {getStatusLabel(camera.status)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {camera.health ? (
                          <div className="max-w-[260px] space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              
                              {camera.health.transcodingRequired && (
                                <span className="inline-flex rounded-full bg-yellow-500/10 px-3 py-1 font-inter text-xs font-bold text-yellow-600 ring-1 ring-yellow-500/20">
                                  Transcoding
                                </span>
                              )}
                            </div>
                            
                            <div className="space-y-1 font-inter text-xs text-[var(--color-text-secondary)]">
                              <p>
                                Video:{' '}
                                <span className="font-bold text-[var(--color-text-primary)]">
                                  {camera.health.videoCodec ?? '—'}
                                </span>
                              </p>
                            
                              <p>
                                Audio:{' '}
                                <span className="font-bold text-[var(--color-text-primary)]">
                                  {camera.health.audioCodec ?? '—'}
                                </span>
                              </p>
                            
                              <p>
                                Checked:{' '}
                                <span className="font-bold text-[var(--color-text-primary)]">
                                  {formatOptionalDate(camera.health.lastCheckedAt)}
                                </span>
                              </p>
                            
                              <p>
                                Online:{' '}
                                <span className="font-bold text-[var(--color-text-primary)]">
                                  {formatOptionalDate(camera.health.lastOnlineAt)}
                                </span>
                              </p>
                            
                              <p>
                                Offline:{' '}
                                <span className="font-bold text-[var(--color-text-primary)]">
                                  {formatOptionalDate(camera.health.lastOfflineAt)}
                                </span>
                              </p>
                            </div>
                            
                            {camera.health.error && (
                              <p
                                title={camera.health.error}
                                className="line-clamp-2 rounded-[14px] bg-red-500/10 px-3 py-2 font-inter text-xs font-semibold leading-5 text-red-600"
                              >
                                {camera.health.error}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="font-inter text-xs font-semibold text-[var(--color-text-muted)]">
                            Нет данных
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-inter text-sm font-bold text-[var(--color-text-primary)]">
                          {camera.city}
                        </p>

                        <p className="mt-1 max-w-[220px] truncate font-inter text-xs text-[var(--color-text-secondary)]">
                          {camera.address}
                        </p>

                        <p className="mt-1 font-inter text-xs text-[var(--color-text-muted)]">
                          {camera.latitude.toFixed(4)}, {camera.longitude.toFixed(4)}
                        </p>

                        <p className="mt-1 font-inter text-xs font-semibold text-[var(--color-primary)]">
                          {getCategoryLabel(camera.category)}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <div className="space-y-1 font-inter text-xs text-[var(--color-text-secondary)]">
                          <p>
                            Дальность:{' '}
                            <span className="font-bold text-[var(--color-text-primary)]">
                              {formatMeters(camera.coverage?.rangeMeters)}
                            </span>
                          </p>

                          <p>
                            FOV:{' '}
                            <span className="font-bold text-[var(--color-text-primary)]">
                              {camera.coverage?.fovDeg
                                ? `${camera.coverage.fovDeg}°`
                                : '—'}
                            </span>
                          </p>

                          <p>
                            Direction:{' '}
                            <span className="font-bold text-[var(--color-text-primary)]">
                              {camera.coverage?.directionDeg
                                ? `${camera.coverage.directionDeg}°`
                                : '—'}
                            </span>
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {camera.connection ? (
                          <div className="max-w-[240px]">
                            <p className="truncate font-inter text-xs font-bold text-[var(--color-text-primary)]">
                              {camera.connection.rtspUrl}
                            </p>

                            <p className="mt-1 font-inter text-xs text-[var(--color-text-secondary)]">
                              user:{' '}
                              <span className="font-bold">
                                {camera.connection.username}
                              </span>
                            </p>

                            <p className="mt-1 font-inter text-xs text-[var(--color-text-muted)]">
                              password: ••••••••
                            </p>
                          </div>
                        ) : (
                          <span className="font-inter text-xs font-semibold text-[var(--color-text-muted)]">
                            Не настроено
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-inter text-sm font-extrabold text-[var(--color-text-primary)]">
                          {camera.viewsCount}
                        </span>
                      </td>

                      <td className="px-5 py-4 font-inter text-sm font-semibold text-[var(--color-text-secondary)]">
                        {formatDate(camera.updatedAt)}
                      </td>

                      <td className="px-5 py-4">
                        {isDeleted ? (
                          <span className="inline-flex rounded-full bg-red-500/10 px-3 py-1 font-inter text-xs font-bold text-red-600">
                            Удалена
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-green-500/10 px-3 py-1 font-inter text-xs font-bold text-green-600">
                            Активна
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedCameraForEdit(camera)}
                            className="h-10 rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface-solid)] px-4 font-inter text-xs font-bold text-[var(--color-text-primary)] transition hover:text-[var(--color-primary)]"
                          >
                            Изменить
                          </button>

                          <button
                            type="button"
                            disabled={Boolean(camera.deletedAt) || deletingCameraId === camera.id}
                            onClick={() => handleDeleteCamera(camera)}
                            className="h-10 rounded-[14px] border border-red-500/20 bg-red-500/10 px-4 font-inter text-xs font-bold text-red-600 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-red-500/10 disabled:hover:text-red-600"
                          >
                            {deletingCameraId === camera.id ? 'Удаляем...' : 'Удалить'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-[var(--color-border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-inter text-sm text-[var(--color-text-secondary)]">
            Показано {cameras.length} из {meta.total}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!meta.hasPreviousPage || isLoading}
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              className="h-10 rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface-solid)] px-4 font-inter text-sm font-bold text-[var(--color-text-primary)] transition hover:text-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Назад
            </button>

            <div className="flex h-10 min-w-10 items-center justify-center rounded-[14px] bg-[var(--color-primary)] px-3 font-inter text-sm font-extrabold text-[var(--color-secondary-text)]">
              {meta.page}
            </div>

            <button
              type="button"
              disabled={!meta.hasNextPage || isLoading}
              onClick={() => setPage((prev) => prev + 1)}
              className="h-10 rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface-solid)] px-4 font-inter text-sm font-bold text-[var(--color-text-primary)] transition hover:text-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Далее
            </button>
          </div>
        </div>
      </div>

      {selectedCameraForEdit && (
        <AdminCameraEditModal
          camera={selectedCameraForEdit}
          onClose={() => setSelectedCameraForEdit(null)}
          onUpdated={() => {
            setActionError(null);
            setActionSuccess('Камера успешно обновлена');
            setReloadKey((prev) => prev + 1);
          }}
        />
      )}
    </section>
  );
}