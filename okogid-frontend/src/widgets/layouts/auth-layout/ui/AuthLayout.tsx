import { Link, Outlet } from 'react-router';

import authBgLight from '../../../../shared/assets/auth/auth-bg-light.png';
import authBgDark from '../../../../shared/assets/auth/auth-bg-dark.png';

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

export function AuthLayout() {
  return (
    <div className="relative flex min-h-screen max-h-screen items-center justify-center overflow-hidden bg-[var(--color-bg)] px-4 py-10">
      <img
        src={authBgLight}
        alt=""
        aria-hidden="true"
        className="auth-bg-image auth-bg-image--light"
      />

      <img
        src={authBgDark}
        alt=""
        aria-hidden="true"
        className="auth-bg-image auth-bg-image--dark"
      />

      <div className="auth-bg-overlay" />

      <Link
        to="/"
        aria-label="Вернуться на главную"
        className="absolute left-4 top-4 z-20 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--navbar-bg)] text-[var(--color-text-primary)] shadow-xl shadow-[var(--color-shadow)] backdrop-blur-2xl transition hover:scale-105 hover:text-[var(--color-primary)] md:left-8 md:top-8"
      >
        <ArrowLeftIcon />
      </Link>

      <div className="relative z-10 w-full max-w-[460px]">
        <Outlet />
      </div>
    </div>
  );
}