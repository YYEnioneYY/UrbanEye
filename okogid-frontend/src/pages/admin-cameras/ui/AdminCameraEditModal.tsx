import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';

import type { AdminCamera } from '../../../entities/camera/model/adminCameraTypes';
import type { CameraStatus } from '../../../entities/camera/model/types';
import {
  updateAdminCamera,
  type UpdateAdminCameraPayload,
} from '../../../entities/camera/api/adminCamerasApi';

type AdminCameraEditModalProps = {
  camera: AdminCamera;
  onClose: () => void;
  onUpdated: () => void;
};

type FormState = {
  title: string;
  slug: string;
  description: string;
  status: CameraStatus;
  city: string;
  address: string;
  category: string;
  latitude: string;
  longitude: string;
  directionDeg: string;
  fovDeg: string;
  rangeMeters: string;
  rtspUrl: string;
  username: string;
  password: string;
};

function normalizeNumber(value: string) {
  return Number(value.replace(',', '.'));
}

function createInitialForm(camera: AdminCamera): FormState {
  return {
    title: camera.title,
    slug: camera.slug,
    description: camera.description,
    status: camera.status,
    city: camera.city,
    address: camera.address,
    category: camera.category,
    latitude: String(camera.latitude),
    longitude: String(camera.longitude),
    directionDeg: String(camera.coverage?.directionDeg ?? 0),
    fovDeg: String(camera.coverage?.fovDeg ?? 90),
    rangeMeters: String(camera.coverage?.rangeMeters ?? 100),
    rtspUrl: camera.connection?.rtspUrl ?? '',
    username: camera.connection?.username ?? '',
    password: camera.connection?.password ?? '',
  };
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-inter text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
        {label}
      </span>

      {children}
    </label>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        'h-12 w-full rounded-[18px] border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-4',
        'font-inter text-sm font-semibold text-[var(--color-text-primary)] outline-none transition',
        'placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-primary)]',
        props.className ?? '',
      ].join(' ')}
    />
  );
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={[
        'min-h-28 w-full resize-none rounded-[18px] border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-4 py-3',
        'font-inter text-sm font-semibold text-[var(--color-text-primary)] outline-none transition',
        'placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-primary)]',
        props.className ?? '',
      ].join(' ')}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={[
        'h-12 w-full rounded-[18px] border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-4',
        'font-inter text-sm font-semibold text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-primary)]',
        props.className ?? '',
      ].join(' ')}
    />
  );
}

