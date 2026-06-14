import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router';

import {
  createAdminCamera,
  uploadAdminCameraPreview,
  type CreateAdminCameraPayload,
} from '../../../entities/camera/api/adminCamerasApi';
import type { AdminCamera } from '../../../entities/camera/model/adminCameraTypes';
import type { CameraStatus } from '../../../entities/camera/model/types';
import { AdminCameraMapPicker } from '../../../features/admin-camera-map-picker/ui/AdminCameraMapPicker';

type FormState = {
  title: string;
  slug: string;
  description: string;
  status: CameraStatus;
  city: string;
  address: string;
  category: string;
  directionDeg: string;
  fovDeg: string;
  rangeMeters: string;
  latitude: string;
  longitude: string;
  rtspUrl: string;
  username: string;
  password: string;
};

const INITIAL_FORM_STATE: FormState = {
  title: '',
  slug: '',
  description: '',
  status: 'online',
  city: 'Санкт-Петербург',
  address: '',
  category: 'landmark',
  directionDeg: '90',
  fovDeg: '90',
  rangeMeters: '100',
  latitude: '59.9398',
  longitude: '30.3146',
  rtspUrl: '',
  username: '',
  password: '',
};

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

function normalizeNumber(value: string) {
  return Number(value.replace(',', '.'));
}

