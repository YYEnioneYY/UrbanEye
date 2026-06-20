import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react';
import { Link } from 'react-router';

import type { Camera } from '../../../entities/camera/model/types';
import type { Intersection } from '../../../entities/intersection/model/types';
import {
  createAdminIntersection,
  createAdminIntersectionCamera,
  getAdminIntersections,
  type CreateAdminIntersectionCameraPayload,
  type CreateAdminIntersectionPayload,
} from '../../../entities/intersection/api/adminIntersectionsApi';
import {
  AdminIntersectionMapPicker,
  type AdminIntersectionMapMode,
} from '../../../features/admin-intersection-map-picker/ui/AdminIntersectionMapPicker';

type IntersectionFormState = {
  title: string;
  slug: string;
  description: string;
  city: string;
  address: string;
  category: string;
  latitude: string;
  longitude: string;
};

type CameraFormState = {
  title: string;
  slug: string;
  description: string;
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

const DEFAULT_LATITUDE = '59.9365';
const DEFAULT_LONGITUDE = '30.3486';

const INITIAL_INTERSECTION_FORM: IntersectionFormState = {
  title: 'Невский / Литейный',
  slug: 'nevsky-liteyny',
  description: 'Перекрёсток с несколькими камерами',
  city: 'Санкт-Петербург',
  address: 'Невский проспект / Литейный проспект',
  category: 'traffic',
  latitude: DEFAULT_LATITUDE,
  longitude: DEFAULT_LONGITUDE,
};

const INITIAL_CAMERA_FORM: CameraFormState = {
  title: 'Невский / Литейный — север',
  slug: 'nevsky-liteyny-north',
  description: 'Камера смотрит на северную часть перекрёстка',
  category: 'traffic',
  latitude: '59.9366',
  longitude: '30.3487',
  directionDeg: '0',
  fovDeg: '90',
  rangeMeters: '120',
  rtspUrl: 'rtsp://192.168.1.10:554/Streaming/Channels/102',
  username: 'admin',
  password: 'password',
};

function normalizeNumber(value: string) {
  return Number(value.replace(',', '.'));
}

function isFiniteNumber(value: number) {
  return Number.isFinite(value);
}

function isAbortError(error: unknown) {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return true;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    return (
      error.name === 'AbortError' ||
      message.includes('aborted') ||
      message.includes('abort')
    );
  }

  return false;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
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

export function AdminIntersectionCreatePage() {
  const [intersectionForm, setIntersectionForm] =
    useState<IntersectionFormState>(INITIAL_INTERSECTION_FORM);

  const [cameraForm, setCameraForm] =
    useState<CameraFormState>(INITIAL_CAMERA_FORM);

  const [mapMode, setMapMode] =
    useState<AdminIntersectionMapMode>('intersection');

  const [createdIntersection, setCreatedIntersection] =
    useState<Intersection | null>(null);

  const [createdCameras, setCreatedCameras] = useState<Camera[]>([]);

  const [intersections, setIntersections] = useState<Intersection[]>([]);
  const [selectedIntersectionId, setSelectedIntersectionId] = useState('');
  const [isIntersectionsLoading, setIsIntersectionsLoading] = useState(false);
  const [intersectionsError, setIntersectionsError] = useState<string | null>(
    null,
  );

  const [isIntersectionLoading, setIsIntersectionLoading] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);

  const [intersectionError, setIntersectionError] = useState<string | null>(
    null,
  );
  const [cameraError, setCameraError] = useState<string | null>(null);

  const availableIntersections = useMemo(() => {
    if (!createdIntersection) {
      return intersections;
    }

    const exists = intersections.some(
      (intersection) => intersection.id === createdIntersection.id,
    );

    if (exists) {
      return intersections;
    }

    return [createdIntersection, ...intersections];
  }, [createdIntersection, intersections]);

  const selectedIntersectionForCamera = useMemo(() => {
    return (
      availableIntersections.find(
        (intersection) => intersection.id === selectedIntersectionId,
      ) ?? null
    );
  }, [availableIntersections, selectedIntersectionId]);

  const intersectionPayload = useMemo<CreateAdminIntersectionPayload>(() => {
    return {
      title: intersectionForm.title.trim(),
      slug: intersectionForm.slug.trim(),
      description: intersectionForm.description.trim(),
      city: intersectionForm.city.trim(),
      address: intersectionForm.address.trim(),
      category: intersectionForm.category.trim(),
      latitude: normalizeNumber(intersectionForm.latitude),
      longitude: normalizeNumber(intersectionForm.longitude),
    };
  }, [intersectionForm]);

  const cameraPayload = useMemo<CreateAdminIntersectionCameraPayload>(() => {
    return {
      title: cameraForm.title.trim(),
      slug: cameraForm.slug.trim(),
      description: cameraForm.description.trim(),
      category: cameraForm.category.trim(),
      latitude: normalizeNumber(cameraForm.latitude),
      longitude: normalizeNumber(cameraForm.longitude),
      directionDeg: normalizeNumber(cameraForm.directionDeg),
      fovDeg: normalizeNumber(cameraForm.fovDeg),
      rangeMeters: normalizeNumber(cameraForm.rangeMeters),
      connection: {
        rtspUrl: cameraForm.rtspUrl.trim(),
        username: cameraForm.username.trim(),
        password: cameraForm.password,
      },
    };
  }, [cameraForm]);

  const intersectionLatitude = normalizeNumber(intersectionForm.latitude);
  const intersectionLongitude = normalizeNumber(intersectionForm.longitude);
  const cameraLatitude = normalizeNumber(cameraForm.latitude);
  const cameraLongitude = normalizeNumber(cameraForm.longitude);
  const directionDeg = normalizeNumber(cameraForm.directionDeg);
  const rangeMeters = normalizeNumber(cameraForm.rangeMeters);

  const visibleIntersectionLatitude =
    mapMode === 'intersection'
      ? intersectionLatitude
      : selectedIntersectionForCamera?.latitude ?? intersectionLatitude;

  const visibleIntersectionLongitude =
    mapMode === 'intersection'
      ? intersectionLongitude
      : selectedIntersectionForCamera?.longitude ?? intersectionLongitude;

  useEffect(() => {
    const abortController = new AbortController();

    const loadIntersections = async () => {
      try {
        setIsIntersectionsLoading(true);
        setIntersectionsError(null);

        const data = await getAdminIntersections(abortController.signal);

        if (abortController.signal.aborted) {
          return;
        }

        setIntersections(data);

        if (data.length > 0) {
          const firstIntersection = data[0];

          setSelectedIntersectionId(firstIntersection.id);

          setCameraForm((prev) => ({
            ...prev,
            category: firstIntersection.category,
            latitude: String(firstIntersection.latitude),
            longitude: String(firstIntersection.longitude),
          }));
        }
      } catch (error) {
        if (abortController.signal.aborted || isAbortError(error)) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : 'Не удалось загрузить перекрёстки';

        setIntersectionsError(message);
      } finally {
        if (!abortController.signal.aborted) {
          setIsIntersectionsLoading(false);
        }
      }
    };

    void loadIntersections();

    return () => {
      abortController.abort();
    };
  }, []);

  const updateIntersectionField = <Key extends keyof IntersectionFormState>(
    field: Key,
    value: IntersectionFormState[Key],
  ) => {
    setIntersectionForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateCameraField = <Key extends keyof CameraFormState>(
    field: Key,
    value: CameraFormState[Key],
  ) => {
    setCameraForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSelectIntersectionForCamera = (intersectionId: string) => {
    setSelectedIntersectionId(intersectionId);

    const intersection = availableIntersections.find(
      (item) => item.id === intersectionId,
    );

    if (!intersection) {
      return;
    }

    setCameraForm((prev) => ({
      ...prev,
      category: intersection.category,
      latitude: String(intersection.latitude),
      longitude: String(intersection.longitude),
    }));

    setMapMode('camera');
  };

  const validateIntersectionForm = () => {
    if (!intersectionPayload.title) return 'Введите название перекрёстка';
    if (!intersectionPayload.slug) return 'Введите slug перекрёстка';
    if (!intersectionPayload.description) return 'Введите описание';
    if (!intersectionPayload.city) return 'Введите город';
    if (!intersectionPayload.address) return 'Введите адрес';
    if (!intersectionPayload.category) return 'Введите категорию';

    if (!isFiniteNumber(intersectionPayload.latitude)) {
      return 'Некорректная широта перекрёстка';
    }

    if (!isFiniteNumber(intersectionPayload.longitude)) {
      return 'Некорректная долгота перекрёстка';
    }

    if (
      intersectionPayload.latitude < -90 ||
      intersectionPayload.latitude > 90
    ) {
      return 'Широта должна быть от -90 до 90';
    }

    if (
      intersectionPayload.longitude < -180 ||
      intersectionPayload.longitude > 180
    ) {
      return 'Долгота должна быть от -180 до 180';
    }

    return null;
  };

  const validateCameraForm = () => {
    if (!selectedIntersectionForCamera) {
      return 'Выберите перекрёсток, к которому нужно добавить камеру';
    }

    if (!cameraPayload.title) return 'Введите название камеры';
    if (!cameraPayload.slug) return 'Введите slug камеры';
    if (!cameraPayload.description) return 'Введите описание камеры';
    if (!cameraPayload.category) return 'Введите категорию камеры';

    if (!isFiniteNumber(cameraPayload.latitude)) {
      return 'Некорректная широта камеры';
    }

    if (!isFiniteNumber(cameraPayload.longitude)) {
      return 'Некорректная долгота камеры';
    }

    if (cameraPayload.latitude < -90 || cameraPayload.latitude > 90) {
      return 'Широта камеры должна быть от -90 до 90';
    }

    if (cameraPayload.longitude < -180 || cameraPayload.longitude > 180) {
      return 'Долгота камеры должна быть от -180 до 180';
    }

    if (
      !isFiniteNumber(cameraPayload.directionDeg) ||
      cameraPayload.directionDeg < 0 ||
      cameraPayload.directionDeg > 360
    ) {
      return 'Направление должно быть от 0 до 360 градусов';
    }

    if (
      !isFiniteNumber(cameraPayload.fovDeg) ||
      cameraPayload.fovDeg <= 0 ||
      cameraPayload.fovDeg > 360
    ) {
      return 'Угол обзора должен быть от 1 до 360 градусов';
    }

    if (
      !isFiniteNumber(cameraPayload.rangeMeters) ||
      cameraPayload.rangeMeters <= 0
    ) {
      return 'Дальность должна быть больше 0';
    }

    if (!cameraPayload.connection.rtspUrl) return 'Введите RTSP URL';
    if (!cameraPayload.connection.username) return 'Введите username';
    if (!cameraPayload.connection.password) return 'Введите password';

    return null;
  };

  const handleCreateIntersection = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setIntersectionError(null);

    const validationError = validateIntersectionForm();

    if (validationError) {
      setIntersectionError(validationError);
      return;
    }

    const abortController = new AbortController();

    try {
      setIsIntersectionLoading(true);

      const intersection = await createAdminIntersection(
        intersectionPayload,
        abortController.signal,
      );

      setCreatedIntersection(intersection);
      setSelectedIntersectionId(intersection.id);

      setIntersections((prev) => {
        const exists = prev.some((item) => item.id === intersection.id);

        if (exists) {
          return prev;
        }

        return [intersection, ...prev];
      });

      setIntersectionForm((prev) => ({
        ...prev,
        title: intersection.title,
        slug: intersection.slug,
        description: intersection.description,
        city: intersection.city,
        address: intersection.address,
        category: intersection.category,
        latitude: String(intersection.latitude),
        longitude: String(intersection.longitude),
      }));

      setCameraForm((prev) => ({
        ...prev,
        category: intersection.category,
        latitude: String(intersection.latitude),
        longitude: String(intersection.longitude),
      }));

      setMapMode('camera');
    } catch (error) {
      if (isAbortError(error)) {
        return;
      }

      const message =
        error instanceof Error
          ? error.message
          : 'Не удалось создать перекрёсток';

      setIntersectionError(message);
    } finally {
      setIsIntersectionLoading(false);
    }
  };

  const handleCreateCamera = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setCameraError(null);

    const validationError = validateCameraForm();

    if (validationError) {
      setCameraError(validationError);
      return;
    }

    if (!selectedIntersectionForCamera) {
      return;
    }

    const abortController = new AbortController();

    try {
      setIsCameraLoading(true);

      const camera = await createAdminIntersectionCamera(
        selectedIntersectionForCamera.id,
        cameraPayload,
        abortController.signal,
      );

      setCreatedCameras((prev) => [camera, ...prev]);

      const nextCameraNumber = createdCameras.length + 2;

      setCameraForm((prev) => ({
        ...prev,
        title: `${selectedIntersectionForCamera.title} — камера ${nextCameraNumber}`,
        slug: `${selectedIntersectionForCamera.slug}-camera-${nextCameraNumber}`,
        description: 'Камера перекрёстка',
        category: selectedIntersectionForCamera.category,
        rtspUrl: '',
        username: '',
        password: '',
      }));
    } catch (error) {
      if (isAbortError(error)) {
        return;
      }

      const message =
        error instanceof Error ? error.message : 'Не удалось создать камеру';

      setCameraError(message);
    } finally {
      setIsCameraLoading(false);
    }
  };

  return (
    <section className="min-h-full">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-inter text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
            Admin / Intersections
          </p>

          <h1 className="mt-2 text-4xl font-black text-[var(--color-text-primary)]">
            Создание перекрёстка
          </h1>

          <p className="mt-2 max-w-3xl font-inter text-sm leading-6 text-[var(--color-text-secondary)]">
            Создай новый перекрёсток или выбери существующий, чтобы добавить к
            нему камеру с RTSP-подключением и сектором обзора.
          </p>
        </div>

        <Link
          to="/admin-dashboard/intersections"
          className="h-11 rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3 font-inter text-sm font-bold text-[var(--color-text-primary)] transition hover:text-[var(--color-primary)]"
        >
          К списку перекрёстков
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(460px,1.05fr)]">
        <div className="space-y-6">
          <form
            onSubmit={handleCreateIntersection}
            className="rounded-[34px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xl shadow-[var(--color-shadow)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-inter text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                  Шаг 1
                </p>

                <h2 className="mt-1 text-2xl font-black text-[var(--color-text-primary)]">
                  Данные перекрёстка
                </h2>
              </div>

              {createdIntersection && (
                <span className="rounded-full bg-green-500/10 px-3 py-1 font-inter text-xs font-bold text-green-600 ring-1 ring-green-500/20">
                  Создан
                </span>
              )}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Название">
                <TextInput
                  value={intersectionForm.title}
                  onChange={(event) =>
                    updateIntersectionField('title', event.target.value)
                  }
                />
              </Field>

              <Field label="Slug">
                <TextInput
                  value={intersectionForm.slug}
                  onChange={(event) =>
                    updateIntersectionField('slug', event.target.value)
                  }
                />
              </Field>

              <Field label="Город">
                <TextInput
                  value={intersectionForm.city}
                  onChange={(event) =>
                    updateIntersectionField('city', event.target.value)
                  }
                />
              </Field>

              <Field label="Категория">
                <TextInput
                  value={intersectionForm.category}
                  onChange={(event) =>
                    updateIntersectionField('category', event.target.value)
                  }
                />
              </Field>

              <Field label="Latitude">
                <TextInput
                  value={intersectionForm.latitude}
                  onChange={(event) =>
                    updateIntersectionField('latitude', event.target.value)
                  }
                />
              </Field>

              <Field label="Longitude">
                <TextInput
                  value={intersectionForm.longitude}
                  onChange={(event) =>
                    updateIntersectionField('longitude', event.target.value)
                  }
                />
              </Field>
            </div>

            <div className="mt-4">
              <Field label="Адрес">
                <TextInput
                  value={intersectionForm.address}
                  onChange={(event) =>
                    updateIntersectionField('address', event.target.value)
                  }
                />
              </Field>
            </div>

            <div className="mt-4">
              <Field label="Описание">
                <TextArea
                  value={intersectionForm.description}
                  onChange={(event) =>
                    updateIntersectionField('description', event.target.value)
                  }
                />
              </Field>
            </div>

            {intersectionError && (
              <div className="mt-5 rounded-[22px] border border-red-500/20 bg-red-500/10 px-5 py-4 font-inter text-sm font-semibold text-red-600">
                {intersectionError}
              </div>
            )}

            <button
              type="submit"
              disabled={isIntersectionLoading}
              className="mt-5 h-12 w-full rounded-[18px] bg-[var(--button-third-bg)] px-6 font-inter text-sm font-extrabold text-[var(--button-third-text)] transition hover:scale-[1.01] hover:bg-[var(--button-third-hover)] disabled:cursor-wait disabled:opacity-70"
            >
              {isIntersectionLoading
                ? 'Создаём перекрёсток...'
                : createdIntersection
                  ? 'Создать ещё один перекрёсток'
                  : 'Создать перекрёсток'}
            </button>
          </form>

          <form
            onSubmit={handleCreateCamera}
            className={[
              'rounded-[34px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xl shadow-[var(--color-shadow)]',
              !selectedIntersectionForCamera ? 'opacity-70' : '',
            ].join(' ')}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-inter text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                  Шаг 2
                </p>

                <h2 className="mt-1 text-2xl font-black text-[var(--color-text-primary)]">
                  Камера перекрёстка
                </h2>

                {!selectedIntersectionForCamera && (
                  <p className="mt-2 font-inter text-sm text-[var(--color-text-secondary)]">
                    Выбери существующий перекрёсток или сначала создай новый.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-5">
              <Field label="К какому перекрёстку добавить камеру">
                <select
                  value={selectedIntersectionId}
                  onChange={(event) =>
                    handleSelectIntersectionForCamera(event.target.value)
                  }
                  disabled={
                    isIntersectionsLoading || availableIntersections.length === 0
                  }
                  className="h-12 w-full rounded-[18px] border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-4 font-inter text-sm font-semibold text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">
                    {isIntersectionsLoading
                      ? 'Загружаем перекрёстки...'
                      : 'Выберите перекрёсток'}
                  </option>

                  {availableIntersections.map((intersection) => (
                    <option key={intersection.id} value={intersection.id}>
                      {intersection.title} · {intersection.address}
                    </option>
                  ))}
                </select>
              </Field>

              {intersectionsError && (
                <div className="mt-3 rounded-[18px] border border-red-500/20 bg-red-500/10 px-4 py-3 font-inter text-xs font-semibold text-red-600">
                  {intersectionsError}
                </div>
              )}

              {selectedIntersectionForCamera && (
                <div className="mt-3 rounded-[20px] border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-4">
                  <p className="font-inter text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                    Выбранный перекрёсток
                  </p>

                  <p className="mt-1 font-inter text-sm font-extrabold text-[var(--color-text-primary)]">
                    {selectedIntersectionForCamera.title}
                  </p>

                  <p className="mt-1 font-inter text-xs leading-5 text-[var(--color-text-secondary)]">
                    {selectedIntersectionForCamera.address}
                  </p>

                  <p className="mt-1 font-inter text-xs font-bold text-[var(--color-text-muted)]">
                    {selectedIntersectionForCamera.latitude.toFixed(5)},{' '}
                    {selectedIntersectionForCamera.longitude.toFixed(5)}
                  </p>
                </div>
              )}
            </div>

            <fieldset disabled={!selectedIntersectionForCamera || isCameraLoading}>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Field label="Название">
                  <TextInput
                    value={cameraForm.title}
                    onChange={(event) =>
                      updateCameraField('title', event.target.value)
                    }
                  />
                </Field>

                <Field label="Slug">
                  <TextInput
                    value={cameraForm.slug}
                    onChange={(event) =>
                      updateCameraField('slug', event.target.value)
                    }
                  />
                </Field>

                <Field label="Категория">
                  <TextInput
                    value={cameraForm.category}
                    onChange={(event) =>
                      updateCameraField('category', event.target.value)
                    }
                  />
                </Field>

                <Field label="Direction">
                  <TextInput
                    value={cameraForm.directionDeg}
                    onChange={(event) =>
                      updateCameraField('directionDeg', event.target.value)
                    }
                  />
                </Field>

                <Field label="Latitude">
                  <TextInput
                    value={cameraForm.latitude}
                    onChange={(event) =>
                      updateCameraField('latitude', event.target.value)
                    }
                  />
                </Field>

                <Field label="Longitude">
                  <TextInput
                    value={cameraForm.longitude}
                    onChange={(event) =>
                      updateCameraField('longitude', event.target.value)
                    }
                  />
                </Field>

                <Field label="FOV">
                  <TextInput
                    value={cameraForm.fovDeg}
                    onChange={(event) =>
                      updateCameraField('fovDeg', event.target.value)
                    }
                  />
                </Field>

                <Field label="Range">
                  <TextInput
                    value={cameraForm.rangeMeters}
                    onChange={(event) =>
                      updateCameraField('rangeMeters', event.target.value)
                    }
                  />
                </Field>
              </div>

              <div className="mt-4">
                <Field label="Описание">
                  <TextArea
                    value={cameraForm.description}
                    onChange={(event) =>
                      updateCameraField('description', event.target.value)
                    }
                  />
                </Field>
              </div>

              <div className="mt-4 grid gap-4">
                <Field label="RTSP URL">
                  <TextInput
                    value={cameraForm.rtspUrl}
                    onChange={(event) =>
                      updateCameraField('rtspUrl', event.target.value)
                    }
                  />
                </Field>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Username">
                    <TextInput
                      value={cameraForm.username}
                      onChange={(event) =>
                        updateCameraField('username', event.target.value)
                      }
                    />
                  </Field>

                  <Field label="Password">
                    <TextInput
                      type="password"
                      value={cameraForm.password}
                      onChange={(event) =>
                        updateCameraField('password', event.target.value)
                      }
                    />
                  </Field>
                </div>
              </div>
            </fieldset>

            {cameraError && (
              <div className="mt-5 rounded-[22px] border border-red-500/20 bg-red-500/10 px-5 py-4 font-inter text-sm font-semibold text-red-600">
                {cameraError}
              </div>
            )}

            <button
              type="submit"
              disabled={!selectedIntersectionForCamera || isCameraLoading}
              className="mt-5 h-12 w-full rounded-[18px] bg-[var(--button-third-bg)] px-6 font-inter text-sm font-extrabold text-[var(--button-third-text)] transition hover:scale-[1.01] hover:bg-[var(--button-third-hover)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCameraLoading ? 'Добавляем камеру...' : 'Добавить камеру'}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="rounded-[34px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-xl shadow-[var(--color-shadow)]">
            <p className="font-inter text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
              Режим карты
            </p>

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <MapModeButton
                active={mapMode === 'intersection'}
                onClick={() => setMapMode('intersection')}
              >
                Точка перекрёстка
              </MapModeButton>

              <MapModeButton
                active={mapMode === 'camera'}
                onClick={() => setMapMode('camera')}
              >
                Точка камеры
              </MapModeButton>

              <MapModeButton
                active={mapMode === 'direction'}
                onClick={() => setMapMode('direction')}
              >
                Направление
              </MapModeButton>
            </div>
          </div>

          <AdminIntersectionMapPicker
            mode={mapMode}
            intersectionLatitude={
              isFiniteNumber(visibleIntersectionLatitude)
                ? visibleIntersectionLatitude
                : Number(DEFAULT_LATITUDE)
            }
            intersectionLongitude={
              isFiniteNumber(visibleIntersectionLongitude)
                ? visibleIntersectionLongitude
                : Number(DEFAULT_LONGITUDE)
            }
            cameraLatitude={
              isFiniteNumber(cameraLatitude)
                ? cameraLatitude
                : Number(DEFAULT_LATITUDE)
            }
            cameraLongitude={
              isFiniteNumber(cameraLongitude)
                ? cameraLongitude
                : Number(DEFAULT_LONGITUDE)
            }
            directionDeg={isFiniteNumber(directionDeg) ? directionDeg : 0}
            rangeMeters={isFiniteNumber(rangeMeters) ? rangeMeters : 120}
            onIntersectionChange={(coords) => {
              updateIntersectionField('latitude', String(coords.latitude));
              updateIntersectionField('longitude', String(coords.longitude));
            }}
            onCameraChange={(coords) => {
              updateCameraField('latitude', String(coords.latitude));
              updateCameraField('longitude', String(coords.longitude));
            }}
            onDirectionChange={(direction) => {
              updateCameraField('directionDeg', String(direction));
            }}
          />

          {createdIntersection && (
            <div className="rounded-[34px] border border-green-500/20 bg-green-500/10 p-5 text-green-700">
              <p className="font-inter text-xs font-bold uppercase tracking-wide">
                Перекрёсток создан
              </p>

              <h3 className="mt-2 text-2xl font-black">
                {createdIntersection.title}
              </h3>

              <p className="mt-2 font-inter text-sm">
                ID: {createdIntersection.id}
              </p>

              <p className="mt-1 font-inter text-sm">
                Создан: {formatDate(createdIntersection.createdAt)}
              </p>
            </div>
          )}

          {createdCameras.length > 0 && (
            <div className="rounded-[34px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-xl shadow-[var(--color-shadow)]">
              <h3 className="text-2xl font-black text-[var(--color-text-primary)]">
                Добавленные камеры
              </h3>

              <div className="mt-4 space-y-3">
                {createdCameras.map((camera) => (
                  <div
                    key={camera.id}
                    className="rounded-[22px] bg-[var(--color-bg-soft)] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="line-clamp-1 font-inter text-sm font-extrabold text-[var(--color-text-primary)]">
                          {camera.title}
                        </p>

                        <p className="mt-1 font-inter text-xs text-[var(--color-text-secondary)]">
                          {camera.latitude.toFixed(5)},{' '}
                          {camera.longitude.toFixed(5)}
                        </p>
                      </div>

                      <span
                        className={[
                          'shrink-0 rounded-full px-3 py-1 font-inter text-xs font-bold ring-1',
                          getCameraStatusClassName(camera.status),
                        ].join(' ')}
                      >
                        {getCameraStatusLabel(camera.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
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

function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
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

function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
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

function MapModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'h-11 rounded-[18px] px-4 font-inter text-xs font-extrabold transition',
        active
          ? 'bg-[var(--color-primary)] text-[var(--color-secondary-text)]'
          : 'bg-[var(--color-bg-soft)] text-[var(--color-text-primary)] hover:text-[var(--color-primary)]',
      ].join(' ')}
    >
      {children}
    </button>
  );
}