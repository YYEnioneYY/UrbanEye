import { useNavigate } from 'react-router';

import notFoundBgLight from '../../../shared/assets/not-found/not-found-bg-light.png';
import notFoundBgDark from '../../../shared/assets/not-found/not-found-bg-dark.png';

function ArrowRightIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m13 5 7 7-7 7" />
    </svg>
  );
}

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen overflow-hidden bg-[var(--color-bg)]">
      <img
        src={notFoundBgLight}
        alt=""
        aria-hidden="true"
        className="not-found-bg-image not-found-bg-image--light"
      />

      <img
        src={notFoundBgDark}
        alt=""
        aria-hidden="true"
        className="not-found-bg-image not-found-bg-image--dark"
      />

      <div className="not-found-bg-overlay" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center text-center">
          <h1 className="text-[120px] font-extrabold leading-none tracking-tight text-[var(--color-primary)] sm:text-[160px] lg:text-[220px]">
            404
          </h1>

          <p className="mt-4 text-2xl font-bold text-[var(--color-text-primary)] sm:text-3xl lg:text-4xl">
            Похоже вы свернули не туда
          </p>

          <p className="mt-4 max-w-2xl font-inter text-sm leading-6 text-[var(--color-text-secondary)] sm:text-base">
            Страница, которую вы ищете, не найдена. Возможно, она была
            перемещена, удалена или адрес был введён с ошибкой.
          </p>

          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Вернуться назад"
            className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-[18px] bg-[var(--button-third-bg)] px-6 text-[14px] font-semibold text-[var(--button-third-text)] shadow-sm transition hover:scale-[1.02] hover:bg-[var(--button-third-hover)]"
          >
            Вернуться назад
            <ArrowRightIcon />
          </button>
        </div>
      </div>
    </section>
  );
}