function createSlug(value: string) {
  const dictionary: Record<string, string> = {
    а: 'a',
    б: 'b',
    в: 'v',
    г: 'g',
    д: 'd',
    е: 'e',
    ё: 'e',
    ж: 'zh',
    з: 'z',
    и: 'i',
    й: 'y',
    к: 'k',
    л: 'l',
    м: 'm',
    н: 'n',
    о: 'o',
    п: 'p',
    р: 'r',
    с: 's',
    т: 't',
    у: 'u',
    ф: 'f',
    х: 'h',
    ц: 'c',
    ч: 'ch',
    ш: 'sh',
    щ: 'sch',
    ъ: '',
    ы: 'y',
    ь: '',
    э: 'e',
    ю: 'yu',
    я: 'ya',
  };

  return value
    .toLowerCase()
    .split('')
    .map((letter) => dictionary[letter] ?? letter)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
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

export function AdminCameraCreatePage() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM_STATE);
  const [createdCamera, setCreatedCamera] = useState<AdminCamera | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const previewPayload = useMemo<CreateAdminCameraPayload>(() => {
    return {
      title: form.title.trim(),
      slug: form.slug.trim(),
      description: form.description.trim(),
      status: form.status,
      city: form.city.trim(),
      address: form.address.trim(),
      category: form.category.trim(),
      directionDeg: normalizeNumber(form.directionDeg),
      fovDeg: normalizeNumber(form.fovDeg),
      rangeMeters: normalizeNumber(form.rangeMeters),
      latitude: normalizeNumber(form.latitude),
      longitude: normalizeNumber(form.longitude),
      connection: {
        rtspUrl: form.rtspUrl.trim(),
        username: form.username.trim(),
        password: form.password,
      },
    };
  }, [form]);

  const handlePreviewFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    setPreviewFile(file);

    if (previewImageUrl) {
      URL.revokeObjectURL(previewImageUrl);
    }

    if (file) {
      setPreviewImageUrl(URL.createObjectURL(file));
    } else {
      setPreviewImageUrl(null);
    }
  };

  const updateField = (
    field: keyof FormState,
    value: FormState[keyof FormState],
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTitleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextTitle = event.target.value;

    setForm((prev) => ({
      ...prev,
      title: nextTitle,
      slug: prev.slug ? prev.slug : createSlug(nextTitle),
    }));
  };

  const validateForm = () => {
    if (!previewPayload.title) return 'Введите название камеры';
    if (!previewPayload.slug) return 'Введите slug камеры';
    if (!previewPayload.description) return 'Введите описание камеры';
    if (!previewPayload.city) return 'Введите город';
    if (!previewPayload.address) return 'Введите адрес';
    if (!previewPayload.category) return 'Введите категорию';

    if (!Number.isFinite(previewPayload.latitude)) {
      return 'Некорректная широта';
    }

    if (!Number.isFinite(previewPayload.longitude)) {
      return 'Некорректная долгота';
    }

    if (previewPayload.latitude < -90 || previewPayload.latitude > 90) {
      return 'Широта должна быть от -90 до 90';
    }

    if (previewPayload.longitude < -180 || previewPayload.longitude > 180) {
      return 'Долгота должна быть от -180 до 180';
    }

    if (
      !Number.isFinite(previewPayload.directionDeg) ||
      previewPayload.directionDeg < 0 ||
      previewPayload.directionDeg > 360
    ) {
      return 'Направление должно быть от 0 до 360 градусов';
    }

    if (
      !Number.isFinite(previewPayload.fovDeg) ||
      previewPayload.fovDeg <= 0 ||
      previewPayload.fovDeg > 360
    ) {
      return 'Угол обзора должен быть от 1 до 360 градусов';
    }

    if (
      !Number.isFinite(previewPayload.rangeMeters) ||
      previewPayload.rangeMeters <= 0
    ) {
      return 'Дальность обзора должна быть больше 0';
    }

    if (!previewPayload.connection.rtspUrl) {
      return 'Введите RTSP URL';
    }

    if (!previewPayload.connection.username) {
      return 'Введите username камеры';
    }

    if (!previewPayload.connection.password) {
      return 'Введите password камеры';
    }

    return null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError(null);
    setCreatedCamera(null);

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    const abortController = new AbortController();

    try {
      setIsLoading(true);

      const createdCamera = await createAdminCamera(
        previewPayload,
        abortController.signal,
      );
    
      if (previewFile) {
        const cameraWithPreview = await uploadAdminCameraPreview(
          createdCamera.id,
          previewFile,
          abortController.signal,
        );
      
        setCreatedCamera(cameraWithPreview);
      } else {
        setCreatedCamera(createdCamera);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Не удалось создать камеру';
    
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setForm(INITIAL_FORM_STATE);
    setError(null);
    setCreatedCamera(null);

    setPreviewFile(null);

    if (previewImageUrl) {
      URL.revokeObjectURL(previewImageUrl);
    }

    setPreviewImageUrl(null);
  };

  return (
    <section>
      <div className="mb-8">

        <div className="mt-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl">
              Добавить камеру
            </h1>

            <p className="mt-4 max-w-2xl font-inter text-base leading-7 text-[var(--color-text-secondary)]">
              Заполните данные камеры, укажите координаты и направление обзора
              через мини-карту или числовые поля.
            </p>
          </div>

          <Link
            to="/admin-dashboard/cameras"
            className="inline-flex h-12 items-center justify-center rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 text-sm font-bold text-[var(--color-text-primary)] transition hover:scale-[1.02] hover:text-[var(--color-primary)]"
          >
            К списку камер
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1fr_520px]">
        <div className="space-y-6">
          <div className="rounded-[32px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-xl shadow-[var(--color-shadow)] backdrop-blur-2xl">
            <h2 className="text-2xl font-extrabold text-[var(--color-text-primary)]">
              Основная информация
            </h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Название">
                <TextInput
                  value={form.title}
                  onChange={handleTitleChange}
                  placeholder="Дворцовая площадь"
                />
              </Field>

              <Field label="Slug">
                <TextInput
                  value={form.slug}
                  onChange={(event) => updateField('slug', event.target.value)}
                  placeholder="palace-square"
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
                  onChange={(event) =>
                    updateField('address', event.target.value)
                  }
                  placeholder="Дворцовая площадь"
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
                  placeholder="Камера с видом на Дворцовую площадь"
                />
              </Field>
            </div>
          </div>

          <div className="rounded-[32px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-xl shadow-[var(--color-shadow)] backdrop-blur-2xl">
            <h2 className="text-2xl font-extrabold text-[var(--color-text-primary)]">
              Превью камеры
            </h2>

            <p className="mt-2 font-inter text-sm text-[var(--color-text-secondary)]">
              Это изображение будет отображаться в карточках камер вместо иконки.
            </p>

            <div className="mt-5 grid gap-4 lg:grid-cols-[280px_1fr] lg:items-center">
              <div className="relative h-44 overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-[var(--color-bg-soft)]">
                {previewImageUrl ? (
                  <img
                    src={previewImageUrl}
                    alt="Превью камеры"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-secondary-text)]">
                      <CameraIcon />
                    </div>
                
                    <p className="mt-3 font-inter text-sm font-bold text-[var(--color-text-secondary)]">
                      Превью не выбрано
                    </p>
                  </div>
                )}
              </div>
              
              <div>
                <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-bg-soft)] px-5 py-6 text-center transition hover:border-[var(--color-primary)]">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePreviewFileChange}
                    className="hidden"
                  />

                  <span className="font-inter text-sm font-extrabold text-[var(--color-text-primary)]">
                    Нажмите, чтобы выбрать изображение
                  </span>
              
                  <span className="mt-2 font-inter text-xs text-[var(--color-text-secondary)]">
                    JPG, PNG, WEBP. Лучше использовать горизонтальное изображение 16:9.
                  </span>
                </label>
              
                {previewFile && (
                  <div className="mt-3 flex items-center justify-between gap-3 rounded-[18px] bg-[var(--color-bg-soft)] px-4 py-3">
                    <span className="truncate font-inter text-xs font-bold text-[var(--color-text-secondary)]">
                      {previewFile.name}
                    </span>
                
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewFile(null);
                      
                        if (previewImageUrl) {
                          URL.revokeObjectURL(previewImageUrl);
                        }
                      
                        setPreviewImageUrl(null);
                      }}
                      className="shrink-0 font-inter text-xs font-bold text-red-500"
                    >
                      Убрать
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-xl shadow-[var(--color-shadow)] backdrop-blur-2xl">
            <h2 className="text-2xl font-extrabold text-[var(--color-text-primary)]">
              Координаты и обзор
            </h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Field label="Latitude">
                <TextInput
                  value={form.latitude}
                  onChange={(event) =>
                    updateField('latitude', event.target.value)
                  }
                  placeholder="59.9398"
                />
              </Field>

              <Field label="Longitude">
                <TextInput
                  value={form.longitude}
                  onChange={(event) =>
                    updateField('longitude', event.target.value)
                  }
                  placeholder="30.3146"
                />
              </Field>

              <Field label="Direction deg">
                <TextInput
                  value={form.directionDeg}
                  onChange={(event) =>
                    updateField('directionDeg', event.target.value)
                  }
                  placeholder="90"
                />
              </Field>

              <Field label="FOV deg">
                <TextInput
                  value={form.fovDeg}
                  onChange={(event) => updateField('fovDeg', event.target.value)}
                  placeholder="90"
                />
              </Field>

              <Field label="Range meters">
                <TextInput
                  value={form.rangeMeters}
                  onChange={(event) =>
                    updateField('rangeMeters', event.target.value)
                  }
                  placeholder="100"
                />
              </Field>
            </div>
          </div>

          <div className="rounded-[32px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-xl shadow-[var(--color-shadow)] backdrop-blur-2xl">
            <h2 className="text-2xl font-extrabold text-[var(--color-text-primary)]">
              Подключение камеры
            </h2>

            <div className="mt-5 grid gap-4">
              <Field label="RTSP URL">
                <TextInput
                  value={form.rtspUrl}
                  onChange={(event) =>
                    updateField('rtspUrl', event.target.value)
                  }
                  placeholder="rtsp://192.168.1.10:554/stream1"
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
                    placeholder="secret_password"
                  />
                </Field>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-[24px] border border-red-500/20 bg-red-500/10 px-5 py-4 font-inter text-sm font-semibold text-red-600">
              {error}
            </div>
          )}

          {createdCamera && (
            <div className="rounded-[24px] border border-green-500/20 bg-green-500/10 px-5 py-4 font-inter text-sm font-semibold text-green-600">
              Камера создана: {createdCamera.title}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex h-12 items-center justify-center rounded-[18px] bg-[var(--button-third-bg)] px-6 text-sm font-bold text-[var(--button-third-text)] transition hover:scale-[1.02] hover:bg-[var(--button-third-hover)] disabled:cursor-wait disabled:opacity-70"
            >
              {isLoading ? 'Создаём...' : 'Создать камеру'}
            </button>

            <button
              type="button"
              onClick={handleReset}
              disabled={isLoading}
              className="inline-flex h-12 items-center justify-center rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] px-6 text-sm font-bold text-[var(--color-text-primary)] transition hover:text-[var(--color-primary)] disabled:opacity-60"
            >
              Очистить
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <AdminCameraMapPicker
            latitude={previewPayload.latitude}
            longitude={previewPayload.longitude}
            directionDeg={previewPayload.directionDeg}
            fovDeg={previewPayload.fovDeg}
            rangeMeters={previewPayload.rangeMeters}
            onLocationChange={(coords) => {
              setForm((prev) => ({
                ...prev,
                latitude: String(coords.latitude),
                longitude: String(coords.longitude),
              }));
            }}
            onDirectionChange={(directionDeg) => {
              setForm((prev) => ({
                ...prev,
                directionDeg: String(directionDeg),
              }));
            }}
          />

          <div className="rounded-[30px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-xl shadow-[var(--color-shadow)] backdrop-blur-2xl">
            <h3 className="text-lg font-extrabold text-[var(--color-text-primary)]">
              Что будет отправлено
            </h3>

            <pre className="mt-4 max-h-[360px] overflow-auto rounded-[22px] bg-[var(--color-bg-soft)] p-4 font-mono text-xs leading-5 text-[var(--color-text-secondary)]">
              {JSON.stringify(previewPayload, null, 2)}
            </pre>
          </div>
        </div>
      </form>
    </section>
  );
}