import { useMemo, useState, type FormEvent } from 'react';

import {
  setAdminCameraEventWs,
  type AdminCameraEventWsResponse,
} from '../../../entities/camera/api/adminCamerasApi';
import type { AdminCamera } from '../../../entities/camera/model/adminCameraTypes';

type AdminCameraEventWsModalProps = {
  camera: AdminCamera;
  onClose: () => void;
  onSaved: (result: AdminCameraEventWsResponse) => void;
};

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

export function AdminCameraEventWsModal({
  camera,
  onClose,
  onSaved,
}: AdminCameraEventWsModalProps) {
  const [eventWsUrl, setEventWsUrl] = useState(
    'ws://192.168.1.50:8080/events',
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const payload = useMemo(() => {
    return {
      eventWsUrl: eventWsUrl.trim(),
    };
  }, [eventWsUrl]);

  const validateForm = () => {
    if (!payload.eventWsUrl) {
      return 'Введите WebSocket URL';
    }

    if (
      !payload.eventWsUrl.startsWith('ws://') &&
      !payload.eventWsUrl.startsWith('wss://')
    ) {
      return 'URL должен начинаться с ws:// или wss://';
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

      const result = await setAdminCameraEventWs(
        camera.id,
        payload,
        abortController.signal,
      );

      onSaved(result);
      onClose();
    } catch (error) {
      if (isAbortError(error)) {
        return;
      }

      const message =
        error instanceof Error
          ? error.message
          : 'Не удалось добавить Event WS';

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
        className="w-full max-w-[620px] overflow-hidden rounded-[34px] border border-[var(--color-border)] bg-[var(--navbar-bg)] shadow-2xl shadow-black/35"
      >
        <div className="border-b border-[var(--color-border)] p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-inter text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                Event WebSocket
              </p>

              <h2 className="mt-2 line-clamp-2 text-3xl font-black text-[var(--color-text-primary)]">
                {camera.title}
              </h2>

              <p className="mt-2 font-inter text-sm text-[var(--color-text-secondary)]">
                ID камеры: {camera.id}
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

        <div className="p-6">
          <label className="block">
            <span className="mb-2 block font-inter text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
              WebSocket URL событий камеры
            </span>

            <input
              value={eventWsUrl}
              onChange={(event) => setEventWsUrl(event.target.value)}
              placeholder="ws://192.168.1.50:8080/events"
              className="h-12 w-full rounded-[18px] border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-4 font-inter text-sm font-semibold text-[var(--color-text-primary)] outline-none transition placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-primary)]"
            />
          </label>

          <div className="mt-5 rounded-[24px] border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-4">
            <p className="font-inter text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
              Payload
            </p>

            <pre className="mt-3 overflow-auto rounded-[18px] bg-[#0F1318] p-4 text-xs leading-5 text-white">
              {JSON.stringify(payload, null, 2)}
            </pre>
          </div>

          {error && (
            <div className="mt-5 rounded-[22px] border border-red-500/20 bg-red-500/10 px-5 py-4 font-inter text-sm font-semibold text-red-600">
              {error}
            </div>
          )}
        </div>

        <div className="border-t border-[var(--color-border)] p-6">
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
              {isLoading ? 'Сохраняем...' : 'Добавить WS'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}