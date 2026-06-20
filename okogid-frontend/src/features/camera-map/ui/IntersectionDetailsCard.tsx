import { Link } from 'react-router';

import type { Intersection } from '../../../entities/intersection/model/types';

type IntersectionDetailsCardProps = {
  intersection: Intersection | null;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
};

function getIntersectionParts(title?: string) {
  if (!title) {
    return {
      firstRoad: 'Улица',
      secondRoad: 'Проспект',
    };
  }

  const parts = title
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    firstRoad: parts[0] ?? title,
    secondRoad: parts[1] ?? 'Перекрёсток',
  };
}

function getOnlinePercent(intersection: Intersection) {
  if (intersection.camerasCount <= 0) {
    return 0;
  }

  return Math.round(
    (intersection.onlineCamerasCount / intersection.camerasCount) * 100,
  );
}

export function IntersectionDetailsCard({
  intersection,
  isLoading,
  error,
  onClose,
}: IntersectionDetailsCardProps) {
  if (!intersection && !isLoading && !error) {
    return null;
  }

  const { firstRoad, secondRoad } = getIntersectionParts(intersection?.title);
  const onlinePercent = intersection ? getOnlinePercent(intersection) : 0;

  return (
    <aside className="absolute right-4 top-12 z-30 flex max-h-[calc(100vh-32px)] w-[calc(100%-32px)] max-w-[430px] flex-col overflow-hidden rounded-[34px] border border-[var(--color-border)] bg-[var(--navbar-bg)] shadow-2xl shadow-[var(--color-shadow)] backdrop-blur-2xl md:top-8">
      <div className="relative shrink-0 overflow-hidden border-b border-[var(--color-border)] bg-[var(--color-bg-soft)]">
        <div className="absolute inset-0 opacity-80">
          <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[var(--color-primary)]/25 blur-3xl" />
          <div className="absolute -bottom-20 left-8 h-44 w-44 rounded-full bg-blue-500/10 blur-3xl" />
        </div>

        <div className="relative p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-inter text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                Умный перекрёсток
              </p>

              <h3 className="mt-1 line-clamp-2 text-2xl font-black leading-tight text-[var(--color-text-primary)]">
                {intersection?.title ?? 'Загрузка...'}
              </h3>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-xl font-bold text-[var(--color-text-secondary)] transition hover:scale-105 hover:text-red-500"
              aria-label="Закрыть"
            >
              ×
            </button>
          </div>

          <IntersectionPreview
            firstRoad={firstRoad}
            secondRoad={secondRoad}
            camerasCount={intersection?.camerasCount ?? 0}
            onlineCamerasCount={intersection?.onlineCamerasCount ?? 0}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {isLoading && (
          <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-5 font-inter text-sm font-semibold text-[var(--color-text-secondary)]">
            Загружаем данные перекрёстка...
          </div>
        )}

        {error && (
          <div className="rounded-[24px] border border-red-500/20 bg-red-500/10 px-4 py-3 font-inter text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

        {intersection && !isLoading && (
          <>
            <p className="font-inter text-sm leading-6 text-[var(--color-text-secondary)]">
              {intersection.description}
            </p>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <InfoBlock label="Камер" value={intersection.camerasCount} />

              <InfoBlock
                label="Онлайн"
                value={intersection.onlineCamerasCount}
                accent={intersection.onlineCamerasCount > 0}
              />

              <InfoBlock label="Доступно" value={`${onlinePercent}%`} />
            </div>

            <div className="mt-4 rounded-[24px] border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-4">
              <p className="font-inter text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                Адрес
              </p>

              <p className="mt-2 font-inter text-sm font-extrabold leading-6 text-[var(--color-text-primary)]">
                {intersection.address}
              </p>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <SmallInfo label="Город" value={intersection.city} />
              <SmallInfo label="Категория" value={intersection.category} />
            </div>

            <div className="mt-3 rounded-[24px] border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-4">
              <p className="font-inter text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                Координаты
              </p>

              <p className="mt-2 font-inter text-sm font-extrabold text-[var(--color-text-primary)]">
                {intersection.latitude.toFixed(5)}, {intersection.longitude.toFixed(5)}
              </p>
            </div>

            <Link
              to={`/intersections/${intersection.id}`}
              className="mt-5 flex h-12 w-full items-center justify-center rounded-[18px] bg-[var(--color-primary)] px-5 font-inter text-sm font-extrabold text-[var(--color-secondary-text)] transition hover:scale-[1.02]"
            >
              Открыть перекрёсток
            </Link>
          </>
        )}
      </div>
    </aside>
  );
}

function IntersectionPreview({
  firstRoad,
  secondRoad,
  camerasCount,
  onlineCamerasCount,
}: {
  firstRoad: string;
  secondRoad: string;
  camerasCount: number;
  onlineCamerasCount: number;
}) {
  return (
    <div className="relative mt-5 h-56 overflow-hidden rounded-[30px] border border-[var(--color-border)] bg-[#11161D] shadow-inner">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.04),transparent_60%)]" />

      <div className="absolute left-1/2 top-0 h-full w-[92px] -translate-x-1/2 bg-[#2B313B] shadow-[0_0_50px_rgba(0,0,0,0.35)]">
        <div className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 bg-yellow-300/70" />
        <div className="absolute left-[24px] top-0 h-full w-px bg-white/15" />
        <div className="absolute right-[24px] top-0 h-full w-px bg-white/15" />
      </div>

      <div className="absolute left-0 top-1/2 h-[92px] w-full -translate-y-1/2 bg-[#2B313B] shadow-[0_0_50px_rgba(0,0,0,0.35)]">
        <div className="absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 bg-yellow-300/70" />
        <div className="absolute left-0 top-[24px] h-px w-full bg-white/15" />
        <div className="absolute bottom-[24px] left-0 h-px w-full bg-white/15" />
      </div>

      <div className="absolute left-1/2 top-1/2 z-10 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[28px] border border-yellow-300/60 bg-[var(--color-primary)] text-[var(--color-secondary-text)] shadow-[0_0_0_12px_rgba(255,210,30,0.18),0_25px_55px_rgba(0,0,0,0.42)]">
        <IntersectionIcon />
      </div>

      <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 font-inter text-[11px] font-extrabold text-white backdrop-blur-xl">
        {firstRoad}
      </div>

      <div className="absolute bottom-4 right-4 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 font-inter text-[11px] font-extrabold text-white backdrop-blur-xl">
        {secondRoad}
      </div>

      <div className="absolute right-4 top-4 rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-right backdrop-blur-xl">
        <p className="font-inter text-[10px] font-bold uppercase text-white/60">
          Камеры
        </p>

        <p className="text-lg font-black text-white">
          {onlineCamerasCount}/{camerasCount}
        </p>
      </div>

      <TrafficLight className="left-[16%] top-[18%]" />
      <TrafficLight className="right-[16%] top-[18%]" />
      <TrafficLight className="left-[16%] bottom-[18%]" />
      <TrafficLight className="right-[16%] bottom-[18%]" />

      <CameraDot className="left-[23%] top-[38%]" isOnline={onlineCamerasCount > 0} />
      <CameraDot className="right-[23%] top-[38%]" isOnline={onlineCamerasCount > 1} />
      <CameraDot className="left-[43%] bottom-[20%]" isOnline={onlineCamerasCount > 2} />
      <CameraDot className="right-[43%] top-[20%]" isOnline={onlineCamerasCount > 3} />

      <div className="absolute left-1/2 top-[22px] z-10 flex -translate-x-1/2 gap-1">
        <CrosswalkStripe />
        <CrosswalkStripe />
        <CrosswalkStripe />
        <CrosswalkStripe />
      </div>

      <div className="absolute bottom-[22px] left-1/2 z-10 flex -translate-x-1/2 gap-1">
        <CrosswalkStripe />
        <CrosswalkStripe />
        <CrosswalkStripe />
        <CrosswalkStripe />
      </div>

      <div className="absolute left-[22px] top-1/2 z-10 flex -translate-y-1/2 flex-col gap-1">
        <CrosswalkStripe vertical />
        <CrosswalkStripe vertical />
        <CrosswalkStripe vertical />
        <CrosswalkStripe vertical />
      </div>

      <div className="absolute right-[22px] top-1/2 z-10 flex -translate-y-1/2 flex-col gap-1">
        <CrosswalkStripe vertical />
        <CrosswalkStripe vertical />
        <CrosswalkStripe vertical />
        <CrosswalkStripe vertical />
      </div>

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
      title={isOnline ? 'Камера онлайн' : 'Камера офлайн'}
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

function TrafficLight({ className }: { className: string }) {
  return (
    <span
      className={[
        'absolute z-20 flex h-8 w-4 flex-col items-center justify-center gap-[2px] rounded-full bg-black/55 p-[3px] shadow-lg',
        className,
      ].join(' ')}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
      <span className="h-1.5 w-1.5 rounded-full bg-yellow-300" />
      <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
    </span>
  );
}

function CrosswalkStripe({ vertical = false }: { vertical?: boolean }) {
  return (
    <span
      className={[
        'rounded-sm bg-white/80',
        vertical ? 'h-3 w-1.5' : 'h-1.5 w-3',
      ].join(' ')}
    />
  );
}

function IntersectionIcon() {
  return (
    <svg
      className="h-8 w-8"
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

function InfoBlock({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number | string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-[20px] bg-[var(--color-bg-soft)] p-4">
      <p className="font-inter text-[10px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
        {label}
      </p>

      <p
        className={[
          'mt-1 text-xl font-extrabold',
          accent ? 'text-green-600' : 'text-[var(--color-text-primary)]',
        ].join(' ')}
      >
        {value}
      </p>
    </div>
  );
}

function SmallInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] bg-[var(--color-bg-soft)] p-4">
      <p className="font-inter text-[10px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
        {label}
      </p>

      <p className="mt-1 truncate font-inter text-sm font-extrabold text-[var(--color-text-primary)]">
        {value}
      </p>
    </div>
  );
}