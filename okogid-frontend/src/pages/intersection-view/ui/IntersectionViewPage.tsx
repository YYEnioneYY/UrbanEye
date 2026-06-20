import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';

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

  return possibleUrls.find(
    (value): value is string => typeof value === 'string' && value.length > 0,
  ) ?? null;
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

export function IntersectionViewPage() {
  const { intersectionId } = useParams<{ intersectionId: string }>();

  const [pageState, setPageState] = useState<PageState>({
    intersection: null,
    streams: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const intersection = pageState.intersection;
  const streams = pageState.streams;

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

        setPageState({
          intersection: data.intersection,
          streams: data.streams,
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
      <div className="mx-auto max-w-[1600px]">

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

            <section className="mt-6">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-3xl font-black text-[var(--color-text-primary)]">
                    Камеры перекрёстка
                  </h2>
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
                <div
                  className={[
                    'grid gap-5',
                    streams.length === 1
                      ? 'grid-cols-1'
                      : 'lg:grid-cols-2',
                    streams.length >= 3 ? '2xl:grid-cols-3' : '',
                  ].join(' ')}
                >
                  {streams.map((item) => (
                    <StreamCard key={item.camera.id} item={item} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function StreamCard({ item }: { item: IntersectionStreamItem }) {
  const playerUrl = getStreamPlayerUrl(item.stream);
  const canPlay = item.available && Boolean(playerUrl);

  return (
    <article className="overflow-hidden rounded-[34px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl shadow-[var(--color-shadow)]">
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
            className="shrink-0 rounded-[16px] border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-4 py-2 font-inter text-xs font-bold text-[var(--color-text-primary)] transition hover:text-[var(--color-primary)]"
          >
            Камера
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <SmallStat label="Угол" value={`${item.camera.coverage?.fovDeg ?? '—'}°`} />
          <SmallStat
            label="Направление"
            value={`${item.camera.coverage?.directionDeg ?? '—'}°`}
          />
          <SmallStat
            label="Дальность"
            value={
              item.camera.coverage?.rangeMeters
                ? `${item.camera.coverage.rangeMeters} м`
                : '—'
            }
          />
        </div>
      </div>
    </article>
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