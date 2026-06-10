import { useEffect, useMemo, useState } from 'react';

import type { Camera } from '../../../entities/camera/model/types';
import type { CameraStream } from '../../../entities/stream/model/types';
import {
  getCamerasList,
  type CamerasListMeta,
} from '../../../entities/camera/api/camerasApi';
import { getCameraStreamByCameraId } from '../../../entities/stream/api/streamsApi';

type MonitorSlot = {
  camera: Camera;
  stream: CameraStream;
};

const SLOTS_COUNT = 9;
const STORAGE_KEY = 'okogid-camera-monitor-slots';

const DEFAULT_META: CamerasListMeta = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

function createEmptySlots(): Array<MonitorSlot | null> {
  return Array.from({ length: SLOTS_COUNT }, () => null as MonitorSlot | null);
}

function createEmptySlotIds(): Array<string | null> {
  return Array.from({ length: SLOTS_COUNT }, () => null as string | null);
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

function CloseIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function getStatusLabel(status: Camera['status']) {
  if (status === 'online') return 'Онлайн';
  if (status === 'offline') return 'Офлайн';
  return 'Обслуживание';
}

function getStatusClassName(status: Camera['status']) {
  if (status === 'online') {
    return 'bg-green-500/10 text-green-600 ring-green-500/20';
  }

  if (status === 'offline') {
    return 'bg-red-500/10 text-red-600 ring-red-500/20';
  }

  return 'bg-yellow-500/10 text-yellow-600 ring-yellow-500/20';
}

function getSavedSlotIds(): Array<string | null> {
  try {
    const rawValue = localStorage.getItem(STORAGE_KEY);

    if (!rawValue) {
      return createEmptySlotIds();
    }

    const parsed = JSON.parse(rawValue) as unknown;

    if (!Array.isArray(parsed)) {
      return createEmptySlotIds();
    }

    return Array.from({ length: SLOTS_COUNT }, (_, index) => {
      const value = parsed[index];

      return typeof value === 'string' ? value : null;
    });
  } catch {
    return createEmptySlotIds();
  }
}

function saveSlotIds(slots: Array<MonitorSlot | null>) {
  const ids = slots.map((slot) => slot?.camera.id ?? null);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

function MonitorCell({
  index,
  slot,
  isActive,
  isLoading,
  onSelect,
  onClear,
}: {
  index: number;
  slot: MonitorSlot | null;
  isActive: boolean;
  isLoading: boolean;
  onSelect: () => void;
  onClear: () => void;
}) {
  return (
    <article
      className={[
        'group relative h-full min-h-[190px] overflow-hidden rounded-[22px] border bg-black shadow-xl transition',
        isActive
          ? 'border-[var(--color-primary)] shadow-[0_0_0_1px_var(--color-primary)]'
          : 'border-[var(--color-border)] hover:border-[var(--color-primary)]',
      ].join(' ')}
    >
      {slot ? (
        <div className="h-full w-full bg-black">
          <iframe
            src={slot.stream.playerUrl}
            title={slot.camera.title}
            className="h-full w-full border-0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={onSelect}
          className="flex h-full w-full flex-col items-center justify-center bg-[var(--color-bg-soft)] px-4 text-center"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-secondary-text)] shadow-lg">
            <CameraIcon />
          </div>

          <p className="mt-4 text-sm font-extrabold text-[var(--color-text-primary)]">
            Ячейка {index + 1}
          </p>

          <p className="mt-1 font-inter text-xs text-[var(--color-text-secondary)]">
            Нажмите, чтобы выбрать канал
          </p>
        </button>
      )}

      {slot && (
        <button
          type="button"
          onClick={onSelect}
          className="absolute inset-0 z-10 bg-transparent"
          aria-label={`Выбрать ячейку ${index + 1}`}
        />
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-black/85 to-transparent p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-inter text-[10px] font-bold uppercase tracking-wide text-white/50">
              Канал {index + 1}
            </p>

            <p className="mt-1 truncate text-sm font-extrabold text-white">
              {slot?.camera.title ?? 'Камера не выбрана'}
            </p>
          </div>

          {slot && (
            <span
              className={[
                'shrink-0 rounded-full px-2 py-1 font-inter text-[10px] font-bold ring-1 backdrop-blur-xl',
                getStatusClassName(slot.camera.status),
              ].join(' ')}
            >
              {getStatusLabel(slot.camera.status)}
            </span>
          )}
        </div>
      </div>

      {slot && (
        <button
          type="button"
          onClick={onClear}
          className="absolute bottom-3 right-3 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white opacity-0 shadow-lg backdrop-blur-xl transition hover:bg-red-500 group-hover:opacity-100"
          aria-label="Очистить ячейку"
        >
          <CloseIcon />
        </button>
      )}

      {isLoading && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <span className="rounded-full bg-white/10 px-4 py-2 font-inter text-xs font-bold text-white">
            Подключаем...
          </span>
        </div>
      )}
    </article>
  );
}

function CameraPickerModal({
  activeSlotIndex,
  cameras,
  meta,
  search,
  isLoading,
  error,
  slotError,
  onSearchChange,
  onSelectCamera,
  onClose,
  onPreviousPage,
  onNextPage,
}: {
  activeSlotIndex: number;
  cameras: Camera[];
  meta: CamerasListMeta;
  search: string;
  isLoading: boolean;
  error: string | null;
  slotError: string | null;
  onSearchChange: (value: string) => void;
  onSelectCamera: (camera: Camera) => void;
  onClose: () => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[80] bg-black/40 px-4 py-5 backdrop-blur-sm">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Закрыть выбор камеры"
        onClick={onClose}
      />

      <div className="relative mx-auto flex max-h-[calc(100vh-40px)] max-w-6xl flex-col overflow-hidden rounded-[34px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl shadow-black/30">
        <div className="flex flex-col gap-4 border-b border-[var(--color-border)] p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-inter text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
              Выбор камеры
            </p>

            <h2 className="mt-1 text-2xl font-extrabold text-[var(--color-text-primary)]">
              В ячейку #{activeSlotIndex + 1}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex h-12 w-full min-w-[280px] items-center gap-3 rounded-[18px] border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-4 text-[var(--color-text-secondary)] transition focus-within:border-[var(--color-primary)] md:w-[360px]">
              <SearchIcon />

              <input
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Найти камеру..."
                className="w-full border-none bg-transparent font-inter text-sm font-semibold text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-secondary)]"
              />
            </label>

            <button
              type="button"
              onClick={onClose}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-solid)] text-[var(--color-text-primary)] transition hover:text-red-500"
              aria-label="Закрыть"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {error && (
            <div className="mb-4 rounded-[22px] border border-red-500/20 bg-red-500/10 p-4 font-inter text-sm font-semibold text-red-600">
              {error}
            </div>
          )}

          {slotError && (
            <div className="mb-4 rounded-[22px] border border-red-500/20 bg-red-500/10 p-4 font-inter text-sm font-semibold text-red-600">
              {slotError}
            </div>
          )}

          {isLoading && cameras.length === 0 ? (
            <div className="rounded-[22px] bg-[var(--color-bg-soft)] p-5 font-inter text-sm font-semibold text-[var(--color-text-secondary)]">
              Загружаем камеры...
            </div>
          ) : cameras.length === 0 ? (
            <div className="rounded-[24px] bg-[var(--color-bg-soft)] p-8 text-center">
              <p className="text-xl font-extrabold text-[var(--color-text-primary)]">
                Камеры не найдены
              </p>

              <p className="mt-2 font-inter text-sm text-[var(--color-text-secondary)]">
                Попробуйте изменить поиск.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {cameras.map((camera) => (
                <button
                  key={camera.id}
                  type="button"
                  onClick={() => onSelectCamera(camera)}
                  className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface-solid)] p-4 text-left shadow-sm transition hover:border-[var(--color-primary)] hover:bg-[var(--color-bg-soft)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-base font-extrabold text-[var(--color-text-primary)]">
                        {camera.title}
                      </p>

                      <p className="mt-1 line-clamp-2 font-inter text-xs leading-5 text-[var(--color-text-secondary)]">
                        {camera.address}
                      </p>
                    </div>

                    <span
                      className={[
                        'shrink-0 rounded-full px-2.5 py-1 font-inter text-[10px] font-bold ring-1',
                        getStatusClassName(camera.status),
                      ].join(' ')}
                    >
                      {getStatusLabel(camera.status)}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="font-inter text-xs font-semibold text-[var(--color-text-secondary)]">
                      {camera.city}
                    </span>

                    <span className="font-inter text-xs font-bold text-[var(--color-primary)]">
                      Выбрать
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[var(--color-border)] p-4">
          <button
            type="button"
            disabled={!meta.hasPreviousPage || isLoading}
            onClick={onPreviousPage}
            className="h-10 rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface-solid)] px-4 font-inter text-sm font-bold text-[var(--color-text-primary)] transition hover:text-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Назад
          </button>

          <span className="font-inter text-sm font-bold text-[var(--color-text-secondary)]">
            {meta.page} / {meta.totalPages || 1}
          </span>

          <button
            type="button"
            disabled={!meta.hasNextPage || isLoading}
            onClick={onNextPage}
            className="h-10 rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface-solid)] px-4 font-inter text-sm font-bold text-[var(--color-text-primary)] transition hover:text-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Далее
          </button>
        </div>
      </div>
    </div>
  );
}

export function CamerasMonitorPage() {
  const [slots, setSlots] = useState<Array<MonitorSlot | null>>(
    createEmptySlots(),
  );

  const [activeSlotIndex, setActiveSlotIndex] = useState(0);
  const [loadingSlotIndex, setLoadingSlotIndex] = useState<number | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const [cameras, setCameras] = useState<Camera[]>([]);
  const [meta, setMeta] = useState<CamerasListMeta>(DEFAULT_META);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [isCamerasLoading, setIsCamerasLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [slotError, setSlotError] = useState<string | null>(null);

  const filledSlotsCount = useMemo(
    () => slots.filter(Boolean).length,
    [slots],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [search]);

  useEffect(() => {
    const abortController = new AbortController();

    async function loadCameras() {
      try {
        setIsCamerasLoading(true);
        setError(null);

        const response = await getCamerasList(
          {
            page,
            limit: 20,
            search: debouncedSearch,
            status: 'online',
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
          setIsCamerasLoading(false);
        }
      }
    }

    loadCameras();

    return () => {
      abortController.abort();
    };
  }, [page, debouncedSearch]);

  useEffect(() => {
    const savedIds = getSavedSlotIds();

    if (!savedIds.some(Boolean)) {
      return;
    }

    let isActive = true;
    const abortController = new AbortController();

    async function restoreSlots() {
      const restoredSlots: Array<MonitorSlot | null> = await Promise.all(
        savedIds.map(async (cameraId) => {
          if (!cameraId) {
            return null;
          }

          try {
            const data = await getCameraStreamByCameraId(
              cameraId,
              abortController.signal,
            );

            return {
              camera: data.camera,
              stream: data.stream,
            };
          } catch {
            return null;
          }
        }),
      );

      if (!isActive || abortController.signal.aborted) {
        return;
      }

      setSlots(restoredSlots);
    }

    restoreSlots();

    return () => {
      isActive = false;
      abortController.abort();
    };
  }, []);

  const selectCameraForSlot = async (camera: Camera) => {
    const targetSlotIndex = activeSlotIndex;

    setSlotError(null);
    setLoadingSlotIndex(targetSlotIndex);
    setIsPickerOpen(false);

    const abortController = new AbortController();

    try {
      const data = await getCameraStreamByCameraId(
        camera.id,
        abortController.signal,
      );

      setSlots((prev) => {
        const nextSlots = [...prev];

        nextSlots[targetSlotIndex] = {
          camera: data.camera,
          stream: data.stream,
        };

        saveSlotIds(nextSlots);

        return nextSlots;
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Не удалось подключить камеру к ячейке';

      setSlotError(message);
      setIsPickerOpen(true);
    } finally {
      setLoadingSlotIndex(null);
    }
  };

  const clearSlot = (slotIndex: number) => {
    setSlots((prev) => {
      const nextSlots = [...prev];

      nextSlots[slotIndex] = null;

      saveSlotIds(nextSlots);

      return nextSlots;
    });
  };

  const clearAllSlots = () => {
    const emptySlots = createEmptySlots();

    setSlots(emptySlots);
    saveSlotIds(emptySlots);
  };

  const openPickerForSlot = (slotIndex: number) => {
    setActiveSlotIndex(slotIndex);
    setIsPickerOpen(true);
  };

  return (
    <section className="min-h-screen px-4 pb-5 pt-24 md:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-116px)] max-w-[1920px] flex-col gap-4">
        <div className="flex flex-col gap-4 rounded-[30px] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 shadow-xl shadow-[var(--color-shadow)] backdrop-blur-2xl xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex rounded-full bg-[var(--color-primary)] px-4 py-2 font-inter text-xs font-extrabold text-[var(--color-secondary-text)]">
                Видеонаблюдение
              </span>

              <span className="font-inter text-sm font-bold text-[var(--color-text-secondary)]">
                Активно {filledSlotsCount} / 9
              </span>

              <span className="font-inter text-sm font-bold text-[var(--color-text-secondary)]">
                Выбрана ячейка #{activeSlotIndex + 1}
              </span>
            </div>

            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--color-text-primary)] md:text-4xl">
              Видеостена камер
            </h1>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setIsPickerOpen(true)}
              className="h-12 rounded-[18px] bg-[var(--button-third-bg)] px-5 font-inter text-sm font-extrabold text-[var(--button-third-text)] transition hover:scale-[1.02] hover:bg-[var(--button-third-hover)]"
            >
              Выбрать камеру
            </button>

            <button
              type="button"
              onClick={() => clearSlot(activeSlotIndex)}
              className="h-12 rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface-solid)] px-5 font-inter text-sm font-bold text-[var(--color-text-primary)] transition hover:text-red-500"
            >
              Очистить ячейку
            </button>

            <button
              type="button"
              onClick={clearAllSlots}
              className="h-12 rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface-solid)] px-5 font-inter text-sm font-bold text-[var(--color-text-primary)] transition hover:text-red-500"
            >
              Очистить всё
            </button>
          </div>
        </div>

        <div className="flex-1 rounded-[34px] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-2xl shadow-[var(--color-shadow)] backdrop-blur-2xl">
          <div className="grid h-full min-h-[680px] gap-3 md:grid-cols-2 xl:grid-cols-3 xl:grid-rows-3">
            {slots.map((slot, index) => (
              <MonitorCell
                key={index}
                index={index}
                slot={slot}
                isActive={activeSlotIndex === index}
                isLoading={loadingSlotIndex === index}
                onSelect={() => openPickerForSlot(index)}
                onClear={() => clearSlot(index)}
              />
            ))}
          </div>
        </div>
      </div>

      {isPickerOpen && (
        <CameraPickerModal
          activeSlotIndex={activeSlotIndex}
          cameras={cameras}
          meta={meta}
          search={search}
          isLoading={isCamerasLoading}
          error={error}
          slotError={slotError}
          onSearchChange={setSearch}
          onSelectCamera={selectCameraForSlot}
          onClose={() => setIsPickerOpen(false)}
          onPreviousPage={() => setPage((prev) => Math.max(prev - 1, 1))}
          onNextPage={() => setPage((prev) => prev + 1)}
        />
      )}
    </section>
  );
}