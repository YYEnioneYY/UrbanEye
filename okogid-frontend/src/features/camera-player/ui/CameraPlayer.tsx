import type { CameraStream } from '../../../entities/stream/model/types';

type CameraPlayerProps = {
  stream: CameraStream | null;
  title: string;
};

function CameraPlaceholderIcon() {
  return (
    <svg
      className="h-12 w-12 text-[var(--color-primary-text)]"
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

export function CameraPlayer({ stream, title }: CameraPlayerProps) {
  if (!stream?.playerUrl) {
    return (
      <div className="flex aspect-video w-full items-center justify-center overflow-hidden rounded-[32px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl shadow-[var(--color-shadow)] backdrop-blur-2xl">
        <div className="flex flex-col items-center px-6 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--color-primary)] shadow-lg">
            <CameraPlaceholderIcon />
          </div>

          <p className="mt-5 text-xl font-extrabold text-[var(--color-text-primary)]">
            Поток пока недоступен
          </p>

          <p className="mt-2 max-w-sm font-inter text-sm leading-6 text-[var(--color-text-secondary)]">
            Не удалось получить ссылку на трансляцию камеры.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[32px] border border-[var(--color-border)] bg-black shadow-2xl shadow-[var(--color-shadow)]">
      <div className="relative aspect-video w-full bg-black">
        <iframe
          src={stream.playerUrl}
          title={title}
          className="absolute inset-0 h-full w-full border-0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}