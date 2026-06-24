import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { io, type Socket } from 'socket.io-client';

import type { Camera } from '../../../entities/camera/model/types';
import type { CameraStream } from '../../../entities/stream/model/types';
import { getCameraStreamByCameraId } from '../../../entities/stream/api/streamsApi';
import { CameraPlayer } from '../../../features/camera-player/ui/CameraPlayer';

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

function getStatusLabel(status: Camera['status']) {
  if (status === 'online') return 'Онлайн';
  if (status === 'offline') return 'Офлайн';
  if (status === 'maintenance') return 'Обслуживание';
  if (status === 'planned') return 'Запланирована';

  return status;
}

function getStatusClassName(status: Camera['status']) {
  if (status === 'online') {
    return 'bg-green-500/10 text-green-700 ring-green-500/20';
  }

  if (status === 'offline') {
    return 'bg-red-500/10 text-red-700 ring-red-500/20';
  }

  if (status === 'maintenance') {
    return 'bg-yellow-500/10 text-yellow-700 ring-yellow-500/20';
  }

  return 'bg-blue-500/10 text-blue-700 ring-blue-500/20';
}

function getCategoryLabel(category: string) {
  const categories: Record<string, string> = {
    landmark: 'Достопримечательность',
    history: 'История',
    modern: 'Современное место',
    traffic: 'Трафик',
  };

  return categories[category] ?? category;
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

function formatMeters(value?: number) {
  if (typeof value !== 'number') return '—';

  if (value < 1000) {
    return `${Math.round(value)} м`;
  }

  return `${(value / 1000).toFixed(1)} км`;
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

function MapPinIcon() {
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
      <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function CameraIcon() {
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
      <path d="M4 8h10a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z" />
      <path d="m17 12 5-3v10l-5-3" />
      <path d="M7 8l1.5-3h4L14 8" />
    </svg>
  );
}

function StreamIcon() {
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
      <path d="M6 9a6 6 0 0 1 12 0" />
      <path d="M9 12a3 3 0 0 1 6 0" />
      <path d="M12 15h.01" />
      <path d="M4 17h16" />
      <path d="M7 21h10" />
    </svg>
  );
}

function EyeIcon() {
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
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EventPulseIcon() {
  return (
    <svg
      className="h-6 w-6"
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

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-[var(--color-bg-soft)] p-4">
      <span className="mt-0.5 text-[var(--color-primary)]">{icon}</span>

      <div className="min-w-0">
        <p className="text-sm font-bold text-[var(--color-text-primary)]">
          {label}
        </p>

        <p className="mt-1 break-words font-inter text-sm text-[var(--color-text-secondary)]">
          {value}
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-[var(--color-border)] bg-[var(--color-surface-solid)] p-4">
      <p className="font-inter text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
        {label}
      </p>

      <p className="mt-2 text-xl font-extrabold text-[var(--color-text-primary)]">
        {value}
      </p>
    </div>
  );
}

function CameraEventsPanel({ cameraId }: { cameraId: string }) {
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
    if (!cameraId) {
      return;
    }

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
        cameraId,
      });
    });

    socket.on('camera.event', (event: CameraEvent) => {
      if (event.cameraId !== cameraId) {
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
        cameraId,
      });

      socket.disconnect();
    };
  }, [cameraId, reconnectKey]);

  return (
    <div className="overflow-hidden rounded-[32px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl shadow-[var(--color-shadow)] backdrop-blur-2xl">
      <div className="relative overflow-hidden border-b border-[var(--color-border)] bg-[var(--color-bg-soft)] p-5">
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[var(--color-primary)]/20 blur-3xl" />
        <div className="absolute -bottom-20 left-8 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-inter text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                Camera Events
              </p>

              <h2 className="mt-1 text-xl font-extrabold text-[var(--color-text-primary)]">
                События камеры
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
                Всего событий
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
              После подключения клиент отправляет subscribe.camera. Когда
              backend пришлёт camera.event, событие появится здесь.
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

  return (
    <article className="overflow-hidden rounded-[26px] border border-[var(--color-border)] bg-[var(--color-bg-soft)]">
      {event.imageUrl && (
        <div className="h-44 overflow-hidden bg-[#0F1318]">
          <img
            src={event.imageUrl}
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

export function CameraViewPage() {
  const { cameraId } = useParams<{ cameraId: string }>();

  const [camera, setCamera] = useState<Camera | null>(null);
  const [stream, setStream] = useState<CameraStream | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cameraId) {
      setError('ID камеры не указан');
      setIsLoading(false);
      return;
    }

    const currentCameraId = cameraId;
    const abortController = new AbortController();

    async function loadCameraStream() {
      try {
        setIsLoading(true);
        setError(null);

        const data = await getCameraStreamByCameraId(
          currentCameraId,
          abortController.signal,
        );

        if (abortController.signal.aborted) {
          return;
        }

        setCamera(data.camera);
        setStream(data.stream);
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : 'Не удалось загрузить камеру';

        setError(message);
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadCameraStream();

    return () => {
      abortController.abort();
    };
  }, [cameraId]);

  if (isLoading) {
    return (
      <section className="min-h-screen px-4 py-24 md:px-8 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[36px] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-2xl shadow-[var(--color-shadow)] backdrop-blur-2xl">
            <p className="font-inter text-sm font-semibold text-[var(--color-text-secondary)]">
              Загружаем камеру и поток...
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (error || !camera) {
    return (
      <section className="flex min-h-screen items-center justify-center px-4 py-20">
        <div className="max-w-md rounded-[32px] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center shadow-2xl shadow-[var(--color-shadow)] backdrop-blur-2xl">
          <p className="text-sm font-bold uppercase tracking-wide text-[var(--color-primary)]">
            Камера недоступна
          </p>

          <h1 className="mt-3 text-3xl font-extrabold text-[var(--color-text-primary)]">
            Не удалось открыть камеру
          </h1>

          <p className="mt-3 font-inter text-sm leading-6 text-[var(--color-text-secondary)]">
            {error ||
              'Возможно, камера была удалена или ссылка указана неверно.'}
          </p>

          <Link
            to="/map"
            className="mt-6 inline-flex h-12 items-center justify-center rounded-[18px] bg-[var(--button-third-bg)] px-6 text-sm font-bold text-[var(--button-third-text)] transition hover:scale-[1.02] hover:bg-[var(--button-third-hover)]"
          >
            Вернуться на карту
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen px-4 py-24 md:px-8 md:py-28">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-8">
          <div className="inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-text-secondary)] shadow-sm backdrop-blur-xl">
            Просмотр камеры
          </div>

          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="max-w-4xl text-4xl font-extrabold leading-tight tracking-tight text-[var(--color-text-primary)] md:text-6xl">
                {camera.title}
              </h1>

              <p className="mt-4 max-w-2xl font-inter text-base leading-7 text-[var(--color-text-secondary)]">
                {camera.description}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span
                className={[
                  'inline-flex w-fit rounded-full px-4 py-2 text-sm font-bold ring-1',
                  getStatusClassName(camera.status),
                ].join(' ')}
              >
                {getStatusLabel(camera.status)}
              </span>

              <span className="inline-flex w-fit rounded-full bg-[var(--color-surface)] px-4 py-2 text-sm font-bold text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)]">
                {getCategoryLabel(camera.category)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_500px]">
          <div className="space-y-5">
            <CameraPlayer stream={stream} title={camera.title} />

            <div className="grid gap-4 md:grid-cols-4">
              <StatCard
                label="Просмотры"
                value={String(camera.viewsCount ?? 0)}
              />

              <StatCard
                label="Дальность"
                value={formatMeters(camera.coverage?.rangeMeters)}
              />

              <StatCard
                label="Угол обзора"
                value={
                  typeof camera.coverage?.fovDeg === 'number'
                    ? `${camera.coverage.fovDeg}°`
                    : '—'
                }
              />

              <StatCard
                label="Направление"
                value={
                  typeof camera.coverage?.directionDeg === 'number'
                    ? `${camera.coverage.directionDeg}°`
                    : '—'
                }
              />
            </div>
          </div>

          <aside className="space-y-4">
            <CameraEventsPanel cameraId={camera.id} />

            <div className="rounded-[32px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-xl shadow-[var(--color-shadow)] backdrop-blur-2xl">
              <h2 className="text-xl font-extrabold text-[var(--color-text-primary)]">
                О камере
              </h2>

              <div className="mt-5 space-y-3">
                <InfoCard
                  icon={<CameraIcon />}
                  label="Тип камеры"
                  value="IP-камера"
                />

                <InfoCard
                  icon={<MapPinIcon />}
                  label="Адрес"
                  value={`${camera.city}, ${camera.address}`}
                />

                <InfoCard
                  icon={<MapPinIcon />}
                  label="Координаты"
                  value={`${camera.latitude.toFixed(4)}, ${camera.longitude.toFixed(4)}`}
                />

                <InfoCard
                  icon={<EyeIcon />}
                  label="Область видимости"
                  value={`${formatMeters(camera.coverage?.rangeMeters)} · ${camera.coverage?.fovDeg ?? '—'}°`}
                />

                <InfoCard
                  icon={<StreamIcon />}
                  label="Поток"
                  value={
                    stream
                      ? `${stream.type.toUpperCase()} · ${stream.path}`
                      : 'Недоступен'
                  }
                />
              </div>
            </div>

            <div className="rounded-[32px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-xl shadow-[var(--color-shadow)] backdrop-blur-2xl">
              <h2 className="text-xl font-extrabold text-[var(--color-text-primary)]">
                Информация
              </h2>

              <div className="mt-4 space-y-3">
                <div>
                  <p className="font-inter text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                    Создано
                  </p>

                  <p className="mt-1 font-inter text-sm font-semibold text-[var(--color-text-secondary)]">
                    {formatDate(camera.createdAt)}
                  </p>
                </div>

                <div>
                  <p className="font-inter text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                    Обновлено
                  </p>

                  <p className="mt-1 font-inter text-sm font-semibold text-[var(--color-text-secondary)]">
                    {formatDate(camera.updatedAt)}
                  </p>
                </div>
              </div>

              <Link
                to="/map"
                className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-[16px] border border-[var(--color-border)] bg-[var(--color-surface-solid)] px-5 text-sm font-bold text-[var(--color-text-primary)] transition hover:scale-[1.01] hover:text-[var(--color-primary)]"
              >
                Показать на карте
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}