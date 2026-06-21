import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react';

import type { Intersection } from '../../../entities/intersection/model/types';
import {
  updateAdminIntersection,
  type UpdateAdminIntersectionPayload,
} from '../../../entities/intersection/api/adminIntersectionsApi';

type AdminIntersectionEditModalProps = {
  intersection: Intersection;
  onClose: () => void;
  onUpdated: (intersection: Intersection) => void;
};

type FormState = {
  title: string;
  slug: string;
  description: string;
  city: string;
  address: string;
  category: string;
  status: string;
  latitude: string;
  longitude: string;
};

function createInitialForm(intersection: Intersection): FormState {
  return {
    title: intersection.title,
    slug: intersection.slug,
    description: intersection.description,
    city: intersection.city,
    address: intersection.address,
    category: intersection.category,
    status: intersection.status,
    latitude: String(intersection.latitude),
    longitude: String(intersection.longitude),
  };
}

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

export function AdminIntersectionEditModal({
  intersection,
  onClose,
  onUpdated,
}: AdminIntersectionEditModalProps) {
  const [form, setForm] = useState<FormState>(() =>
    createInitialForm(intersection),
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const payload = useMemo<UpdateAdminIntersectionPayload>(() => {
    return {
      title: form.title.trim(),
      slug: form.slug.trim(),
      description: form.description.trim(),
      city: form.city.trim(),
      address: form.address.trim(),
      category: form.category.trim(),
      status: form.status,
      latitude: normalizeNumber(form.latitude),
      longitude: normalizeNumber(form.longitude),
    };
  }, [form]);

  useEffect(() => {
    setForm(createInitialForm(intersection));
    setError(null);
  }, [intersection]);

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
    if (!payload.title) return 'Введите название перекрёстка';
    if (!payload.slug) return 'Введите slug';
    if (!payload.description) return 'Введите описание';
    if (!payload.city) return 'Введите город';
    if (!payload.address) return 'Введите адрес';
    if (!payload.category) return 'Введите категорию';
    if (!payload.status) return 'Выберите статус';

    if (!isFiniteNumber(payload.latitude)) {
      return 'Некорректная широта';
    }

    if (!isFiniteNumber(payload.longitude)) {
      return 'Некорректная долгота';
    }

    if (payload.latitude < -90 || payload.latitude > 90) {
      return 'Широта должна быть от -90 до 90';
    }

    if (payload.longitude < -180 || payload.longitude > 180) {
      return 'Долгота должна быть от -180 до 180';
    }

    return null;
  };

  const handleOverlayMouseDown = (
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
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

      const updatedIntersection = await updateAdminIntersection(
        intersection.id,
        payload,
        abortController.signal,
      );

      onUpdated(updatedIntersection);
      onClose();
    } catch (error) {
      if (isAbortError(error)) {
        return;
      }

      const message =
        error instanceof Error
          ? error.message
          : 'Не удалось обновить перекрёсток';

      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/45 px-4 py-6 backdrop-blur-sm"
      onMouseDown={handleOverlayMouseDown}
    >
      <form
        onSubmit={handleSubmit}
        onMouseDown={(event) => event.stopPropagation()}
        className="flex max-h-[calc(100vh-48px)] w-full max-w-[760px] flex-col overflow-hidden rounded-[34px] border border-[var(--color-border)] bg-[var(--navbar-bg)] shadow-2xl shadow-black/35"
      >
        <div className="shrink-0 border-b border-[var(--color-border)] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-inter text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                Редактирование
              </p>

              <h2 className="mt-2 text-3xl font-black text-[var(--color-text-primary)]">
                Перекрёсток
              </h2>

              <p className="mt-2 font-inter text-sm text-[var(--color-text-secondary)]">
                ID: {intersection.id}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-xl font-bold text-[var(--color-text-secondary)] transition hover:text-red-500"
              aria-label="Закрыть"
            >
              ×
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Название">
              <TextInput
                value={form.title}
                onChange={(event) =>
                  updateField('title', event.target.value)
                }
              />
            </Field>

            <Field label="Slug">
              <TextInput
                value={form.slug}
                onChange={(event) => updateField('slug', event.target.value)}
              />
            </Field>

            <Field label="Город">
              <TextInput
                value={form.city}
                onChange={(event) => updateField('city', event.target.value)}
              />
            </Field>

            <Field label="Категория">
              <TextInput
                value={form.category}
                onChange={(event) =>
                  updateField('category', event.target.value)
                }
              />
            </Field>

            <Field label="Статус">
              <select
                value={form.status}
                onChange={(event) => updateField('status', event.target.value)}
                className="h-12 w-full rounded-[18px] border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-4 font-inter text-sm font-semibold text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-primary)]"
              >
                <option value="active">active</option>
                <option value="inactive">inactive</option>
                <option value="planned">planned</option>
              </select>
            </Field>

            <Field label="Latitude">
              <TextInput
                value={form.latitude}
                onChange={(event) =>
                  updateField('latitude', event.target.value)
                }
              />
            </Field>

            <Field label="Longitude">
              <TextInput
                value={form.longitude}
                onChange={(event) =>
                  updateField('longitude', event.target.value)
                }
              />
            </Field>
          </div>

          <div className="mt-4">
            <Field label="Адрес">
              <TextInput
                value={form.address}
                onChange={(event) =>
                  updateField('address', event.target.value)
                }
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
              />
            </Field>
          </div>

          <div className="mt-5 rounded-[24px] border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-4">
            <p className="font-inter text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
              Payload
            </p>

            <pre className="mt-3 max-h-60 overflow-auto rounded-[18px] bg-[#0F1318] p-4 text-xs leading-5 text-white">
              {JSON.stringify(payload, null, 2)}
            </pre>
          </div>

          {error && (
            <div className="mt-5 rounded-[22px] border border-red-500/20 bg-red-500/10 px-5 py-4 font-inter text-sm font-semibold text-red-600">
              {error}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-[var(--color-border)] p-6">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="h-12 rounded-[18px] border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-6 font-inter text-sm font-bold text-[var(--color-text-primary)] transition hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Отмена
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="h-12 rounded-[18px] bg-[var(--color-primary)] px-6 font-inter text-sm font-extrabold text-[var(--color-secondary-text)] transition hover:scale-[1.01] disabled:cursor-wait disabled:opacity-70"
            >
              {isLoading ? 'Сохраняем...' : 'Сохранить изменения'}
            </button>
          </div>
        </div>
      </form>
    </div>
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