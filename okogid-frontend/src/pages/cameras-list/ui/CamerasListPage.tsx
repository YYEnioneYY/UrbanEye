import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';

import type { Camera } from '../../../entities/camera/model/types';
import {
  getCamerasList,
  type CamerasListMeta,
} from '../../../entities/camera/api/camerasApi';

const DEFAULT_META: CamerasListMeta = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
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

function CameraCard({ camera }: { camera: Camera }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[32px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl shadow-[var(--color-shadow)] backdrop-blur-2xl transition hover:-translate-y-1 hover:shadow-2xl">
      <div className="relative h-44 shrink-0 overflow-hidden bg-[var(--color-bg-soft)]">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-bg-soft)] to-[var(--color-bg)]" />

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-secondary-text)] shadow-xl">
            <CameraIcon />
          </div>
        </div>

        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span
            className={[
              'rounded-full px-3 py-1 font-inter text-xs font-bold ring-1 backdrop-blur-xl',
              getStatusClassName(camera.status),
            ].join(' ')}
          >
            {getStatusLabel(camera.status)}
          </span>

          <span className="rounded-full bg-[var(--navbar-bg)] px-3 py-1 font-inter text-xs font-bold text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)] backdrop-blur-xl">
            {getCategoryLabel(camera.category)}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h2 className="line-clamp-2 min-h-[64px] text-2xl font-extrabold leading-tight text-[var(--color-text-primary)]">
          {camera.title}
        </h2>

        <p className="mt-2 line-clamp-3 min-h-[72px] font-inter text-sm leading-6 text-[var(--color-text-secondary)]">
          {camera.description}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-[var(--color-bg-soft)] p-3">
            <p className="font-inter text-[10px] font-bold uppercase text-[var(--color-text-muted)]">
              Город
            </p>

            <p className="mt-1 truncate text-sm font-extrabold text-[var(--color-text-primary)]">
              {camera.city}
            </p>
          </div>

          <div className="rounded-2xl bg-[var(--color-bg-soft)] p-3">
            <p className="font-inter text-[10px] font-bold uppercase text-[var(--color-text-muted)]">
              Просмотры
            </p>

            <p className="mt-1 text-sm font-extrabold text-[var(--color-text-primary)]">
              {camera.viewsCount ?? 0}
            </p>
          </div>

          <div className="rounded-2xl bg-[var(--color-bg-soft)] p-3">
            <p className="font-inter text-[10px] font-bold uppercase text-[var(--color-text-muted)]">
              Дальность
            </p>

            <p className="mt-1 text-sm font-extrabold text-[var(--color-text-primary)]">
              {formatMeters(camera.coverage?.rangeMeters)}
            </p>
          </div>

          <div className="rounded-2xl bg-[var(--color-bg-soft)] p-3">
            <p className="font-inter text-[10px] font-bold uppercase text-[var(--color-text-muted)]">
              Угол
            </p>

            <p className="mt-1 text-sm font-extrabold text-[var(--color-text-primary)]">
              {camera.coverage?.fovDeg ? `${camera.coverage.fovDeg}°` : '—'}
            </p>
          </div>
        </div>

        <p className="mt-4 line-clamp-1 font-inter text-sm font-semibold text-[var(--color-text-secondary)]">
          {camera.address}
        </p>

        <div className="mt-auto pt-5">
          <Link
            to={`/cameras/${camera.id}`}
            className="flex h-12 w-full items-center justify-center rounded-[18px] bg-[var(--color-primary)] px-5 text-sm font-extrabold text-[var(--color-secondary-text)] transition hover:scale-[1.01]"
          >
            Смотреть камеру
          </Link>
        </div>
      </div>
    </article>
  );
}

