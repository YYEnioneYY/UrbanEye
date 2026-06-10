type MapContextMenuProps = {
  x: number;
  y: number;
  onFindLookingAt: () => void;
  onClose: () => void;
};

function EyeIcon() {
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
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function MapContextMenu({
  x,
  y,
  onFindLookingAt,
  onClose,
}: MapContextMenuProps) {
  return (
    <>
      <button
        type="button"
        aria-label="Закрыть меню карты"
        onClick={onClose}
        className="absolute inset-0 z-30 cursor-default bg-transparent"
      />

      <div
        className="absolute z-40 w-[270px] overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-[var(--navbar-bg)] p-2 shadow-2xl shadow-[var(--color-shadow)] backdrop-blur-2xl"
        style={{
          left: x,
          top: y,
        }}
      >
        <button
          type="button"
          onClick={onFindLookingAt}
          className="flex w-full items-center gap-3 rounded-[18px] px-4 py-3 text-left transition hover:bg-[var(--color-bg-soft)]"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-[var(--color-secondary-text)]">
            <EyeIcon />
          </span>

          <span>
            <span className="block text-sm font-extrabold text-[var(--color-text-primary)]">
              Посмотреть камеры
            </span>

            <span className="mt-0.5 block font-inter text-xs leading-4 text-[var(--color-text-secondary)]">
              которые смотрят сюда
            </span>
          </span>
        </button>
      </div>
    </>
  );
}