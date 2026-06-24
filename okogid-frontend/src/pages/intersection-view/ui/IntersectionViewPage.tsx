import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { io, type Socket } from 'socket.io-client';

import type { Camera } from '../../../entities/camera/model/types';
import {
  getIntersectionStreamsById,
  type IntersectionCameraStream,
  type IntersectionStreamItem,
} from '../../../entities/intersection/api/intersectionsApi';
import type { Intersection } from '../../../entities/intersection/model/types';

type PageState = {
  intersection: Intersection | null;
  streams: IntersectionStreamItem[];
};

type CameraEventsConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'open'
  | 'closed'
  | 'error';

type CameraEvent = {
  id: string;
  type: string;
  cameraId: string;
  intersectionId: string | null;
  title: string;
  description: string | null;
  imageUrl: string | null;
  confidence: number | null;
  metadata: Record<string, unknown>;
  occurredAt: string;
  createdAt: string;
};

const CAMERA_EVENTS_URL =
  (import.meta.env.VITE_CAMERA_EVENTS_URL as string | undefined) ??
  'http://localhost:3010/camera-events';

const CAMERA_EVENTS_PUBLIC_URL =
  import.meta.env.VITE_CAMERA_EVENTS_PUBLIC_URL as string | undefined;

function getStreamPlayerUrl(stream: IntersectionCameraStream | null) {
  if (!stream) {
    return null;
  }

  const possibleUrls = [
    stream.playerUrl,
    stream.embedUrl,
    stream.streamUrl,
    stream.hlsUrl,
    stream.url,
  ];

  return (
    possibleUrls.find(
      (value): value is string => typeof value === 'string' && value.length > 0,
    ) ?? null
  );
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

function getIntersectionStatusLabel(status?: string) {
  if (status === 'active') return 'Активный';
  if (status === 'inactive') return 'Неактивный';
  if (status === 'planned') return 'Запланирован';

  return status ?? '—';
}

function getConnectionStatusLabel(status: CameraEventsConnectionStatus) {
  if (status === 'idle') return 'Ожидание';
  if (status === 'connecting') return 'Подключение';
  if (status === 'open') return 'Подключено';
  if (status === 'closed') return 'Отключено';

  return 'Ошибка';
}

function getConnectionStatusClassName(status: CameraEventsConnectionStatus) {
  if (status === 'open') {
    return 'bg-green-500/10 text-green-600 ring-green-500/20';
  }

  if (status === 'connecting') {
    return 'bg-blue-500/10 text-blue-600 ring-blue-500/20';
  }

  if (status === 'error') {
    return 'bg-red-500/10 text-red-600 ring-red-500/20';
  }

  return 'bg-zinc-500/10 text-zinc-500 ring-zinc-500/20';
}

function getEventTypeLabel(type: string) {
  const labels: Record<string, string> = {
    event: 'Событие',
    motion: 'Движение',
    person: 'Человек',
    vehicle: 'Транспорт',
    car: 'Автомобиль',
    object: 'Объект',
    alarm: 'Тревога',
    message: 'Сообщение',
  };

  return labels[type.toLowerCase()] ?? type;
}

function formatDate(value?: string | null) {
  if (!value) return '—';

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatTime(value?: string | null) {
  if (!value) return '—';

  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value));
}

function getConfidenceLabel(confidence: number | null) {
  if (typeof confidence !== 'number') {
    return null;
  }

  if (confidence <= 1) {
    return `${Math.round(confidence * 100)}%`;
  }

  return `${Math.round(confidence)}%`;
}

function getMetadataEntries(metadata: Record<string, unknown>) {
  return Object.entries(metadata).filter(([, value]) => value !== undefined);
}

