import { useEffect, useMemo, useState } from 'react';

import {
  adminServiceStatusConfigs,
  getAdminServiceStatus,
  type AdminServiceStatusConfig,
} from '../../../entities/service-status/api/adminServiceStatusApi';
import type { ServiceStatus } from '../../../entities/service-status/model/types';

type ServiceStatusResult = {
  config: AdminServiceStatusConfig;
  data: ServiceStatus | null;
  error: string | null;
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

function formatUptime(seconds: number) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}д ${hours}ч ${minutes}м`;
  }

  if (hours > 0) {
    return `${hours}ч ${minutes}м`;
  }

  return `${minutes}м`;
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function getMemoryUsagePercent(status: ServiceStatus) {
  if (!status.system.totalMemoryMb) {
    return 0;
  }

  const usedMemory = status.system.totalMemoryMb - status.system.freeMemoryMb;

  return Math.min(100, Math.max(0, (usedMemory / status.system.totalMemoryMb) * 100));
}

function getHeapUsagePercent(status: ServiceStatus) {
  if (!status.memory.heapTotalMb) {
    return 0;
  }

  return Math.min(100, Math.max(0, (status.memory.heapUsedMb / status.memory.heapTotalMb) * 100));
}

function getStatusLabel(status: string) {
  if (status === 'ok') return 'Работает';
  if (status === 'warning') return 'Предупреждение';
  if (status === 'offline') return 'Недоступен';
  if (status === 'error') return 'Ошибка';

  return status;
}

function getStatusClassName(status: string) {
  if (status === 'ok') {
    return 'bg-green-500/10 text-green-600 ring-green-500/20';
  }

  if (status === 'warning') {
    return 'bg-yellow-500/10 text-yellow-600 ring-yellow-500/20';
  }

  return 'bg-red-500/10 text-red-600 ring-red-500/20';
}

function ServerIcon() {
  return (
    <svg
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="4" width="16" height="6" rx="2" />
      <rect x="4" y="14" width="16" height="6" rx="2" />
      <path d="M8 7h.01" />
      <path d="M8 17h.01" />
      <path d="M12 7h4" />
      <path d="M12 17h4" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 0 1-15.5 6.3L3 16" />
      <path d="M3 16v5h5" />
      <path d="M3 12A9 9 0 0 1 18.5 5.7L21 8" />
      <path d="M21 8V3h-5" />
    </svg>
  );
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-[22px] border border-[var(--color-border)] bg-[var(--color-surface-solid)] p-4">
      <p className="font-inter text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
        {label}
      </p>

      <p className="mt-2 text-xl font-extrabold text-[var(--color-text-primary)]">
        {value}
      </p>

      {hint && (
        <p className="mt-1 font-inter text-xs text-[var(--color-text-secondary)]">
          {hint}
        </p>
      )}
    </div>
  );
}

function ProgressMetric({
  label,
  value,
  percent,
}: {
  label: string;
  value: string;
  percent: number;
}) {
  return (
    <div className="rounded-[22px] border border-[var(--color-border)] bg-[var(--color-surface-solid)] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-inter text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
          {label}
        </p>

        <p className="font-inter text-xs font-bold text-[var(--color-text-secondary)]">
          {formatPercent(percent)}
        </p>
      </div>

      <p className="mt-2 text-xl font-extrabold text-[var(--color-text-primary)]">
        {value}
      </p>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--color-bg-soft)]">
        <div
          className="h-full rounded-full bg-[var(--color-primary)]"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function ServiceStatusCard({ result }: { result: ServiceStatusResult }) {
  const { config, data, error } = result;

  if (error || !data) {
    return (
      <article className="rounded-[34px] border border-red-500/20 bg-red-500/10 p-6 shadow-xl shadow-[var(--color-shadow)] backdrop-blur-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-[var(--color-text-primary)]">
              {config.title}
            </h2>

            <p className="mt-2 font-inter text-sm leading-6 text-[var(--color-text-secondary)]">
              {config.description}
            </p>
          </div>

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-600">
            <ServerIcon />
          </div>
        </div>

        <div className="mt-6 rounded-[22px] border border-red-500/20 bg-[var(--color-surface-solid)] p-4 font-inter text-sm font-semibold text-red-600">
          {error || 'Не удалось получить статус сервиса'}
        </div>
      </article>
    );
  }

  const memoryPercent = getMemoryUsagePercent(data);
  const heapPercent = getHeapUsagePercent(data);

  return (
    <article className="rounded-[34px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xl shadow-[var(--color-shadow)] backdrop-blur-2xl">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-[var(--color-primary-text)]">
              <ServerIcon />
            </div>

            <div>
              <h2 className="text-2xl font-extrabold text-[var(--color-text-primary)]">
                {config.title}
              </h2>

              <p className="mt-1 font-inter text-sm text-[var(--color-text-secondary)]">
                {data.service}
              </p>
            </div>
          </div>

          <p className="mt-4 max-w-2xl font-inter text-sm leading-6 text-[var(--color-text-secondary)]">
            {config.description}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={[
              'inline-flex rounded-full px-4 py-2 font-inter text-sm font-bold ring-1',
              getStatusClassName(data.status),
            ].join(' ')}
          >
            {getStatusLabel(data.status)}
          </span>

          <span className="inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-4 py-2 font-inter text-sm font-bold text-[var(--color-text-secondary)]">
            {formatUptime(data.uptimeSeconds)}
          </span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="PID"
          value={String(data.process.pid)}
          hint={`${data.process.platform} / ${data.process.arch}`}
        />

        <MetricCard
          label="Node.js"
          value={data.process.nodeVersion}
          hint={data.process.environment}
        />

        <MetricCard
          label="CPU cores"
          value={String(data.system.cpuCount)}
          hint={`load 1m: ${data.system.loadAverage.oneMinute}`}
        />

        <MetricCard
          label="Event loop"
          value={`${data.eventLoop.meanDelayMs} ms`}
          hint={`max: ${data.eventLoop.maxDelayMs} ms`}
        />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <ProgressMetric
          label="Memory"
          value={`${Math.round(data.system.totalMemoryMb - data.system.freeMemoryMb)} / ${Math.round(data.system.totalMemoryMb)} MB`}
          percent={memoryPercent}
        />

        <ProgressMetric
          label="Heap"
          value={`${data.memory.heapUsedMb.toFixed(1)} / ${data.memory.heapTotalMb.toFixed(1)} MB`}
          percent={heapPercent}
        />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <MetricCard
          label="RSS"
          value={`${data.memory.rssMb.toFixed(1)} MB`}
          hint="resident set size"
        />

        <MetricCard
          label="External"
          value={`${data.memory.externalMb.toFixed(1)} MB`}
          hint={`buffers: ${data.memory.arrayBuffersMb.toFixed(1)} MB`}
        />

        <MetricCard
          label="CPU time"
          value={`${Math.round((data.cpu.userMicroseconds + data.cpu.systemMicroseconds) / 1000)} ms`}
          hint={`user: ${Math.round(data.cpu.userMicroseconds / 1000)} ms`}
        />
      </div>

      <p className="mt-5 font-inter text-xs text-[var(--color-text-secondary)]">
        Последняя проверка: {formatDate(data.timestamp)}
      </p>
    </article>
  );
}

export function AdminServicesPage() {
  const [results, setResults] = useState<ServiceStatusResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  const okCount = useMemo(
    () => results.filter((item) => item.data?.status === 'ok').length,
    [results],
  );

  const errorCount = useMemo(
    () => results.filter((item) => item.error || item.data?.status !== 'ok').length,
    [results],
  );

  const loadStatuses = async () => {
    const abortController = new AbortController();

    try {
      setIsLoading(true);

      const loadedResults = await Promise.all(
        adminServiceStatusConfigs.map(async (config) => {
          try {
            const data = await getAdminServiceStatus(
              config,
              abortController.signal,
            );

            return {
              config,
              data,
              error: null,
            };
          } catch (error) {
            const message =
              error instanceof Error
                ? error.message
                : 'Не удалось получить статус сервиса';

            return {
              config,
              data: null,
              error: message,
            };
          }
        }),
      );

      setResults(loadedResults);
      setLastUpdatedAt(new Date());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStatuses();
  }, []);

  return (
    <section>
      <div className="mb-8">

        <div className="mt-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl">
              Статусы сервисов
            </h1>

          </div>

          <button
            type="button"
            onClick={loadStatuses}
            disabled={isLoading}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-[18px] bg-[var(--button-third-bg)] px-5 text-sm font-bold text-[var(--button-third-text)] transition hover:scale-[1.02] hover:bg-[var(--button-third-hover)] disabled:cursor-wait disabled:opacity-70"
          >
            <RefreshIcon />
            {isLoading ? 'Обновляем...' : 'Обновить'}
          </button>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-xl shadow-[var(--color-shadow)] backdrop-blur-2xl">
          <p className="font-inter text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
            Всего сервисов
          </p>

          <p className="mt-2 text-4xl font-extrabold text-[var(--color-text-primary)]">
            {adminServiceStatusConfigs.length}
          </p>
        </div>

        <div className="rounded-[28px] border border-green-500/20 bg-green-500/10 p-5 shadow-xl shadow-[var(--color-shadow)] backdrop-blur-2xl">
          <p className="font-inter text-xs font-bold uppercase tracking-wide text-green-600">
            Работают
          </p>

          <p className="mt-2 text-4xl font-extrabold text-green-600">
            {okCount}
          </p>
        </div>

        <div className="rounded-[28px] border border-red-500/20 bg-red-500/10 p-5 shadow-xl shadow-[var(--color-shadow)] backdrop-blur-2xl">
          <p className="font-inter text-xs font-bold uppercase tracking-wide text-red-600">
            Ошибки
          </p>

          <p className="mt-2 text-4xl font-extrabold text-red-600">
            {errorCount}
          </p>
        </div>
      </div>

      {lastUpdatedAt && (
        <p className="mb-5 font-inter text-sm text-[var(--color-text-secondary)]">
          Последнее обновление: {formatDate(lastUpdatedAt.toISOString())}
        </p>
      )}

      <div className="grid gap-5">
        {isLoading && results.length === 0 ? (
          <div className="rounded-[34px] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-xl shadow-[var(--color-shadow)] backdrop-blur-2xl">
            <p className="font-inter text-sm font-semibold text-[var(--color-text-secondary)]">
              Загружаем статусы сервисов...
            </p>
          </div>
        ) : (
          results.map((result) => (
            <ServiceStatusCard key={result.config.id} result={result} />
          ))
        )}
      </div>
    </section>
  );
}