export function CamerasListPage() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [meta, setMeta] = useState<CamerasListMeta>(DEFAULT_META);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [status, setStatus] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        const response = await getCamerasList(
          {
            page,
            limit,
            search: debouncedSearch,
            status,
            city,
            category,
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
  }, [page, limit, debouncedSearch, status, city, category]);

  const resetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setStatus('');
    setCity('');
    setCategory('');
    setPage(1);
  };

  return (
    <section className="min-h-screen px-4 py-24 md:px-8 md:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">

          <div className="mt-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-[var(--color-text-primary)] md:text-6xl">
                Камеры города
              </h1>

              <p className="mt-4 max-w-2xl font-inter text-base leading-7 text-[var(--color-text-secondary)]">
                Список всех доступных камер проекта. Можно найти камеру по
                названию, городу, статусу или категории.
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

        <div className="mb-6 rounded-[32px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-xl shadow-[var(--color-shadow)] backdrop-blur-2xl">
          <div className="grid gap-3 xl:grid-cols-[1fr_180px_220px_180px_140px_auto] xl:items-center">
            <label className="flex h-12 items-center gap-3 rounded-[18px] border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-4 text-[var(--color-text-secondary)] transition focus-within:border-[var(--color-primary)]">
              <SearchIcon />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Поиск по камерам..."
                className="w-full border-none bg-transparent font-inter text-sm font-semibold text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-secondary)]"
              />
            </label>

            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              className="h-12 rounded-[18px] border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-4 font-inter text-sm font-semibold text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
            >
              <option value="">Все статусы</option>
              <option value="online">online</option>
              <option value="offline">offline</option>
              <option value="maintenance">maintenance</option>
            </select>

            <input
              value={city}
              onChange={(event) => {
                setCity(event.target.value);
                setPage(1);
              }}
              placeholder="Город"
              className="h-12 rounded-[18px] border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-4 font-inter text-sm font-semibold text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-primary)]"
            />

            <input
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                setPage(1);
              }}
              placeholder="Категория"
              className="h-12 rounded-[18px] border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-4 font-inter text-sm font-semibold text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-primary)]"
            />

            <select
              value={limit}
              onChange={(event) => {
                setLimit(Number(event.target.value));
                setPage(1);
              }}
              className="h-12 rounded-[18px] border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-4 font-inter text-sm font-semibold text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
            >
              <option value={12}>12</option>
              <option value={20}>20</option>
              <option value={40}>40</option>
            </select>

            <button
              type="button"
              onClick={resetFilters}
              className="h-12 rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface-solid)] px-5 font-inter text-sm font-bold text-[var(--color-text-primary)] transition hover:text-[var(--color-primary)]"
            >
              Сбросить
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-[24px] border border-red-500/20 bg-red-500/10 px-5 py-4 font-inter text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

        {isLoading && cameras.length === 0 ? (
          <div className="rounded-[32px] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-xl shadow-[var(--color-shadow)] backdrop-blur-2xl">
            <p className="font-inter text-sm font-semibold text-[var(--color-text-secondary)]">
              Загружаем камеры...
            </p>
          </div>
        ) : cameras.length === 0 ? (
          <div className="rounded-[32px] border border-[var(--color-border)] bg-[var(--color-surface)] p-10 text-center shadow-xl shadow-[var(--color-shadow)] backdrop-blur-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-[var(--color-primary-text)]">
              <CameraIcon />
            </div>

            <h2 className="mt-5 text-2xl font-extrabold text-[var(--color-text-primary)]">
              Камеры не найдены
            </h2>

            <p className="mx-auto mt-3 max-w-md font-inter text-sm leading-6 text-[var(--color-text-secondary)]">
              Попробуйте изменить поиск или сбросить фильтры.
            </p>
          </div>
        ) : (
          <div className="grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3">
            {cameras.map((camera) => (
              <CameraCard key={camera.id} camera={camera} />
            ))}
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3 rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 shadow-xl shadow-[var(--color-shadow)] backdrop-blur-2xl sm:flex-row sm:items-center sm:justify-between">
          <p className="font-inter text-sm text-[var(--color-text-secondary)]">
            Страница {meta.page} из {meta.totalPages || 1}. Показано{' '}
            {cameras.length} из {meta.total}
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
    </section>
  );
}