function getJsonString(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function createEventImageUrl(imageUrl: string | null) {
  if (!imageUrl) {
    return null;
  }

  if (
    imageUrl.startsWith('http://') ||
    imageUrl.startsWith('https://') ||
    imageUrl.startsWith('data:')
  ) {
    return imageUrl;
  }

  let baseUrl = CAMERA_EVENTS_PUBLIC_URL;

  if (!baseUrl) {
    try {
      baseUrl = new URL(CAMERA_EVENTS_URL).origin;
    } catch {
      baseUrl = 'http://localhost:3010';
    }
  }

  const normalizedBaseUrl = baseUrl.endsWith('/')
    ? baseUrl.slice(0, -1)
    : baseUrl;

  const normalizedPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;

  return `${normalizedBaseUrl}${normalizedPath}`;
}

export function IntersectionViewPage() {
  const { intersectionId } = useParams<{ intersectionId: string }>();

  const [pageState, setPageState] = useState<PageState>({
    intersection: null,
    streams: [],
  });

  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const intersection = pageState.intersection;
  const streams = pageState.streams;

  const selectedStreamItem = useMemo(() => {
    return (
      streams.find((item) => item.camera.id === selectedCameraId) ??
      streams[0] ??
      null
    );
  }, [streams, selectedCameraId]);

  const availableStreamsCount = useMemo(() => {
    return streams.filter((item) => item.available && item.stream).length;
  }, [streams]);

  useEffect(() => {
    if (!intersectionId) {
      setError('ID перекрёстка не найден');
      setIsLoading(false);
      return;
    }

    const abortController = new AbortController();

    const loadIntersectionStreams = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const data = await getIntersectionStreamsById(
          intersectionId,
          abortController.signal,
        );

        if (abortController.signal.aborted) {
          return;
        }

        setPageState({
          intersection: data.intersection,
          streams: data.streams,
        });

        setSelectedCameraId((prev) => {
          const prevExists = data.streams.some(
            (item) => item.camera.id === prev,
          );

          if (prev && prevExists) {
            return prev;
          }

          return data.streams[0]?.camera.id ?? null;
        });
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : 'Не удалось загрузить перекрёсток';

        setError(message);
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void loadIntersectionStreams();

    return () => {
      abortController.abort();
    };
  }, [intersectionId]);

  return (
    <main className="min-h-screen bg-[var(--color-bg)] px-4 pb-10 pt-24 md:px-6">
      <div className="mx-auto max-w-[1700px]">
        {isLoading && (
          <div className="rounded-[34px] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-xl shadow-[var(--color-shadow)]">
            <p className="font-inter text-sm font-semibold text-[var(--color-text-secondary)]">
              Загружаем камеры перекрёстка...
            </p>
          </div>
        )}

        {error && !isLoading && (
          <div className="rounded-[34px] border border-red-500/20 bg-red-500/10 p-8 shadow-xl shadow-[var(--color-shadow)]">
            <h1 className="text-2xl font-black text-red-600">
              Не удалось открыть перекрёсток
            </h1>

            <p className="mt-3 font-inter text-sm font-semibold text-red-600">
              {error}
            </p>
          </div>
        )}

        {intersection && !isLoading && !error && (
          <>
            <section className="overflow-hidden rounded-[38px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl shadow-[var(--color-shadow)]">
              <div className="grid gap-0 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="p-6 md:p-8">
                  <p className="font-inter text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
                    Перекрёсток
                  </p>

                  <h1 className="mt-3 max-w-4xl text-4xl font-black leading-tight text-[var(--color-text-primary)] md:text-5xl">
                    {intersection.title}
                  </h1>

                  <p className="mt-4 max-w-3xl font-inter text-base leading-7 text-[var(--color-text-secondary)]">
                    {intersection.description}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Badge label={getIntersectionStatusLabel(intersection.status)} />
                    <Badge label={intersection.category} />
                    <Badge label={intersection.city} />
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                      label="Всего камер"
                      value={intersection.camerasCount}
                    />

                    <StatCard
                      label="Онлайн"
                      value={intersection.onlineCamerasCount}
                      accent={intersection.onlineCamerasCount > 0}
                    />

                    <StatCard
                      label="Потоков доступно"
                      value={availableStreamsCount}
                      accent={availableStreamsCount > 0}
                    />

                    <StatCard
                      label="Недоступно"
                      value={Math.max(
                        streams.length - availableStreamsCount,
                        0,
                      )}
                    />
                  </div>
                </div>

                <div className="border-t border-[var(--color-border)] bg-[var(--color-bg-soft)] p-6 md:p-8 xl:border-l xl:border-t-0">
                  <IntersectionMiniView
                    onlineCamerasCount={intersection.onlineCamerasCount}
                    camerasCount={intersection.camerasCount}
                  />

                  <div className="mt-5 rounded-[24px] bg-[var(--color-surface)] p-5">
                    <p className="font-inter text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                      Адрес
                    </p>

                    <p className="mt-2 font-inter text-base font-extrabold leading-7 text-[var(--color-text-primary)]">
                      {intersection.address}
                    </p>

                    <p className="mt-3 font-inter text-sm text-[var(--color-text-secondary)]">
                      {intersection.latitude.toFixed(6)},{' '}
                      {intersection.longitude.toFixed(6)}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_500px]">
              <div>
                <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="text-3xl font-black text-[var(--color-text-primary)]">
                      Камеры перекрёстка
                    </h2>

                    <p className="mt-1 font-inter text-sm text-[var(--color-text-secondary)]">
                      Выбери камеру слева, и справа будут показаны события
                      именно этой камеры.
                    </p>
                  </div>
                </div>

                {streams.length === 0 ? (
                  <div className="rounded-[34px] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center shadow-xl shadow-[var(--color-shadow)]">
                    <h3 className="text-2xl font-black text-[var(--color-text-primary)]">
                      Камеры не привязаны
                    </h3>

                    <p className="mt-2 font-inter text-sm text-[var(--color-text-secondary)]">
                      У этого перекрёстка пока нет связанных камер.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-5 lg:grid-cols-2">
                    {streams.map((item) => (
                      <StreamCard
                        key={item.camera.id}
                        item={item}
                        isSelected={item.camera.id === selectedStreamItem?.camera.id}
                        onSelect={() => setSelectedCameraId(item.camera.id)}
                      />
                    ))}
                  </div>
                )}
              </div>

              <aside className="xl:sticky xl:top-24 xl:self-start">
                {selectedStreamItem ? (
                  <CameraEventsPanel camera={selectedStreamItem.camera} />
                ) : (
                  <div className="rounded-[34px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xl shadow-[var(--color-shadow)]">
                    <h3 className="text-xl font-black text-[var(--color-text-primary)]">
                      Камера не выбрана
                    </h3>

                    <p className="mt-2 font-inter text-sm leading-6 text-[var(--color-text-secondary)]">
                      Выбери камеру слева, чтобы смотреть события.
                    </p>
                  </div>
                )}
              </aside>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function StreamCard({
  item,
  isSelected,
  onSelect,
}: {
  item: IntersectionStreamItem;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const playerUrl = getStreamPlayerUrl(item.stream);
  const canPlay = item.available && Boolean(playerUrl);

  return (
    <article
      onClick={onSelect}
      className={[
        'cursor-pointer overflow-hidden rounded-[34px] border bg-[var(--color-surface)] shadow-xl shadow-[var(--color-shadow)] transition',
        isSelected
          ? 'border-[var(--color-primary)] ring-4 ring-[var(--color-primary)]/20'
          : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/60',
      ].join(' ')}
    >
      <div className="relative aspect-video bg-[#0F1318]">
        {canPlay && playerUrl ? (
          <iframe
            src={playerUrl}
            title={item.camera.title}
            className="h-full w-full"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/15">
              <CameraIcon />
            </div>

            <h3 className="mt-4 text-xl font-black text-white">
              Камера недоступна
            </h3>

            <p className="mt-2 max-w-sm font-inter text-sm leading-6 text-white/60">
              {item.error ?? 'Поток сейчас недоступен'}
            </p>
          </div>
        )}

        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span
            className={[
              'rounded-full px-3 py-1 font-inter text-xs font-bold ring-1 backdrop-blur-xl',
              getCameraStatusClassName(item.camera.status),
            ].join(' ')}
          >
            {getCameraStatusLabel(item.camera.status)}
          </span>

          {!item.available && (
            <span className="rounded-full bg-red-500/80 px-3 py-1 font-inter text-xs font-bold text-white backdrop-blur-xl">
              Нет потока
            </span>
          )}

          {isSelected && (
            <span className="rounded-full bg-[var(--color-primary)] px-3 py-1 font-inter text-xs font-black text-[var(--color-secondary-text)] backdrop-blur-xl">
              Выбрана
            </span>
          )}
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-xl font-black leading-tight text-[var(--color-text-primary)]">
              {item.camera.title}
            </h3>

            <p className="mt-2 line-clamp-2 font-inter text-sm leading-6 text-[var(--color-text-secondary)]">
              {item.camera.description}
            </p>
          </div>

          <Link
            to={`/cameras/${item.camera.id}`}
            onClick={(event) => event.stopPropagation()}
            className="shrink-0 rounded-[16px] border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-4 py-2 font-inter text-xs font-bold text-[var(--color-text-primary)] transition hover:text-[var(--color-primary)]"
          >
            Открыть
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <SmallStat
            label="Угол"
            value={
              typeof item.camera.coverage?.fovDeg === 'number'
                ? `${item.camera.coverage.fovDeg}°`
                : '—'
            }
          />

          <SmallStat
            label="Направление"
            value={
              typeof item.camera.coverage?.directionDeg === 'number'
                ? `${item.camera.coverage.directionDeg}°`
                : '—'
            }
          />

          <SmallStat
            label="Дальность"
            value={
              typeof item.camera.coverage?.rangeMeters === 'number'
                ? `${item.camera.coverage.rangeMeters} м`
                : '—'
            }
          />
        </div>
      </div>
    </article>
  );
}

function CameraEventsPanel({ camera }: { camera: Camera }) {
  const [connectionStatus, setConnectionStatus] =
    useState<CameraEventsConnectionStatus>('idle');

  const [events, setEvents] = useState<CameraEvent[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [reconnectKey, setReconnectKey] = useState(0);

  const latestEvent = events[0] ?? null;

  const eventsTodayCount = useMemo(() => {
    const today = new Date().toDateString();

    return events.filter((event) => {
      return new Date(event.occurredAt).toDateString() === today;
    }).length;
  }, [events]);

  useEffect(() => {
    if (!camera.id) {
      return;
    }

    setEvents([]);
    setConnectionStatus('connecting');
    setConnectionError(null);

    const socket: Socket = io(CAMERA_EVENTS_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      setConnectionStatus('open');
      setConnectionError(null);

      socket.emit('subscribe.camera', {
        cameraId: camera.id,
      });
    });

    socket.on('camera.event', (event: CameraEvent) => {
      if (event.cameraId !== camera.id) {
        return;
      }

      setEvents((prev) => [event, ...prev].slice(0, 50));
    });

    socket.on('connect_error', (error) => {
      setConnectionStatus('error');
      setConnectionError(error.message);

      console.error(
        'Не удалось подключиться к WebSocket событий:',
        error.message,
      );
    });

    socket.on('disconnect', () => {
      setConnectionStatus('closed');
    });

    return () => {
      socket.emit('unsubscribe.camera', {
        cameraId: camera.id,
      });

      socket.disconnect();
    };
  }, [camera.id, reconnectKey]);

  return (
    <div className="overflow-hidden rounded-[34px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl shadow-[var(--color-shadow)]">
      <div className="relative overflow-hidden border-b border-[var(--color-border)] bg-[var(--color-bg-soft)] p-5">
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[var(--color-primary)]/20 blur-3xl" />
        <div className="absolute -bottom-20 left-8 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-inter text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                Camera Events
              </p>

              <h2 className="mt-1 line-clamp-2 text-xl font-extrabold text-[var(--color-text-primary)]">
                {camera.title}
              </h2>
            </div>

            <span
              className={[
                'shrink-0 rounded-full px-3 py-1 font-inter text-xs font-bold ring-1',
                getConnectionStatusClassName(connectionStatus),
              ].join(' ')}
            >
              {getConnectionStatusLabel(connectionStatus)}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-[22px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <p className="font-inter text-[10px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                Всего
              </p>

              <p className="mt-1 text-3xl font-black text-[var(--color-text-primary)]">
                {events.length}
              </p>
            </div>

            <div className="rounded-[22px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <p className="font-inter text-[10px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                Сегодня
              </p>

              <p className="mt-1 text-3xl font-black text-[var(--color-text-primary)]">
                {eventsTodayCount}
              </p>
            </div>
          </div>

          <div className="mt-3 rounded-[22px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <p className="font-inter text-[10px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
              Последнее событие
            </p>

            <p className="mt-1 font-inter text-sm font-extrabold text-[var(--color-text-primary)]">
              {latestEvent ? latestEvent.title : 'Пока нет событий'}
            </p>

            <p className="mt-1 font-inter text-xs text-[var(--color-text-secondary)]">
              {latestEvent ? formatDate(latestEvent.occurredAt) : '—'}
            </p>
          </div>

          <div className="mt-3 rounded-[20px] bg-[var(--color-surface)] p-4">
            <p className="font-inter text-[10px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
              Socket.IO endpoint
            </p>

            <p
              title={CAMERA_EVENTS_URL}
              className="mt-1 line-clamp-2 break-all font-inter text-xs font-semibold leading-5 text-[var(--color-text-secondary)]"
            >
              {CAMERA_EVENTS_URL}
            </p>
          </div>

          {connectionError && (
            <div className="mt-4 rounded-[20px] border border-red-500/20 bg-red-500/10 px-4 py-3 font-inter text-xs font-semibold leading-5 text-red-600">
              {connectionError}
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setReconnectKey((prev) => prev + 1)}
              className="h-10 flex-1 rounded-[16px] bg-[var(--color-primary)] px-4 font-inter text-xs font-extrabold text-[var(--color-secondary-text)] transition hover:scale-[1.01]"
            >
              Переподключиться
            </button>

            <button
              type="button"
              onClick={() => setEvents([])}
              className="h-10 rounded-[16px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 font-inter text-xs font-bold text-[var(--color-text-primary)] transition hover:text-red-500"
            >
              Очистить
            </button>
          </div>
        </div>
      </div>

      <div className="max-h-[620px] min-h-[380px] overflow-y-auto p-5">
        {events.length === 0 ? (
          <div className="flex min-h-[330px] flex-col items-center justify-center rounded-[26px] border border-dashed border-[var(--color-border)] bg-[var(--color-bg-soft)] px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary)]/15 text-[var(--color-primary)]">
              <EventPulseIcon />
            </div>

            <h3 className="mt-4 text-lg font-extrabold text-[var(--color-text-primary)]">
              Ждём события
            </h3>

            <p className="mt-2 font-inter text-sm leading-6 text-[var(--color-text-secondary)]">
              Подписались на выбранную камеру. Когда backend пришлёт
              camera.event, событие появится здесь.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <CameraEventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CameraEventCard({ event }: { event: CameraEvent }) {
  const confidenceLabel = getConfidenceLabel(event.confidence);
  const metadataEntries = getMetadataEntries(event.metadata);
  const eventImageUrl = createEventImageUrl(event.imageUrl);

  return (
    <article className="overflow-hidden rounded-[26px] border border-[var(--color-border)] bg-[var(--color-bg-soft)]">
      {eventImageUrl && (
        <div className="h-44 overflow-hidden bg-[#0F1318]">
          <img
            src={eventImageUrl}
            alt={event.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[var(--color-primary)]/15 px-3 py-1 font-inter text-[10px] font-extrabold uppercase tracking-wide text-[var(--color-primary)]">
                {getEventTypeLabel(event.type)}
              </span>

              {confidenceLabel && (
                <span className="rounded-full bg-blue-500/10 px-3 py-1 font-inter text-[10px] font-extrabold uppercase tracking-wide text-blue-600">
                  Confidence {confidenceLabel}
                </span>
              )}
            </div>

            <h3 className="mt-3 line-clamp-2 text-base font-extrabold text-[var(--color-text-primary)]">
              {event.title}
            </h3>

            <p className="mt-2 font-inter text-sm leading-6 text-[var(--color-text-secondary)]">
              {event.description ?? 'Описание события не передано'}
            </p>
          </div>

          <div className="shrink-0 rounded-2xl bg-[var(--color-surface)] px-3 py-2 text-right">
            <p className="font-inter text-[10px] font-bold uppercase text-[var(--color-text-muted)]">
              Время
            </p>

            <p className="mt-1 font-inter text-xs font-extrabold text-[var(--color-text-primary)]">
              {formatTime(event.occurredAt)}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <EventField label="ID события" value={event.id} />
          <EventField label="Создано" value={formatDate(event.createdAt)} />
        </div>

        {event.intersectionId && (
          <div className="mt-2">
            <EventField label="Intersection ID" value={event.intersectionId} />
          </div>
        )}

        {metadataEntries.length > 0 && (
          <div className="mt-4 rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <p className="font-inter text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
              Metadata
            </p>

            <div className="mt-3 space-y-2">
              {metadataEntries.map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-start justify-between gap-3 font-inter text-xs"
                >
                  <span className="font-bold text-[var(--color-text-muted)]">
                    {key}
                  </span>

                  <span className="max-w-[220px] break-words text-right font-semibold text-[var(--color-text-primary)]">
                    {typeof value === 'object'
                      ? getJsonString(value)
                      : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <details className="mt-4">
          <summary className="cursor-pointer font-inter text-xs font-bold text-[var(--color-primary)]">
            Полный JSON события
          </summary>

          <pre className="mt-3 max-h-60 overflow-auto rounded-[18px] bg-[#0F1318] p-4 text-xs leading-5 text-white">
            {getJsonString(event)}
          </pre>
        </details>
      </div>
    </article>
  );
}

function EventField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] bg-[var(--color-surface)] px-3 py-2">
      <p className="font-inter text-[10px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
        {label}
      </p>

      <p
        title={value}
        className="mt-1 line-clamp-2 break-all font-inter text-xs font-semibold text-[var(--color-text-secondary)]"
      >
        {value}
      </p>
    </div>
  );
}

function IntersectionMiniView({
  onlineCamerasCount,
  camerasCount,
}: {
  onlineCamerasCount: number;
  camerasCount: number;
}) {
  return (
    <div className="relative h-56 overflow-hidden rounded-[30px] border border-[var(--color-border)] bg-[#141922] shadow-inner">
      <div className="absolute left-1/2 top-0 h-full w-[84px] -translate-x-1/2 bg-[#2A303A]">
        <div className="absolute left-1/2 top-0 h-full w-1 -translate-x-1/2 bg-yellow-300/60" />
        <div className="absolute left-[20px] top-0 h-full w-px bg-white/15" />
        <div className="absolute right-[20px] top-0 h-full w-px bg-white/15" />
      </div>

      <div className="absolute left-0 top-1/2 h-[84px] w-full -translate-y-1/2 bg-[#2A303A]">
        <div className="absolute left-0 top-1/2 h-1 w-full -translate-y-1/2 bg-yellow-300/60" />
        <div className="absolute left-0 top-[20px] h-px w-full bg-white/15" />
        <div className="absolute bottom-[20px] left-0 h-px w-full bg-white/15" />
      </div>

      <div className="absolute left-1/2 top-1/2 z-10 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[28px] border border-yellow-300/60 bg-[var(--color-primary)] text-[var(--color-secondary-text)] shadow-[0_0_0_12px_rgba(255,210,30,0.16),0_20px_45px_rgba(0,0,0,0.35)]">
        <IntersectionIcon />
      </div>

      <div className="absolute right-4 top-4 rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-right backdrop-blur-xl">
        <p className="font-inter text-[10px] font-bold uppercase text-white/60">
          Камеры
        </p>

        <p className="text-lg font-black text-white">
          {onlineCamerasCount}/{camerasCount}
        </p>
      </div>

      <CameraDot className="left-[22%] top-[39%]" isOnline={onlineCamerasCount > 0} />
      <CameraDot className="right-[24%] top-[39%]" isOnline={onlineCamerasCount > 1} />
      <CameraDot className="bottom-[24%] left-[44%]" isOnline={onlineCamerasCount > 2} />
      <CameraDot className="right-[42%] top-[18%]" isOnline={onlineCamerasCount > 3} />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-white/5" />
    </div>
  );
}

function CameraDot({
  className,
  isOnline,
}: {
  className: string;
  isOnline: boolean;
}) {
  return (
    <span
      className={[
        'absolute z-20 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#141922] shadow-lg',
        isOnline ? 'bg-green-500' : 'bg-white',
        className,
      ].join(' ')}
    >
      <span
        className={[
          'h-2.5 w-2.5 rounded-full',
          isOnline ? 'bg-white' : 'bg-red-500',
        ].join(' ')}
      />
    </span>
  );
}

function IntersectionIcon() {
  return (
    <svg
      className="h-9 w-9"
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
      className="h-8 w-8"
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

function EventPulseIcon() {
  return (
    <svg
      className="h-7 w-7"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 12h3l2-6 4 12 2-6h5" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-4 py-2 font-inter text-xs font-bold text-[var(--color-text-primary)]">
      {label}
    </span>
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
    <div className="rounded-[24px] bg-[var(--color-bg-soft)] p-5">
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

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] bg-[var(--color-bg-soft)] px-3 py-2">
      <p className="font-inter text-[10px] font-bold uppercase text-[var(--color-text-muted)]">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-extrabold text-[var(--color-text-primary)]">
        {value}
      </p>
    </div>
  );
}