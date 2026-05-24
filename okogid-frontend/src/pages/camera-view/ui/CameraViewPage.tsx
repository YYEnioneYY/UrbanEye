import { Link, useParams } from 'react-router';

import { mockCameras } from '../../../entities/camera/model/mockCameras';
import type { Camera } from '../../../entities/camera/model/types';
import { CameraPlayer } from '../../../features/camera-player/ui/CameraPlayer';

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

export function CameraViewPage() {
  const { cameraId } = useParams();

  const camera = mockCameras.find((item) => item.id === cameraId);

  if (!camera) {
    return (
      <section className="flex min-h-screen items-center justify-center px-4 py-20">
        <div className="max-w-md rounded-[32px] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center shadow-2xl shadow-[var(--color-shadow)] backdrop-blur-2xl">
          <p className="text-sm font-bold uppercase tracking-wide text-[var(--color-primary)]">
            Камера не найдена
          </p>

          <h1 className="mt-3 text-3xl font-extrabold text-[var(--color-text-primary)]">
            Такой камеры нет
          </h1>

          <p className="mt-3 font-inter text-sm leading-6 text-[var(--color-text-secondary)]">
            Возможно, камера была удалена или ссылка указана неверно.
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
      <div className="mx-auto max-w-7xl">
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
                {camera.description ||
                  'Онлайн-камера с видом на городскую локацию. Смотрите трансляцию и изучайте место в реальном времени.'}
              </p>
            </div>

            <span
              className={[
                'inline-flex w-fit rounded-full px-4 py-2 text-sm font-bold ring-1',
                getStatusClassName(camera.status),
              ].join(' ')}
            >
              {getStatusLabel(camera.status)}
            </span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <CameraPlayer
            src={camera.streamUrl}
            poster={camera.previewUrl}
            title={camera.title}
          />

          <aside className="space-y-4">
            <div className="rounded-[32px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-xl shadow-[var(--color-shadow)] backdrop-blur-2xl">
              <h2 className="text-xl font-extrabold text-[var(--color-text-primary)]">
                О камере
              </h2>

              <div className="mt-5 space-y-3">
                <div className="flex items-start gap-3 rounded-2xl bg-[var(--color-bg-soft)] p-4">
                  <span className="mt-0.5 text-[var(--color-primary)]">
                    <CameraIcon />
                  </span>

                  <div>
                    <p className="text-sm font-bold text-[var(--color-text-primary)]">
                      Тип камеры
                    </p>
                    <p className="mt-1 font-inter text-sm text-[var(--color-text-secondary)]">
                      IP-камера
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl bg-[var(--color-bg-soft)] p-4">
                  <span className="mt-0.5 text-[var(--color-primary)]">
                    <MapPinIcon />
                  </span>

                  <div>
                    <p className="text-sm font-bold text-[var(--color-text-primary)]">
                      Координаты
                    </p>
                    <p className="mt-1 font-inter text-sm text-[var(--color-text-secondary)]">
                      {camera.latitude.toFixed(4)}, {camera.longitude.toFixed(4)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-xl shadow-[var(--color-shadow)] backdrop-blur-2xl">
              <h2 className="text-xl font-extrabold text-[var(--color-text-primary)]">
                Описание
              </h2>

              <p className="mt-3 font-inter text-sm leading-6 text-[var(--color-text-secondary)]">
                {camera.description ||
                  'Описание камеры пока не добавлено. Позже здесь будет информация о ракурсе, месте установки, доступности потока и связанных экскурсиях.'}
              </p>

            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}