function CloseIcon() {
  return (
    <svg
      className="h-5 w-5"
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

export function AdminCameraEditModal({
  camera,
  onClose,
  onUpdated,
}: AdminCameraEditModalProps) {
  const [form, setForm] = useState<FormState>(() => createInitialForm(camera));
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const payload = useMemo<UpdateAdminCameraPayload>(() => {
    return {
      title: form.title.trim(),
      slug: form.slug.trim(),
      description: form.description.trim(),
      status: form.status,
      city: form.city.trim(),
      address: form.address.trim(),
      category: form.category.trim(),
      latitude: normalizeNumber(form.latitude),
      longitude: normalizeNumber(form.longitude),
      directionDeg: normalizeNumber(form.directionDeg),
      fovDeg: normalizeNumber(form.fovDeg),
      rangeMeters: normalizeNumber(form.rangeMeters),
      connection: {
        rtspUrl: form.rtspUrl.trim(),
        username: form.username.trim(),
        password: form.password,
      },
    };
  }, [form]);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isLoading) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLoading, onClose]);

  const updateField = <Key extends keyof FormState>(
    field: Key,
    value: FormState[Key],
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!payload.title) return 'Введите название камеры';
    if (!payload.slug) return 'Введите slug камеры';
    if (!payload.description) return 'Введите описание камеры';
    if (!payload.city) return 'Введите город';
    if (!payload.address) return 'Введите адрес';
    if (!payload.category) return 'Введите категорию';

    if (!Number.isFinite(payload.latitude)) return 'Некорректная широта';
    if (!Number.isFinite(payload.longitude)) return 'Некорректная долгота';

    if (payload.latitude < -90 || payload.latitude > 90) {
      return 'Широта должна быть от -90 до 90';
    }

    if (payload.longitude < -180 || payload.longitude > 180) {
      return 'Долгота должна быть от -180 до 180';
    }

    if (
      !Number.isFinite(payload.directionDeg) ||
      payload.directionDeg < 0 ||
      payload.directionDeg > 360
    ) {
      return 'Направление должно быть от 0 до 360 градусов';
    }

    if (
      !Number.isFinite(payload.fovDeg) ||
      payload.fovDeg <= 0 ||
      payload.fovDeg > 360
    ) {
      return 'Угол обзора должен быть от 1 до 360 градусов';
    }

    if (!Number.isFinite(payload.rangeMeters) || payload.rangeMeters <= 0) {
      return 'Дальность обзора должна быть больше 0';
    }

    if (!payload.connection.rtspUrl) return 'Введите RTSP URL';
    if (!payload.connection.username) return 'Введите username';
    if (!payload.connection.password) return 'Введите password';

    return null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError(null);

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    const abortController = new AbortController();

    try {
      setIsLoading(true);

      await updateAdminCamera(camera.id, payload, abortController.signal);

      onUpdated();
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Не удалось обновить камеру';

      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOverlayClick = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center overflow-y-auto bg-black/45 px-4 py-5 backdrop-blur-sm"
      onMouseDown={handleOverlayClick}
      role="dialog"
      aria-modal="true"
    >
      <form
        onSubmit={handleSubmit}
        onMouseDown={(event) => event.stopPropagation()}
        className="relative flex max-h-[calc(100vh-40px)] w-full max-w-5xl flex-col overflow-hidden rounded-[34px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl shadow-black/30"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] px-6 py-5">
          <div className="min-w-0">
            <p className="font-inter text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
              Редактирование камеры
            </p>

            <h2 className="mt-1 truncate text-3xl font-extrabold text-[var(--color-text-primary)]">
              {camera.title}
            </h2>

            <p className="mt-2 max-w-2xl truncate font-inter text-sm text-[var(--color-text-secondary)]">
              ID: {camera.id}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-solid)] text-[var(--color-text-secondary)] transition hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Закрыть"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Название">
              <TextInput
                value={form.title}
                onChange={(event) => updateField('title', event.target.value)}
                placeholder="Медный всадник"
              />
            </Field>

            <Field label="Slug">
              <TextInput
                value={form.slug}
                onChange={(event) => updateField('slug', event.target.value)}
                placeholder="spb-bronze-horseman"
              />
            </Field>

            <Field label="Статус">
              <Select
                value={form.status}
                onChange={(event) =>
                  updateField('status', event.target.value as CameraStatus)
                }
              >
                <option value="online">online</option>
                <option value="offline">offline</option>
                <option value="maintenance">maintenance</option>
              </Select>
            </Field>

            <Field label="Категория">
              <TextInput
                value={form.category}
                onChange={(event) =>
                  updateField('category', event.target.value)
                }
                placeholder="landmark"
              />
            </Field>

            <Field label="Город">
              <TextInput
                value={form.city}
                onChange={(event) => updateField('city', event.target.value)}
                placeholder="Санкт-Петербург"
              />
            </Field>

            <Field label="Адрес">
              <TextInput
                value={form.address}
                onChange={(event) => updateField('address', event.target.value)}
                placeholder="Медный всадник"
              />
            </Field>
          </div>

          <div className="mt-4">
            <Field label="Описание">
              <TextArea
                value={form.description}
                onChange={(event) =>
                  updateField('description', event.target.value)
                }
                placeholder="Камера с видом на Медного всадника"
              />
            </Field>
          </div>

          <div className="mt-6">
            <h3 className="text-xl font-extrabold text-[var(--color-text-primary)]">
              Координаты и обзор
            </h3>

            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <Field label="Latitude">
                <TextInput
                  value={form.latitude}
                  onChange={(event) =>
                    updateField('latitude', event.target.value)
                  }
                  placeholder="59.9365"
                />
              </Field>

              <Field label="Longitude">
                <TextInput
                  value={form.longitude}
                  onChange={(event) =>
                    updateField('longitude', event.target.value)
                  }
                  placeholder="30.3022"
                />
              </Field>

              <Field label="Direction">
                <TextInput
                  value={form.directionDeg}
                  onChange={(event) =>
                    updateField('directionDeg', event.target.value)
                  }
                  placeholder="50"
                />
              </Field>

              <Field label="FOV">
                <TextInput
                  value={form.fovDeg}
                  onChange={(event) => updateField('fovDeg', event.target.value)}
                  placeholder="90"
                />
              </Field>

              <Field label="Range">
                <TextInput
                  value={form.rangeMeters}
                  onChange={(event) =>
                    updateField('rangeMeters', event.target.value)
                  }
                  placeholder="120"
                />
              </Field>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-xl font-extrabold text-[var(--color-text-primary)]">
              Подключение
            </h3>

            <div className="mt-4 grid gap-4">
              <Field label="RTSP URL">
                <TextInput
                  value={form.rtspUrl}
                  onChange={(event) =>
                    updateField('rtspUrl', event.target.value)
                  }
                  placeholder="rtsp://192.168.1.10:554/stream2"
                />
              </Field>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Username">
                  <TextInput
                    value={form.username}
                    onChange={(event) =>
                      updateField('username', event.target.value)
                    }
                    placeholder="admin"
                  />
                </Field>

                <Field label="Password">
                  <TextInput
                    type="password"
                    value={form.password}
                    onChange={(event) =>
                      updateField('password', event.target.value)
                    }
                    placeholder="secret"
                  />
                </Field>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-5 rounded-[22px] border border-red-500/20 bg-red-500/10 px-5 py-4 font-inter text-sm font-semibold text-red-600">
              {error}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="h-12 rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface-solid)] px-6 font-inter text-sm font-bold text-[var(--color-text-primary)] transition hover:text-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Отмена
          </button>

          <button
            type="submit"
            disabled={isLoading}
            className="h-12 rounded-[18px] bg-[var(--button-third-bg)] px-6 font-inter text-sm font-extrabold text-[var(--button-third-text)] transition hover:scale-[1.02] hover:bg-[var(--button-third-hover)] disabled:cursor-wait disabled:opacity-70"
          >
            {isLoading ? 'Сохраняем...' : 'Сохранить изменения'}
          </button>
        </div>
      </form>
    </div>
  );
}