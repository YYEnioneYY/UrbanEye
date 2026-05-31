import { Link } from 'react-router';

function ShieldIcon() {
  return (
    <svg
      className="h-12 w-12 text-[var(--color-secondary-text)]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3 5 6v5c0 5 3.5 8.5 7 10 3.5-1.5 7-5 7-10V6l-7-3Z" />
      <path d="M9.5 12.5 11 14l3.5-4" />
    </svg>
  );
}

export function AccessDeniedPage() {
  return (
    <section className="flex min-h-[calc(100vh-112px)] items-center justify-center bg-[var(--color-bg)] px-4 py-16 text-[var(--color-text-primary)] md:px-8">
      <div className="w-full max-w-xl rounded-[36px] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center shadow-2xl shadow-[var(--color-shadow)] backdrop-blur-2xl md:p-10">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[30px] bg-[var(--color-primary)] shadow-xl shadow-[var(--color-shadow)]">
          <ShieldIcon />
        </div>

        <p className="mt-8 text-sm font-bold uppercase tracking-wide text-[var(--color-primary)]">
          Ограниченный раздел
        </p>

        <h1 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">
          Доступ запрещён
        </h1>

        <p className="mx-auto mt-4 max-w-md font-inter text-sm leading-6 text-[var(--color-text-secondary)] md:text-base">
          Эта страница доступна только администраторам. Если вы считаете, что
          это ошибка, обратитесь к владельцу проекта или войдите под аккаунтом
          администратора.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/"
            className="inline-flex h-12 items-center justify-center rounded-[18px] bg-[var(--button-third-bg)] px-6 text-sm font-bold text-[var(--button-third-text)] transition hover:scale-[1.02] hover:bg-[var(--button-third-hover)]"
          >
            На главную
          </Link>

          <Link
            to="/profile"
            className="inline-flex h-12 items-center justify-center rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface-solid)] px-6 text-sm font-bold text-[var(--color-text-primary)] transition hover:scale-[1.02] hover:text-[var(--color-primary)]"
          >
            Открыть профиль
          </Link>
        </div>
      </div>
    </section>
  );
}