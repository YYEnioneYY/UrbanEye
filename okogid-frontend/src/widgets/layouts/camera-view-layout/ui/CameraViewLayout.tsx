import { Outlet, useNavigate } from 'react-router';

function ArrowLeftIcon() {
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
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

export function CameraViewLayout() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <button
        type="button"
        onClick={() => navigate(-1)}
        aria-label="Вернуться назад"
        className="fixed left-4 top-4 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--navbar-bg)] text-[var(--color-text-primary)] shadow-xl shadow-[var(--color-shadow)] backdrop-blur-2xl transition hover:scale-105 hover:text-[var(--color-primary)] md:left-8 md:top-8"
      >
        <ArrowLeftIcon />
      </button>

      <main>
        <Outlet />
      </main>
    </div>
  );
}